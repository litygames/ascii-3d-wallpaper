import "./style.css";
import { createScene } from "./scene.js";
import { createAsciiController } from "./ascii.js";
import { createModelController } from "./model.js";
import { createLivelyController } from "./lively.js";
import { createAnimationController } from "./animation.js";
import { SPEED, ANIMATION, LOOP, RESIZE_DEBOUNCE } from "./config.js";

const canvas = document.getElementById("canvas");

let backgroundColor = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
let textColor = getComputedStyle(document.documentElement).getPropertyValue("--text").trim();

const { scene, camera, renderer, pivot, ambientLight, directionalLight } = createScene(canvas);
document.documentElement.style.setProperty("--bg", backgroundColor);
document.documentElement.style.setProperty("--text", textColor);

// ── Animation state (lively-controlled) ──────────────────────────
// speed renamed from rotationSpeed, same 0-5 range, controls all animations
let speed = SPEED.default; // Lively value 0-5 (not rad)
let animation = ANIMATION.default; // continuous (X+Y) — donut classic, visible in dev
let invertRotation = false;
let disableAnimation = false;

// ── Loop / Pause (hoisted before ascii for safe getter) ───────────
let isPaused = false;
let rafId = null;
let lastFrameTime = 0;
const FRAME_INTERVAL = LOOP.interval;

function setPaused(paused) {
  if (paused === isPaused) return;
  isPaused = paused;
  if (isPaused) {
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  } else {
    lastFrameTime = performance.now();
    if (rafId === null) rafId = requestAnimationFrame(animate);
  }
}

// ── Model (controller) ───────────────────────────────────────────
const modelController = createModelController({ scene, pivot, camera });

// ── AsciiEffect (controller) ───────────────────────────────────────
const asciiController = createAsciiController({
  renderer,
  scene,
  camera,
  canvas,
  getTextColor: () => textColor,
  setTextColor: (v) => {
    textColor = v;
    document.documentElement.style.setProperty("--text", v);
  },
  getBackgroundColor: () => backgroundColor,
  getIsPaused: () => isPaused,
  getModel: () => modelController.getModel(),
});

const animationController = createAnimationController({
  pivot,
  modelController,
  getSpeed: () => speed,
  getInvert: () => invertRotation,
  getDisabled: () => disableAnimation,
  getAnimation: () => animation,
});

modelController.load(`${import.meta.env.BASE_URL}models/default.glb`);

// ── Lively (controller) ────────────────────────────────────────────
const livelyController = createLivelyController({
  asciiController,
  modelController,
  scene,
  renderer,
  ambientLight,
  directionalLight,
  getSpeed: () => speed,
  setSpeed: (v) => { speed = v; },
  getAnimation: () => animation,
  setAnimation: (v) => { animation = v; },
  getInvertRotation: () => invertRotation,
  setInvertRotation: (v) => { invertRotation = v; },
  getDisableAnimation: () => disableAnimation,
  setDisableAnimation: (v) => { disableAnimation = v; },
  // legacy aliases (rotationSpeed/Speed) — keep working for old installs
  getRotationSpeed: () => speed,
  setRotationSpeed: (v) => {
    const n = Number(v);
    if (Number.isNaN(n)) return;
    // v may be rad (0.015) from old lively or speed (1.5) from new — detect by magnitude
    speed = n < 0.1 ? n * 100 : n;
  },
  getBackgroundColor: () => backgroundColor,
  setBackgroundColor: (hex) => {
    backgroundColor = hex;
    document.documentElement.style.setProperty("--bg", hex);
  },
  getTextColor: () => textColor,
  setTextColor: (hex) => {
    textColor = hex;
    document.documentElement.style.setProperty("--text", hex);
  },
  setPaused,
});

// ── Animation loop (30 FPS, 0% CPU when paused) ──────────────────────
function animate(now) {
  if (isPaused) { rafId = null; return; }
  rafId = requestAnimationFrame(animate);
  const activeModel = modelController.getModel();
  if (!activeModel) return;
  if (now - lastFrameTime < FRAME_INTERVAL) return;
  lastFrameTime = now;

  animationController.update(now);

  if (asciiController.isEnabled()) asciiController.render();
  else renderer.render(scene, camera);
}

rafId = requestAnimationFrame(animate);

// ── Resize ─────────────────────────────────────────────────────────
let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    camera.lookAt(0, 0, 0);
    if (asciiController.isEnabled()) asciiController.setSize(window.innerWidth, window.innerHeight);
    else renderer.setSize(window.innerWidth, window.innerHeight);
  }, RESIZE_DEBOUNCE);
});
