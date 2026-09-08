/**
 * config.js — Centralized constants for ascii-3d-wallpaper
 * Single source of truth for values that appear in both
 * LivelyProperties.json and src/main.js (and related modules).
 * Preserves exact current behavior — do NOT change values without
 * updating LivelyProperties.json and verifying Lively integration.
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
  resolution: 0.12,
  min: 0.1,
  max: 0.25,
  debounce: 50,
  invert: true,
  scale: 1,
  color: false,
  block: false,
  alpha: false,
  strResolution: "medium",
};

// ── Lights ─────────────────────────────────────────────────────────
export const LIGHTS = {
  ambient: 1.2,
  directional: 1.5,
  position: [2, 3, 2],
  ratio: 1.25,
  intensity: {
    min: 0.5,
    max: 3,
    default: 1.8,
  },
};

// ── Model ──────────────────────────────────────────────────────────
export const MODEL = {
  scale: {
    min: 0.5,
    max: 3,
    default: 1,
  },
  baseFit: 2, // baseScale = 2 / maxDim (auto-fit ~2 units)
  defaultUrl: "models/default.glb",
};

// ── Rotation ───────────────────────────────────────────────────────
export const ROTATION = {
  defaultLively: 1.5, // LivelyProperties.json value 0-5
  defaultRad: 0.015, // 1.5 * 0.01
  factor: 2, // pivot.rotation.y += rotationSpeed * 2 (throttle 30fps)
  mapLivelyToRad: (v) => v * 0.01,
};

// ── Loop ───────────────────────────────────────────────────────────
export const LOOP = {
  fps: 30,
  interval: 1000 / 30,
};

// ── Resize ─────────────────────────────────────────────────────────
export const RESIZE_DEBOUNCE = 100;
