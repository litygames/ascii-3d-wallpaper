#!/usr/bin/env node
// Cross-platform zip for dist/ — works on Windows, Linux and GitHub Actions.
// Replaces the Windows-only `powershell Compress-Archive` script.
// Uses Node built-ins + fallback to system `zip` / `powershell` if available.

import { createWriteStream, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = resolve(import.meta.dirname ?? ".", "..");
const DIST = join(ROOT, "dist");
const OUT = join(DIST, "ascii-3d-wallpaper.zip");

if (!existsSync(DIST)) {
  console.error("[zip] dist/ not found — run `npm run build` first.");
  process.exit(1);
}

// Try system `zip` (Linux/macOS) first — fastest, preserves structure
function trySystemZip() {
  const hasZip = spawnSync("zip", ["-v"], { stdio: "ignore" });
  if (hasZip.error) return false;
  // zip -r dist/ascii-3d-wallpaper.zip . inside dist/
  const res = spawnSync("zip", ["-r", OUT, "."], { cwd: DIST, stdio: "inherit" });
  return res.status === 0;
}

function tryPowerShell() {
  const res = spawnSync(
    "powershell",
    ["-NoProfile", "-Command", `Compress-Archive -Path dist/* -DestinationPath dist/ascii-3d-wallpaper.zip -Force`],
    { cwd: ROOT, stdio: "inherit", shell: true }
  );
  return res.status === 0;
}

// Pure Node fallback using `archiver` if installed, otherwise manual via `node:zlib` is not needed
// — we keep it simple: try system zip, then powershell, then archiver
async function tryArchiver() {
  try {
    const archiver = (await import("archiver")).default;
    const output = createWriteStream(OUT);
    const archive = archiver("zip", { zlib: { level: 9 } });
    return new Promise((res, rej) => {
      output.on("close", () => {
        console.log(`[zip] Created ${relative(ROOT, OUT)} (${archive.pointer()} bytes)`);
        res(true);
      });
      archive.on("error", rej);
      archive.pipe(output);
      // add everything in dist/ except the zip itself
      const entries = readdirSync(DIST);
      for (const e of entries) {
        if (e === "ascii-3d-wallpaper.zip") continue;
        const p = join(DIST, e);
        const stat = statSync(p);
        if (stat.isDirectory()) archive.directory(p, e);
        else archive.file(p, { name: e });
      }
      archive.finalize();
    });
  } catch {
    return false;
  }
}

let ok = trySystemZip();
if (!ok) ok = tryPowerShell();
if (!ok) {
  console.log("[zip] System zip/powershell not available, trying archiver...");
  ok = await tryArchiver();
}
if (!ok) {
  console.error(
    "[zip] No zip method available.\n" +
      "  • On Windows: powershell should be available, or\n" +
      "  • On Linux/macOS: install `zip` (apt install zip), or\n" +
      "  • npm install -D archiver"
  );
  process.exit(1);
}
if (existsSync(OUT)) console.log(`[zip] Done → ${relative(ROOT, OUT)}`);
