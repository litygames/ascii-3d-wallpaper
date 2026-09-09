/**
 * ascii.js — AsciiEffect lifecycle controller
 * Preserves exact logic from src/main.js:
 *  - charset " .,-~:;=!*#$@", invert:true, scale:1, color/block/alpha false, medium
 *  - resolution clamp 0.1-0.25, default 0.12, debounce 50ms
 *  - toggle via setEnabled() removes/creates effect, appendChild, scene 0x000000 vs backgroundColor
 *  - reapplies backgroundColor/textColor and immediate render on resolution change
 *  - no behavior change, only responsibility separation
 */
import * as THREE from "three";
import { AsciiEffect } from "./asciiEffect.js";
import { ASCII, COLORS } from "./config.js";

export function createAsciiController({
  renderer,
  scene,
  camera,
  canvas,
  getTextColor,
  setTextColor,
  getBackgroundColor,
  getIsPaused,
  getModel,
}) {
  let asciiResolution = ASCII.resolution;
  let asciiStretch = ASCII.stretch;
  const asciiCharset = ASCII.charset;
  let asciiEnabled = true;
  let pendingTimer = null;

  function createAsciiEffect(resolution, stretch, colorHex) {
    const eff = new AsciiEffect(renderer, asciiCharset, {
      invert: ASCII.invert,
      resolution,
      stretch,
      scale: ASCII.scale,
      color: ASCII.color,
      block: ASCII.block,
      alpha: ASCII.alpha,
      strResolution: ASCII.strResolution,
    });
    eff.setSize(window.innerWidth, window.innerHeight);
    const currentText = getTextColor();
    if (colorHex && colorHex !== currentText) {
      setTextColor(colorHex);
    }
    return eff;
  }

  let effect = createAsciiEffect(asciiResolution, asciiStretch, getTextColor());
  canvas.style.display = "none";
  document.body.appendChild(effect.domElement);

  function setEnabled(enabled) {
    const next = !!enabled;
    if (next === asciiEnabled) return;
    asciiEnabled = next;
    if (asciiEnabled) {
      canvas.style.display = "none";
      if (effect.domElement.parentNode) effect.domElement.remove();
      effect = createAsciiEffect(asciiResolution, asciiStretch, getTextColor());
      document.body.appendChild(effect.domElement);
      scene.background = new THREE.Color(COLORS.sceneAscii);
      renderer.setClearColor(COLORS.sceneAscii, 1);
    } else {
      if (effect.domElement.parentNode) effect.domElement.remove();
      canvas.style.display = "block";
      renderer.setSize(window.innerWidth, window.innerHeight);
      const bg = getBackgroundColor();
      scene.background = new THREE.Color(bg);
      renderer.setClearColor(bg, 1);
    }
  }

  function applyResolution(newRes) {
    const r = Number(newRes);
    if (Number.isNaN(r)) return;
    const clamped = r < ASCII.min ? ASCII.min : r > ASCII.max ? ASCII.max : r;
    if (clamped === asciiResolution) return;
    asciiResolution = clamped;
    clearTimeout(pendingTimer);
    pendingTimer = setTimeout(() => {
      if (!asciiEnabled) return;
      const c = getTextColor();
      effect.domElement.remove();
      effect = createAsciiEffect(asciiResolution, asciiStretch, c);
      document.body.appendChild(effect.domElement);
      scene.background = new THREE.Color(COLORS.sceneAscii);
      renderer.setClearColor(COLORS.sceneAscii, 1);
      if (!getIsPaused() && getModel()) effect.render(scene, camera);
    }, ASCII.debounce);
  }

  function applyStretch(newStretch) {
    const s = Number(newStretch);
    if (Number.isNaN(s)) return;
    const clamped =
      s < ASCII.stretchMin ? ASCII.stretchMin : s > ASCII.stretchMax ? ASCII.stretchMax : s;
    if (clamped === asciiStretch) return;
    asciiStretch = clamped;
    clearTimeout(pendingTimer);
    pendingTimer = setTimeout(() => {
      if (!asciiEnabled) return;
      const c = getTextColor();
      effect.domElement.remove();
      effect = createAsciiEffect(asciiResolution, asciiStretch, c);
      document.body.appendChild(effect.domElement);
      scene.background = new THREE.Color(COLORS.sceneAscii);
      renderer.setClearColor(COLORS.sceneAscii, 1);
      if (!getIsPaused() && getModel()) effect.render(scene, camera);
    }, ASCII.debounce);
  }

  function setSize(w, h) {
    effect.setSize(w, h);
  }

  function render() {
    effect.render(scene, camera);
  }

  function isEnabled() {
    return asciiEnabled;
  }

  function getEffect() {
    return effect;
  }

  function getResolution() {
    return asciiResolution;
  }

  function getStretch() {
    return asciiStretch;
  }

  return {
    getEffect,
    isEnabled,
    getResolution,
    getStretch,
    setEnabled,
    applyResolution,
    applyStretch,
    setSize,
    render,
    // expose for tests / debugging if needed
    _createAsciiEffect: createAsciiEffect,
  };
}
