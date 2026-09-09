#!/usr/bin/env node
/**
 * sync-lively.mjs — Single source of truth sync
 *
 * Source: src/config.js  →  Target: public/LivelyProperties.json
 *
 * Keeps numeric defaults in one place. LivelyProperties.json is
 * required by Lively Wallpaper at dist/ root, but its
 * value/min/max/step/tick/items are derived from config.js.
 *
 * UI metadata (text/type/filter/folder) stays in the JSON and is
 * preserved. Only value/min/max/step/tick/items + color values
 * are overwritten.
 *
 * Usage:
 *   node scripts/sync-lively.mjs          # sync (write if drift)
 *   node scripts/sync-lively.mjs --check  # CI: exit 1 if drift, no write
 *   node scripts/sync-lively.mjs --verbose
 *
 * Hooks: package.json predev/prebuild/prezip run this automatically.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");
const CONFIG_PATH = resolve(ROOT, "src/config.js");
const LIVELY_PATH = resolve(ROOT, "public/LivelyProperties.json");

const args = process.argv.slice(2);
const isCheck = args.includes("--check");
const isVerbose = args.includes("--verbose") || args.includes("-v");

function log(...m) {
  console.log("[sync-lively]", ...m);
}
function verbose(...m) {
  if (isVerbose) console.log("[sync-lively]", ...m);
}

// Deep equal for primitives/arrays (JSON values only)
function equal(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
  return false;
}

function diffToString(key, prop, expected, actual) {
  const exp = Array.isArray(expected) ? JSON.stringify(expected) : String(expected);
  const act = Array.isArray(actual) ? JSON.stringify(actual) : String(actual);
  return `  ${key}.${prop}: ${act} → ${exp}`;
}

async function main() {
  // 1. Load config.js (ESM)
  let cfg;
  try {
    const url = pathToFileURL(CONFIG_PATH).href;
    // bust cache when running via Vite watch? use timestamp query
    cfg = await import(`${url}?t=${Date.now()}`);
  } catch (e) {
    console.error(`[sync-lively] Failed to import ${CONFIG_PATH}:`, e.message);
    process.exit(1);
  }

  const { SPEED, ASCII, MODEL, LIGHTS, COLORS, ANIMATION } = cfg;
  if (!SPEED || !ASCII || !MODEL || !LIGHTS || !COLORS || !ANIMATION) {
    console.error("[sync-lively] config.js missing expected exports (SPEED, ASCII, MODEL, LIGHTS, COLORS, ANIMATION)");
    process.exit(1);
  }

  // 2. Load LivelyProperties.json
  let json;
  let raw;
  try {
    raw = readFileSync(LIVELY_PATH, "utf8");
    json = JSON.parse(raw);
  } catch (e) {
    console.error(`[sync-lively] Failed to read ${LIVELY_PATH}:`, e.message);
    process.exit(1);
  }

  const original = JSON.stringify(json);
  const changes = [];

  // Helper to sync a slider-like entry
  function syncSlider(key, { value, min, max, step, tick }) {
    const entry = json[key];
    if (!entry) {
      changes.push(`  ${key}: missing entry, skipping`);
      return;
    }
    const updates = { value, min, max, step, tick };
    for (const [prop, expected] of Object.entries(updates)) {
      if (expected === undefined) continue; // allow config without step/tick to preserve JSON
      const actual = entry[prop];
      if (!equal(actual, expected)) {
        changes.push(diffToString(key, prop, expected, actual));
        entry[prop] = expected;
      } else {
        verbose(`ok ${key}.${prop} = ${expected}`);
      }
    }
  }

  // 3. Apply mappings — single source is config.js
  //    Preserve text/type/filter/folder/tick where not in config
  syncSlider("speed", {
    value: SPEED.default,
    min: SPEED.min,
    max: SPEED.max,
    step: SPEED.step,
    tick: SPEED.tick,
  });

  syncSlider("asciiResolution", {
    value: ASCII.resolution,
    min: ASCII.min,
    max: ASCII.max,
    step: ASCII.step,
    tick: ASCII.tick,
  });

  syncSlider("modelScale", {
    value: MODEL.scale.default,
    min: MODEL.scale.min,
    max: MODEL.scale.max,
    step: MODEL.scale.step,
    tick: MODEL.scale.tick,
  });

  syncSlider("lightIntensity", {
    value: LIGHTS.intensity.default,
    min: LIGHTS.intensity.min,
    max: LIGHTS.intensity.max,
    step: LIGHTS.intensity.step,
    tick: LIGHTS.intensity.tick,
  });

  // Colors — only value
  for (const [key, expected] of [
    ["textColor", COLORS.text],
    ["backgroundColor", COLORS.bg],
  ]) {
    const entry = json[key];
    if (!entry) {
      changes.push(`  ${key}: missing entry`);
      continue;
    }
    if (!equal(entry.value, expected)) {
      changes.push(diffToString(key, "value", expected, entry.value));
      entry.value = expected;
    }
  }

  // Animation — value is defaultIndex, items is labels
  {
    const entry = json["animation"];
    if (!entry) {
      changes.push("  animation: missing entry");
    } else {
      const expectedValue = ANIMATION.defaultIndex;
      const expectedItems = ANIMATION.labels;
      if (!equal(entry.value, expectedValue)) {
        changes.push(diffToString("animation", "value", expectedValue, entry.value));
        entry.value = expectedValue;
      }
      if (!equal(entry.items, expectedItems)) {
        changes.push(diffToString("animation", "items", expectedItems, entry.items));
        entry.items = [...expectedItems];
      }
    }
  }

  // Model select — value is basename of MODEL.defaultUrl ("models/default.glb" → "default.glb")
  {
    const entry = json["modelSelect"];
    if (entry) {
      const expected = (MODEL.defaultUrl || "models/default.glb").split("/").pop();
      if (!equal(entry.value, expected)) {
        changes.push(diffToString("modelSelect", "value", expected, entry.value));
        entry.value = expected;
      }
      // filter/folder are UI metadata, not synced — ensure they exist for safety
      if (!entry.filter) {
        entry.filter = "*.glb";
        changes.push(`  modelSelect.filter: (missing) → "*.glb"`);
      }
      if (!entry.folder) {
        entry.folder = "models";
        changes.push(`  modelSelect.folder: (missing) → "models"`);
      }
    }
  }

  const nextRaw = JSON.stringify(json, null, 2) + "\n";
  const hasChanges = JSON.stringify(json) !== original;

  if (!hasChanges) {
    log("✓ LivelyProperties.json is in sync with src/config.js");
    return;
  }

  if (isCheck) {
    console.error("[sync-lively] ✗ Drift detected — src/config.js and public/LivelyProperties.json are out of sync:");
    for (const c of changes) console.error(c);
    console.error(`\n  Run: npm run sync   (or: node scripts/sync-lively.mjs)`);
    console.error(`  Config: ${CONFIG_PATH}`);
    console.error(`  JSON:   ${LIVELY_PATH}`);
    process.exit(1);
  }

  // Write
  writeFileSync(LIVELY_PATH, nextRaw, "utf8");
  log(`✓ Synced ${changes.length} field(s) from src/config.js → public/LivelyProperties.json`);
  for (const c of changes) log(c);
}

main();
