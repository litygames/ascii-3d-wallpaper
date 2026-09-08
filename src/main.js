import "./style.css";
import { createScene } from "./scene.js";
import { createAsciiController } from "./ascii.js";
import { createModelController } from "./model.js";
import { createLivelyController } from "./lively.js";

const canvas = document.getElementById("canvas");

let backgroundColor = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
let textColor = getComputedStyle(document.documentElement).getPropertyValue("--text").trim();

const { scene, camera, renderer, pivot, ambientLight, directionalLight } = createScene(canvas);
document.documentElement.style.setProperty("--bg", backgroundColor);
document.documentElement.style.setProperty("--text", textColor);

// ── Loop / Pause (hoisted before ascii for safe getter) ───────────
let rotationSpeed = 0.015;
let isPaused = false;
let rafId = null;
let lastFrameTime = 0;
const FRAME_INTERVAL = 1000 / 30;

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

modelController.load(`${import.meta.env.BASE_URL}models/default.glb`);

// ── Lively (controller) ────────────────────────────────────────────
const livelyController = createLivelyController({
  asciiController,
  modelController,
  scene,
  renderer,
  ambientLight,
  directionalLight,
  getRotationSpeed: () => rotationSpeed,
  setRotationSpeed: (v) => { rotationSpeed = v; },
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

  pivot.rotation.y += rotationSpeed * 2;

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
  }, 100);
});
