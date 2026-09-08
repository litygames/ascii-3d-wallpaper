/**
 * math.js — Tiny math helpers preserving exact clamping style of main.js
 * Uses ternary clamp to stay consistent with existing code:
 *   v < min ? min : v > max ? max : v
 */

/**
 * Clamp value between min and max (ternary style).
 * @param {number} v
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}
