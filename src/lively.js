/**
 * lively.js — Lively Wallpaper integration
 * Preserves exact behavior from src/main.js:
 *  - window.livelyPropertyListener dispatch with aliases
 *  - isLively detection (chrome.webview || userAgent lively || file:)
 *  - livelyWallpaperPlaybackChanged / livelyWallpaperPause / Play
 *  - visibilitychange + blur/focus guards (isLively)
 *  - normalizeColor via utils/color, clamp via config ranges
 */
import * as THREE from "three";
import { normalizeColor } from "./utils/color.js";
import { LIGHTS } from "./config.js";

export function createLivelyController({
  asciiController,
  modelController,
  scene,
  renderer,
  ambientLight,
  directionalLight,
  getRotationSpeed,
  setRotationSpeed,
  getBackgroundColor,
  setBackgroundColor,
  getTextColor,
  setTextColor,
  setPaused,
}) {
  // ── Color helpers (preserve main.js logic, now via utils) ────────
  function applyTextColor(val) {
    const hex = normalizeColor(val);
    if (!hex) return;
    setTextColor(hex);
  }

  function applyBackgroundColor(val) {
    const hex = normalizeColor(val);
    if (!hex) return;
    setBackgroundColor(hex);
    if (!asciiController.isEnabled()) {
      scene.background = new THREE.Color(hex);
      renderer.setClearColor(hex, 1);
    } else {
      scene.background = new THREE.Color(0x000000);
      renderer.setClearColor(0x000000, 1);
    }
  }

  function applyLightIntensity(val) {
    const v = Number(val);
    if (Number.isNaN(v)) return;
    const c = v < LIGHTS.intensity.min ? LIGHTS.intensity.min : v > LIGHTS.intensity.max ? LIGHTS.intensity.max : v;
    ambientLight.intensity = c;
    directionalLight.intensity = c * LIGHTS.ratio;
  }

  // ── Property dispatch (preserve aliases) ─────────────────────────
  window.livelyPropertyListener = (name, val) => {
    if (name === "rotationSpeed" || name === "Speed") {
      const n = Number(val);
      if (!Number.isNaN(n)) setRotationSpeed(n * 0.01);
      return;
    }
    if (name === "asciiResolution") {
      asciiController.applyResolution(val);
      return;
    }
    if (name === "textColor" || name === "asciiColor" || name === "fontColor") {
      applyTextColor(val);
      return;
    }
    if (name === "backgroundColor") {
      applyBackgroundColor(val);
      return;
    }
    if (name === "enableAscii") {
      const isFalse = val === false || val === 0 || val === "false" || val === "0";
      const enabled = val === true || val === 1 || val === "true" || val === "1";
      asciiController.setEnabled(isFalse ? false : enabled);
      return;
    }
    if (name === "lightIntensity" || name === "brightness") {
      applyLightIntensity(val);
      return;
    }
    if (name === "modelScale" || name === "scale" || name === "modelSize") {
      modelController.applyScale(val);
      return;
    }
    if (name === "modelSelect") {
      if (val == null || val === "") {
        console.warn("modelSelect: null/empty value, keeping current model");
        return;
      }
      const url = modelController.resolveUrl(val);
      if (!url) {
        console.warn("modelSelect: could not resolve URL for", val);
        return;
      }
      modelController.load(url);
    }
  };

  // ── isLively + pause bridge ──────────────────────────────────────
  let isLively =
    typeof window !== "undefined" &&
    (!!window.chrome?.webview ||
      navigator.userAgent.toLowerCase().includes("lively") ||
      location.protocol === "file:");

  window.livelyWallpaperPlaybackChanged = (data) => {
    isLively = true;
    setPaused(!!data.IsPaused);
  };
  document.addEventListener("livelyWallpaperPause", () => {
    isLively = true;
    setPaused(true);
  });
  document.addEventListener("livelyWallpaperPlay", () => {
    isLively = true;
    setPaused(false);
  });
  document.addEventListener("visibilitychange", () => setPaused(document.hidden));
  window.addEventListener("blur", () => {
    if (isLively) return;
    setPaused(true);
  });
  window.addEventListener("focus", () => {
    if (isLively) return;
    if (document.hidden) return;
    setPaused(false);
  });

  return {
    getIsLively: () => isLively,
    // expose for tests
    applyTextColor,
    applyBackgroundColor,
    applyLightIntensity,
  };
}
