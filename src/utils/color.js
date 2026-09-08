/**
 * color.js — Color normalization for Lively Wallpaper
 * Preserves exact logic from src/main.js normalizeColor().
 * Supports formats Lively may send:
 *  - "#rrggbb" (standard)
 *  - "0xrrggbb" (alternative)
 *  - "255 255 255" or "255,255,255" (0-255)
 *  - "r g b" 0-1 float (e.g. "0.2 1 0.53")
 */

/**
 * Normalize a Lively color value to "#rrggbb".
 * @param {unknown} val - raw Lively property value
 * @returns {string|null} hex color or null if invalid
 */
export function normalizeColor(val) {
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
