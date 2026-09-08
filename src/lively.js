/**
 * lively.js — Lively Wallpaper integration
 * Handles LivelyProperties.json dispatch and pause bridge.
 * No large if/else chain for animations — delegates to animation registry.
 */
import * as THREE from "three";
import { normalizeColor } from "./utils/color.js";
import { LIGHTS, SPEED, ANIMATION } from "./config.js";
import { normalizeAnimation } from "./animation.js";

export function createLivelyController({
  asciiController,
  modelController,
  scene,
  renderer,
  ambientLight,
  directionalLight,
  // new animation API
  getSpeed,
  setSpeed,
  getAnimation,
  setAnimation,
  getInvertRotation,
  setInvertRotation,
  getDisableAnimation,
  setDisableAnimation,
  // legacy alias (kept for old installs with rotationSpeed)
  getRotationSpeed,
  setRotationSpeed,
  getBackgroundColor,
  setBackgroundColor,
  getTextColor,
  setTextColor,
  setPaused,
}) {
  // Fallback to legacy if new API not provided (during transition)
  const _getSpeed = getSpeed || getRotationSpeed;
  const _setSpeed = setSpeed || setRotationSpeed;

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

  function applySpeed(val) {
    const n = Number(val);
    if (Number.isNaN(n)) return;
    const clamped = n < SPEED.min ? SPEED.min : n > SPEED.max ? SPEED.max : n;
    _setSpeed(clamped);
  }

  function isTruthy(val) {
    return val === true || val === 1 || val === "true" || val === "1";
  }

  function isFalsy(val) {
    return val === false || val === 0 || val === "false" || val === "0";
  }

  // Scalable dispatch: animation registry handles new animations without if/else growth
  window.livelyPropertyListener = (name, val) => {
    // Speed (renamed from rotationSpeed, same 0-5)
    if (name === "speed") {
      applySpeed(val);
      return;
    }
    if (name === "rotationSpeed" || name === "Speed") {
      const n = Number(val);
      if (Number.isNaN(n)) return;
      // rotationSpeed was 0-5 (same as speed), Speed was 1-100 — normalize both to 0-5
      if (name === "Speed" && n > 5) {
        applySpeed(n / 20); // 100 -> 5, 50 -> 2.5
        return;
      }
      // rotationSpeed/Speed alias: detect rad (0.015) vs speed (1.5) by magnitude
      if (n < 0.1 && n !== 0) {
        // Likely old rad value (n*0.01) — convert back to speed
        applySpeed(n * 100);
      } else {
        applySpeed(n);
      }
      return;
    }

    // Animation dropdown: Lively sends index 0..5, dev may send string key
    if (name === "animation" || name === "Animation") {
      const key = normalizeAnimation(val);
      if (setAnimation) setAnimation(key);
      // If disable is active, value is stored but ignored by animation controller (early-return)
      return;
    }

    if (name === "invertRotation" || name === "Invert rotation" || name === "invert") {
      if (isFalsy(val)) {
        if (setInvertRotation) setInvertRotation(false);
        else if (setDisableAnimation) setDisableAnimation(false);
      } else {
        const enabled = isTruthy(val);
        if (setInvertRotation) setInvertRotation(enabled);
      }
      return;
    }

    if (name === "disableAnimation" || name === "Disable animation" || name === "disable") {
      if (isFalsy(val)) {
        if (setDisableAnimation) setDisableAnimation(false);
      } else {
        const disabled = isTruthy(val);
        if (setDisableAnimation) setDisableAnimation(disabled);
        // Note: Lively does not expose API to visually disable controls dynamically.
        // We store the value and animationController will ignore animation/invert while disabled.
      }
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
      const isFalse = isFalsy(val);
      const enabled = isTruthy(val);
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

  // ── isLively + pause bridge (0% CPU) ─────────────────────────────
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
    applyTextColor,
    applyBackgroundColor,
    applyLightIntensity,
    applySpeed,
  };
}
