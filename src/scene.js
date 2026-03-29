// src/scene.js
import * as THREE from 'three';
import {
  CAMERA_FOV,
  CAMERA_OFFSET,
  CAMERA_LOOK_AHEAD,
  SKY_COLOR,
  FOG_COLOR,
  NORMAL_FOG_NEAR,
  NORMAL_FOG_FAR,
  DREAD_SKY_COLOR,
  DREAD_FOG_COLOR,
  DREAD_FOG_NEAR,
  DREAD_FOG_FAR,
  SCREEN_SHAKE_DURATION,
} from './constants.js';

let scene, camera, renderer;

const normalSky = new THREE.Color(SKY_COLOR);
const dreadSky = new THREE.Color(DREAD_SKY_COLOR);
const normalFog = new THREE.Color(FOG_COLOR);
const dreadFogColor = new THREE.Color(DREAD_FOG_COLOR);

// Screen shake
let shakeTimer = 0;
let shakeIntensity = 0;
let shakeOffsetX = 0;
let shakeOffsetY = 0;

export function initScene(canvas) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY_COLOR);
  scene.fog = new THREE.Fog(FOG_COLOR, NORMAL_FOG_NEAR, NORMAL_FOG_FAR);

  camera = new THREE.PerspectiveCamera(
    CAMERA_FOV,
    window.innerWidth / window.innerHeight,
    0.1,
    400
  );
  camera.position.set(CAMERA_OFFSET.x, CAMERA_OFFSET.y, CAMERA_OFFSET.z);
  camera.lookAt(0, 1, -CAMERA_LOOK_AHEAD);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Softer lighting for overcast look
  const ambientLight = new THREE.AmbientLight(0xddeeff, 0.7);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(5, 15, 10);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 80;
  directionalLight.shadow.camera.left = -20;
  directionalLight.shadow.camera.right = 20;
  directionalLight.shadow.camera.top = 20;
  directionalLight.shadow.camera.bottom = -20;
  scene.add(directionalLight);

  window.addEventListener('resize', onResize);

  return { scene, camera, renderer };
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

export function getScene() { return scene; }
export function getCamera() { return camera; }
export function getRenderer() { return renderer; }

export function render() {
  renderer.render(scene, camera);
}

export function transitionToDread(t) {
  scene.background.lerpColors(normalSky, dreadSky, t);
  scene.fog.color.lerpColors(normalFog, dreadFogColor, t);
  scene.fog.near = THREE.MathUtils.lerp(NORMAL_FOG_NEAR, DREAD_FOG_NEAR, t);
  scene.fog.far = THREE.MathUtils.lerp(NORMAL_FOG_FAR, DREAD_FOG_FAR, t);
}

export function triggerScreenShake(intensity) {
  shakeTimer = SCREEN_SHAKE_DURATION;
  shakeIntensity = intensity;
}

export function updateScreenEffects(delta) {
  if (shakeTimer > 0) {
    shakeTimer -= delta;
    const t = shakeTimer / SCREEN_SHAKE_DURATION;
    shakeOffsetX = (Math.random() - 0.5) * 2 * shakeIntensity * t;
    shakeOffsetY = (Math.random() - 0.5) * 2 * shakeIntensity * t;
  } else {
    shakeOffsetX = 0;
    shakeOffsetY = 0;
  }
}

export function getShakeOffset() {
  return { x: shakeOffsetX, y: shakeOffsetY };
}

export function showRedVignette() {
  const vignette = document.getElementById('damage-vignette');
  if (!vignette) return;
  vignette.classList.remove('hidden');
  vignette.classList.remove('vignette-flash');
  void vignette.offsetWidth;
  vignette.classList.add('vignette-flash');
  setTimeout(() => vignette.classList.add('hidden'), 200);
}

export function setSpeedLinesVisible(visible) {
  const el = document.getElementById('speed-lines');
  if (el) {
    el.classList.toggle('hidden', !visible);
    el.classList.toggle('active', visible);
  }
}
