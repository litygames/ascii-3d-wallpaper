import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { AsciiEffect } from "./asciiEffect.js";
import "./style.css";

THREE.Cache.enabled = true;

const canvas = document.getElementById("canvas");

let backgroundColor = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
let textColor = getComputedStyle(document.documentElement).getPropertyValue("--text").trim();

// ── Scene / Camera / Renderer ─────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 2.5);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  powerPreference: "low-power",
  stencil: false,
  alpha: false,
});
renderer.setPixelRatio(1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
document.documentElement.style.setProperty("--bg", backgroundColor);
document.documentElement.style.setProperty("--text", textColor);
renderer.shadowMap.enabled = false;
renderer.sortObjects = false;

// ── AsciiEffect ────────────────────────────────────────────────────
let asciiResolution = 0.2;
const asciiCharset = " .,-~:;=!*#$@";
let asciiEnabled = true;

function createAsciiEffect(resolution, colorHex) {
  const eff = new AsciiEffect(renderer, asciiCharset, {
    invert: true,
    resolution,
    scale: 1,
    color: false,
    block: false,
    alpha: false,
    strResolution: "medium",
  });
  eff.setSize(window.innerWidth, window.innerHeight);
  if (colorHex && colorHex !== textColor) {
    textColor = colorHex;
    document.documentElement.style.setProperty("--text", textColor);
  }
  return eff;
}

let effect = createAsciiEffect(asciiResolution, textColor);

function setAsciiEnabled(enabled) {
  const next = !!enabled;
  if (next === asciiEnabled) return;
  asciiEnabled = next;
  if (asciiEnabled) {
    canvas.style.display = "none";
    if (effect.domElement.parentNode) effect.domElement.remove();
    effect = createAsciiEffect(asciiResolution, textColor);
    document.body.appendChild(effect.domElement);
    scene.background = new THREE.Color(0x000000);
    renderer.setClearColor(0x000000, 1);
  } else {
    if (effect.domElement.parentNode) effect.domElement.remove();
    canvas.style.display = "block";
    renderer.setSize(window.innerWidth, window.innerHeight);
    scene.background = new THREE.Color(backgroundColor);
    renderer.setClearColor(backgroundColor, 1);
  }
}

canvas.style.display = "none";
document.body.appendChild(effect.domElement);

// ── Lights ─────────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(2, 3, 2);
scene.add(directionalLight);

function applyLightIntensity(val) {
  const v = Number(val);
  if (Number.isNaN(v)) return;
  const c = v < 0.5 ? 0.5 : v > 3 ? 3 : v;
  ambientLight.intensity = c;
  directionalLight.intensity = c * 1.25;
}

// ── Pivot + Model ──────────────────────────────────────────────────
const pivot = new THREE.Group();
scene.add(pivot);

const loader = new GLTFLoader();
let model = null;
let currentModelPath = null;
let isLoadingModel = false;
let baseScale = 1;
let modelScale = 1;

// Reusables to avoid GC on each loadModel
const tmpBox = new THREE.Box3();
const tmpCenter = new THREE.Vector3();
const tmpSize = new THREE.Vector3();

function applyModelScale(val) {
  const v = Number(val);
  if (Number.isNaN(v)) return;
  const c = v < 0.5 ? 0.5 : v > 3 ? 3 : v;
  modelScale = c;
  if (model) {
    model.scale.setScalar(baseScale * modelScale);
    model.updateMatrixWorld(true);
  }
}

function clearModel() {
  if (!model) return;
  pivot.remove(model);
  model.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (let i = 0; i < mats.length; i++) {
        const m = mats[i];
        if (m.map) m.map.dispose();
        if (m.dispose) m.dispose();
      }
    }
  });
  model = null;
}

function resolveModelUrl(val) {
  if (val == null) return null;
  let p = String(val).trim().replace(/\\/g, "/");
  if (!p) return null;
  try { p = decodeURIComponent(p); } catch (_) {}
  if (/^(https?:|file:|blob:)/i.test(p)) return p;
  if (p.startsWith("/")) p = p.slice(1);
  if (!p.startsWith("models/")) {
    if (p.includes("/")) p = `models/${p.split("/").pop()}`;
    else p = `models/${p}`;
  }
  return `${import.meta.env.BASE_URL}${p}`;
}

function setupModel(gltfScene) {
  model = gltfScene;

  tmpBox.setFromObject(model);
  tmpBox.getCenter(tmpCenter);
  model.position.sub(tmpCenter);

  tmpBox.getSize(tmpSize);
  const maxDim = tmpSize.x > tmpSize.y
    ? (tmpSize.x > tmpSize.z ? tmpSize.x : tmpSize.z)
    : (tmpSize.y > tmpSize.z ? tmpSize.y : tmpSize.z);
  baseScale = maxDim > 0 ? 2 / maxDim : 1;
  model.scale.setScalar(baseScale * modelScale);
  model.updateMatrixWorld(true);

  // Re-center after scaling (fix GLBs with offset ground)
  tmpBox.setFromObject(model);
  tmpBox.getCenter(tmpCenter);
  if (tmpCenter.lengthSq() > 1e-6) {
    model.position.sub(tmpCenter);
    model.updateMatrixWorld(true);
  }

  pivot.add(model);
  pivot.position.set(0, 0, 0);
  pivot.updateMatrixWorld(true);
  camera.lookAt(0, 0, 0);
}

