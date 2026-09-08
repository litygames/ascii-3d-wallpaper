/**
 * scene.js — Scene / Camera / Renderer / Lights / Pivot
 * Factory for the core Three.js scene graph.
 * Preserves exact values from src/main.js:
 *  - Camera 75deg, 0.1/1000, pos (0,0,2.5), lookAt(0,0,0)
 *  - Renderer antialias:false, low-power, stencil:false, alpha:false,
 *    pixelRatio 1, shadowMap false, sortObjects false
 *  - Lights: Ambient 1.2 + Directional 1.5 @ (2,3,2), ratio 1.25
 *  - Pivot Group at (0,0,0)
 *  - Scene background 0x000000 (ascii active) — DOM --bg/--text handled outside
 */
import * as THREE from "three";
import { CAMERA, RENDERER, LIGHTS, COLORS } from "./config.js";

export function createScene(canvas) {
  THREE.Cache.enabled = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.sceneAscii);

  const camera = new THREE.PerspectiveCamera(
    CAMERA.fov,
    window.innerWidth / window.innerHeight,
    CAMERA.near,
    CAMERA.far,
  );
  camera.position.set(...CAMERA.position);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: RENDERER.antialias,
    powerPreference: RENDERER.powerPreference,
    stencil: RENDERER.stencil,
    alpha: RENDERER.alpha,
  });
  renderer.setPixelRatio(RENDERER.pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(COLORS.sceneAscii, 1);
  renderer.shadowMap.enabled = RENDERER.shadowMapEnabled;
  renderer.sortObjects = RENDERER.sortObjects;

  const ambientLight = new THREE.AmbientLight(0xffffff, LIGHTS.ambient);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, LIGHTS.directional);
  directionalLight.position.set(...LIGHTS.position);
  scene.add(directionalLight);

  const pivot = new THREE.Group();
  scene.add(pivot);

  return { scene, camera, renderer, pivot, ambientLight, directionalLight };
}
