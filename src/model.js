/**
 * model.js — GLTF model lifecycle controller
 * Preserves exact logic from src/main.js:
 *  - GLTFLoader, tmpBox/tmpCenter/tmpSize reusables
 *  - baseScale = 2 / maxDim, modelScale 0.5-3, applied as baseScale*modelScale
 *  - center via Box3.getCenter, position.sub, re-center after scale
 *  - dispose via for loop, fallback to default.glb
 *  - resolveModelUrl with BASE_URL, models/ prefix, decode, windows slashes
 */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MODEL } from "./config.js";

export function createModelController({ scene, pivot, camera }) {
  const loader = new GLTFLoader();
  let model = null;
  let currentModelPath = null;
  let isLoadingModel = false;
  let baseScale = 1;
  let modelScale = MODEL.scale.default;

  const tmpBox = new THREE.Box3();
  const tmpCenter = new THREE.Vector3();
  const tmpSize = new THREE.Vector3();

  function applyScale(val) {
    const v = Number(val);
    if (Number.isNaN(v)) return;
    const c = v < MODEL.scale.min ? MODEL.scale.min : v > MODEL.scale.max ? MODEL.scale.max : v;
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

  function resolveUrl(val) {
    if (val == null) return null;
    let p = String(val).trim().replace(/\\/g, "/");
    if (!p) return null;
    try {
      p = decodeURIComponent(p);
    } catch (_) {}
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
    const maxDim =
      tmpSize.x > tmpSize.y ? (tmpSize.x > tmpSize.z ? tmpSize.x : tmpSize.z) : tmpSize.y > tmpSize.z ? tmpSize.y : tmpSize.z;
    baseScale = maxDim > 0 ? MODEL.baseFit / maxDim : 1;
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

  function load(url, { fallback = true } = {}) {
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
        if (fallback && url !== `${import.meta.env.BASE_URL}${MODEL.defaultUrl}`) {
          console.warn(`Retrying fallback ${import.meta.env.BASE_URL}${MODEL.defaultUrl}`);
          load(`${import.meta.env.BASE_URL}${MODEL.defaultUrl}`, { fallback: false });
        }
      },
    );
  }

  function getModel() {
    return model;
  }

  function getBaseScale() {
    return baseScale;
  }

  function getModelScale() {
    return modelScale;
  }

  function isLoading() {
    return isLoadingModel;
  }

  function getCurrentPath() {
    return currentModelPath;
  }

  return {
    load,
    applyScale,
    resolveUrl,
    clear: clearModel,
    getModel,
    getBaseScale,
    getModelScale,
    isLoading,
    getCurrentPath,
  };
}