function loadModel(url, { fallback = true } = {}) {
  if (!url) return;
  if (currentModelPath === url && model) return;
  isLoadingModel = true;
  loader.load(
    url,
    (gltf) => {
      clearModel();
      setupModel(gltf.scene);
      currentModelPath = url;
      isLoadingModel = false;
    },
    undefined,
    (error) => {
      console.error(`Error loading ${url}:`, error);
      isLoadingModel = false;
      if (fallback && url !== `${import.meta.env.BASE_URL}models/default.glb`) {
        console.warn(`Retrying fallback ${import.meta.env.BASE_URL}models/default.glb`);
        loadModel(`${import.meta.env.BASE_URL}models/default.glb`, { fallback: false });
      }
    }
  );
}

loadModel(`${import.meta.env.BASE_URL}models/default.glb`);

// ── Loop / Pause ───────────────────────────────────────────────────
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

// Color/resolution helpers
function normalizeColor(val) {
  if (typeof val !== "string") return null;
  const v = val.trim();
  if (v.startsWith("#")) return v;
  if (v.startsWith("0x")) return "#" + v.slice(2);
  const parts = v.split(/[\s,]+/).map(Number).filter((n) => !Number.isNaN(n));
  if (parts.length === 3) {
    const r = parts[0] <= 1 ? Math.round(parts[0] * 255) : Math.round(parts[0]);
    const g = parts[1] <= 1 ? Math.round(parts[1] * 255) : Math.round(parts[1]);
    const b = parts[2] <= 1 ? Math.round(parts[2] * 255) : Math.round(parts[2]);
    const clamp = (n) => (n < 0 ? 0 : n > 255 ? 255 : n);
    return `#${[clamp(r), clamp(g), clamp(b)].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
  }
  return v;
}

let pendingResolutionTimer = null;
function applyAsciiResolution(newRes) {
  const r = Number(newRes);
  if (Number.isNaN(r)) return;
  const clamped = r < 0.1 ? 0.1 : r > 0.25 ? 0.25 : r;
  if (clamped === asciiResolution) return;
  asciiResolution = clamped;
  clearTimeout(pendingResolutionTimer);
  pendingResolutionTimer = setTimeout(() => {
    if (!asciiEnabled) return;
    const c = textColor;
    effect.domElement.remove();
    effect = createAsciiEffect(asciiResolution, c);
    document.body.appendChild(effect.domElement);
    scene.background = new THREE.Color(0x000000);
    renderer.setClearColor(0x000000, 1);
    if (!isPaused && model) effect.render(scene, camera);
  }, 50);
}

function applyTextColor(val) {
  const hex = normalizeColor(val);
  if (!hex) return;
  textColor = hex;
  document.documentElement.style.setProperty("--text", hex);
}

function applyBackgroundColor(val) {
  const hex = normalizeColor(val);
  if (!hex) return;
  backgroundColor = hex;
  document.documentElement.style.setProperty("--bg", hex);
  if (!asciiEnabled) {
    scene.background = new THREE.Color(hex);
    renderer.setClearColor(hex, 1);
  } else {
    scene.background = new THREE.Color(0x000000);
    renderer.setClearColor(0x000000, 1);
  }
}

// ── Lively hooks ───────────────────────────────────────────────────
window.livelyPropertyListener = (name, val) => {
  if (name === "rotationSpeed" || name === "Speed") {
    const n = Number(val);
    if (!Number.isNaN(n)) rotationSpeed = n * 0.01;
    return;
  }
  if (name === "asciiResolution") { applyAsciiResolution(val); return; }
  if (name === "textColor" || name === "asciiColor" || name === "fontColor") { applyTextColor(val); return; }
  if (name === "backgroundColor") { applyBackgroundColor(val); return; }
  if (name === "enableAscii") {
    const isFalse = val === false || val === 0 || val === "false" || val === "0";
    const enabled = val === true || val === 1 || val === "true" || val === "1";
    setAsciiEnabled(isFalse ? false : enabled);
    return;
  }
  if (name === "lightIntensity" || name === "brightness") { applyLightIntensity(val); return; }
  if (name === "modelScale" || name === "scale" || name === "modelSize") { applyModelScale(val); return; }
  if (name === "modelSelect") {
    if (val == null || val === "") {
      console.warn("modelSelect: null/empty value, keeping current model");
      return;
    }
    const url = resolveModelUrl(val);
    if (!url) { console.warn("modelSelect: could not resolve URL for", val); return; }
    loadModel(url);
  }
};

let isLively =
  typeof window !== "undefined" &&
  (!!window.chrome?.webview ||
    navigator.userAgent.toLowerCase().includes("lively") ||
    location.protocol === "file:");

window.livelyWallpaperPlaybackChanged = (data) => {
  isLively = true;
  setPaused(!!data.IsPaused);
};
document.addEventListener("livelyWallpaperPause", () => { isLively = true; setPaused(true); });
document.addEventListener("livelyWallpaperPlay", () => { isLively = true; setPaused(false); });
document.addEventListener("visibilitychange", () => setPaused(document.hidden));
window.addEventListener("blur", () => { if (isLively) return; setPaused(true); });
window.addEventListener("focus", () => {
  if (isLively) return;
  if (document.hidden) return;
  setPaused(false);
});

// ── Animation loop (30 FPS, 0% CPU when paused) ──────────────────────
function animate(now) {
  if (isPaused) { rafId = null; return; }
  rafId = requestAnimationFrame(animate);
  if (!model) return;
  if (now - lastFrameTime < FRAME_INTERVAL) return;
  lastFrameTime = now;

  pivot.rotation.y += rotationSpeed * 2;

  if (asciiEnabled) effect.render(scene, camera);
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
    if (asciiEnabled) effect.setSize(window.innerWidth, window.innerHeight);
    else renderer.setSize(window.innerWidth, window.innerHeight);
  }, 100);
});
