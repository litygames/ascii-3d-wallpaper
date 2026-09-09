/**
 * config.js — Centralized constants for ascii-3d-wallpaper
 * Single source of truth for values that appear in both
 * LivelyProperties.json and src/main.js (and related modules).
 * The canonical source for Lively defaults — run `npm run sync`
 * to propagate changes to public/LivelyProperties.json (or it runs
 * automatically on `npm run dev` / `npm run build` via pre hooks).
 * Do NOT edit public/LivelyProperties.json value/min/max/step/tick/items
 * manually — edit here and sync.
 */

// ── Camera ─────────────────────────────────────────────────────────
export const CAMERA = {
  fov: 75,
  near: 0.1,
  far: 1000,
  position: [0, 0, 2.5],
};

// ── Renderer ───────────────────────────────────────────────────────
export const RENDERER = {
  antialias: false,
  powerPreference: "low-power",
  stencil: false,
  alpha: false,
  pixelRatio: 1,
  shadowMapEnabled: false,
  sortObjects: false,
};

// ── Scene / Colors ─────────────────────────────────────────────────
// Defaults match :root in src/style.css and public/LivelyProperties.json
export const COLORS = {
  bg: "#0D110F",
  text: "#39FF88",
  sceneAscii: 0x000000,
};

// ── ASCII Effect ───────────────────────────────────────────────────
export const ASCII = {
  charset: " .,-~:;=!*#$@",
  resolution: 0.14,
  min: 0.1,
  max: 0.25,
  step: 0.01,
  tick: 0.05,
  debounce: 50,
  invert: true,
  scale: 1,
  color: false,
  block: false,
  alpha: false,
  strResolution: "medium",
};

// ── Lights ─────────────────────────────────────────────────────────
// Natural mapping: 0.5 → " .", 3.2 → "#", 5.0 → "@" (full charset)
export const LIGHTS = {
  ambient: 3.2,
  directional: 4.8, // intensity.default * ratio
  position: [2, 3, 2],
  ratio: 1.5,
  intensity: {
    min: 0.5,
    max: 5,
    default: 3.2,
    step: 0.1,
    tick: 0.5,
  },
};

// ── Model ──────────────────────────────────────────────────────────
export const MODEL = {
  scale: {
    min: 0.5,
    max: 3,
    default: 1,
    step: 0.1,
    tick: 0.5,
  },
  baseFit: 2, // baseScale = 2 / maxDim (auto-fit ~2 units)
  defaultUrl: "models/default.glb",
};

// ── Speed ──────────────────────────────────────────────────────────
// Renamed from ROTATION (kept alias for compat). Controls all animations.
// min 0.1 — never reaches 0, Disable checkbox is the single off-switch
export const SPEED = {
  min: 0.1,
  max: 5,
  default: 1.5, // LivelyProperties.json value 0.1-5
  step: 0.1,
  tick: 0.1,
  defaultRad: 0.015, // 1.5 * 0.01
  factor: 2, // legacy Y rotation: pivot.rotation.y += speed * 2
  map: (v) => v * 0.01,
};
// Alias for backward compat (old main.js / lively.js may import ROTATION)
export const ROTATION = SPEED;

// ── Animation ──────────────────────────────────────────────────────
export const ANIMATION = {
  default: "continuous",
  defaultIndex: 0,
  // Ordered as in LivelyProperties.json dropdown items
  keys: ["continuous", "floating", "wobble", "breathing", "yRotation", "xRotation"],
  labels: [
    "Continuous rotation",
    "Floating",
    "Wobble",
    "Breathing",
    "Y Rotation",
    "X Rotation",
  ],
  // Helpers for Lively dropdown (value is index 0..5 or string key)
  indexToKey: ["continuous", "floating", "wobble", "breathing", "yRotation", "xRotation"],
  keyToIndex: {
    continuous: 0,
    floating: 1,
    wobble: 2,
    breathing: 3,
    yRotation: 4,
    xRotation: 5,
  },
  // Tunable params per animation (professional defaults, easy to extend)
  params: {
    continuous: { yFactor: 2, xFactor: 1.2 }, // donut classic: Y faster than X
    yRotation: { factor: 2 }, // right, same as legacy
    xRotation: { factor: 2 }, // up
    floating: { amplitude: 0.18, frequency: 0.0012 },
    wobble: { zAmplitude: 0.22, xAmplitude: 0.14, frequency: 0.0011 },
    breathing: { amplitude: 0.09, frequency: 0.001 },
  },
};

// ── Loop ───────────────────────────────────────────────────────────
export const LOOP = {
  fps: 30,
  interval: 1000 / 30,
};

// ── Resize ─────────────────────────────────────────────────────────
export const RESIZE_DEBOUNCE = 100;
