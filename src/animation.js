/**
 * animation.js — Scalable animation system for ascii-3d-wallpaper
 * Registry pattern: add a new animation by adding one entry to `registry`
 * and one label in `src/config.js` ANIMATION — no if/else chain.
 *
 * Each strategy receives { pivot, modelController, time, speed, invert }
 *  - pivot: THREE.Group that holds the model (rotations/position)
 *  - modelController: for model-specific transforms (breathing scale)
 *  - time: elapsed ms from controller creation (for sin-based anims)
 *  - speed: Lively value 0-5 (mapped via SPEED.map, 0 = frozen)
 *  - invert: boolean (reverses direction)
 *
 * Continuous (X+Y) is the classic ASCII donut — default in dev and Lively.
 */
import { ANIMATION, SPEED } from "./config.js";

export const ANIMATION_KEYS = {
  CONTINUOUS: "continuous",
  FLOATING: "floating",
  WOBBLE: "wobble",
  BREATHING: "breathing",
  Y_ROTATION: "yRotation",
  X_ROTATION: "xRotation",
};

// Pure registry: key -> strategy function
const registry = {
  // Classic donut: Y + X continuous rotation at slightly different rates
  [ANIMATION_KEYS.CONTINUOUS]: ({ pivot, speed, invert }) => {
    const s = SPEED.map(speed) * (invert ? -1 : 1);
    const { yFactor, xFactor } = ANIMATION.params.continuous;
    pivot.rotation.y += s * yFactor;
    pivot.rotation.x += s * xFactor;
  },

  // Legacy Y rotation (right) — identical to original main.js behavior
  [ANIMATION_KEYS.Y_ROTATION]: ({ pivot, speed, invert }) => {
    const s = SPEED.map(speed) * (invert ? -1 : 1);
    pivot.rotation.y += s * ANIMATION.params.yRotation.factor;
  },

  // X rotation (up) — mirrors Y but on X axis
  [ANIMATION_KEYS.X_ROTATION]: ({ pivot, speed, invert }) => {
    const s = SPEED.map(speed) * (invert ? -1 : 1);
    pivot.rotation.x += s * ANIMATION.params.xRotation.factor;
  },

  // Floating: gentle vertical sine on pivot
  [ANIMATION_KEYS.FLOATING]: ({ pivot, time, speed, invert }) => {
    const { amplitude, frequency } = ANIMATION.params.floating;
    const dir = invert ? -1 : 1;
    pivot.position.y = Math.sin(time * frequency * speed * dir) * amplitude;
    // Keep slight Y rotation for liveliness when floating (subtle)
    pivot.rotation.y += SPEED.map(speed) * 0.3 * (invert ? -1 : 1);
  },

  // Wobble: pendulum-like Z + X, no Y drift
  [ANIMATION_KEYS.WOBBLE]: ({ pivot, time, speed, invert }) => {
    const { zAmplitude, xAmplitude, frequency } = ANIMATION.params.wobble;
    const dir = invert ? -1 : 1;
    const t = time * frequency * speed * dir;
    pivot.rotation.z = Math.sin(t) * zAmplitude;
    pivot.rotation.x = Math.cos(t * 0.7) * xAmplitude;
  },

  // Breathing: pulsating scale on the model itself (preserves baseScale*modelScale)
  [ANIMATION_KEYS.BREATHING]: ({ modelController, time, speed, invert }) => {
    const model = modelController.getModel();
    if (!model) return;
    const { amplitude, frequency } = ANIMATION.params.breathing;
    const base = modelController.getBaseScale() * modelController.getModelScale();
    const dir = invert ? -1 : 1;
    const s = Math.sin(time * frequency * speed * dir) * amplitude;
    model.scale.setScalar(base * (1 + s));
    model.updateMatrixWorld(true);
  },
};

/**
 * Normalize a Lively dropdown value to a registry key.
 * Lively sends `number` (index 0..5) for dropdown, dev may send string key.
 * @param {unknown} val
 * @returns {string} valid key, fallback to default
 */
export function normalizeAnimation(val) {
  if (typeof val === "number") {
    const k = ANIMATION.indexToKey[val];
    return k || ANIMATION.default;
  }
  if (typeof val === "string") {
    const v = val.trim();
    // Direct key match (continuous, floating, etc.)
    if (registry[v]) return v;
    // Case-insensitive label match or key variations
    const lower = v.toLowerCase();
    // Map common Lively string variations and labels
    const alias = {
      "continuous rotation (x+y)": "continuous",
      "continuous": "continuous",
      "continuous rotation": "continuous",
      "floating": "floating",
      "wobble": "wobble",
      "breathing": "breathing",
      "y rotation": "yRotation",
      "yrotation": "yRotation",
      "x rotation": "xRotation",
      "xrotation": "xRotation",
    };
    if (alias[lower]) return alias[lower];
    // Try to find by label
    const idx = ANIMATION.labels.findIndex((l) => l.toLowerCase() === lower);
    if (idx !== -1) return ANIMATION.indexToKey[idx];
  }
  return ANIMATION.default;
}

export function createAnimationController({
  pivot,
  modelController,
  getSpeed,
  getInvert,
  getDisabled,
  getAnimation,
}) {
  let prevKey = null;

  function resetPose() {
    // Snap to neutral pose — professional UX: changing animation always starts from front view
    pivot.position.set(0, 0, 0);
    pivot.rotation.set(0, 0, 0);
    const m = modelController.getModel();
    if (m) {
      const base = modelController.getBaseScale() * modelController.getModelScale();
      m.scale.setScalar(base);
      m.updateMatrixWorld(true);
    }
    pivot.updateMatrixWorld(true);
  }

  function update(now) {
    if (getDisabled()) return;
    const speed = Number(getSpeed());
    if (Number.isNaN(speed) || speed === 0) return;

    const raw = getAnimation();
    const key = normalizeAnimation(raw);
    if (key !== prevKey) {
      resetPose();
      prevKey = key;
    }

    const fn = registry[key] || registry[ANIMATION.default];
    fn({
      pivot,
      modelController,
      time: now,
      speed,
      invert: !!getInvert(),
    });
  }

  // For testing / extensibility: allow adding animations at runtime
  function register(key, fn) {
    registry[key] = fn;
  }

  return {
    update,
    registry,
    normalizeAnimation,
    register,
    getCurrentKey: () => prevKey || ANIMATION.default,
  };
}
