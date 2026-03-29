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
  DISCO_STROBE_INTERVAL,
} from './constants.js';

let scene, camera, renderer;
let directionalLight = null;

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

  directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
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

  // Clouds
  createClouds(scene);

  window.addEventListener('resize', onResize);

  return { scene, camera, renderer };
}

function createClouds(scene) {
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xc8d8e8,
    roughness: 1,
    transparent: true,
    opacity: 0.6,
    flatShading: true,
  });
  const cloudMatDark = new THREE.MeshStandardMaterial({
    color: 0x9ab0c4,
    roughness: 1,
    transparent: true,
    opacity: 0.4,
    flatShading: true,
  });

  const cloudConfigs = [
    { x: -40, y: 35, z: -120, scale: 1.2, mat: cloudMat },
    { x: 50, y: 40, z: -150, scale: 1.5, mat: cloudMat },
    { x: -20, y: 45, z: -180, scale: 1.0, mat: cloudMatDark },
    { x: 70, y: 32, z: -100, scale: 0.9, mat: cloudMat },
    { x: -60, y: 42, z: -160, scale: 1.3, mat: cloudMatDark },
    { x: 30, y: 38, z: -200, scale: 1.1, mat: cloudMat },
    { x: -80, y: 36, z: -140, scale: 1.4, mat: cloudMat },
    { x: 90, y: 44, z: -170, scale: 1.0, mat: cloudMatDark },
  ];

  for (const cfg of cloudConfigs) {
    const cloud = new THREE.Group();
    // Each cloud is a cluster of 3-5 flattened spheres
    const puffCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < puffCount; i++) {
      const r = (2 + Math.random() * 3) * cfg.scale;
      const geo = new THREE.SphereGeometry(r, 7, 5);
      const puff = new THREE.Mesh(geo, cfg.mat);
      puff.position.set(
        (Math.random() - 0.5) * 6 * cfg.scale,
        (Math.random() - 0.5) * 1.5 * cfg.scale,
        (Math.random() - 0.5) * 3 * cfg.scale,
      );
      puff.scale.y = 0.4 + Math.random() * 0.2; // flatten vertically
      cloud.add(puff);
    }
    cloud.position.set(cfg.x, cfg.y, cfg.z);
    scene.add(cloud);
  }
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

export function getScene() { return scene; }
export function getCamera() { return camera; }
export function getRenderer() { return renderer; }
export function getDirectionalLight() { return directionalLight; }

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

// ---------------------------------------------------------------------------
// Slow-time visual filter
// ---------------------------------------------------------------------------
let slowTimeOverlay = null;

export function showSlowTimeFilter() {
  if (slowTimeOverlay) return;
  slowTimeOverlay = document.createElement('div');
  slowTimeOverlay.id = 'slow-time-overlay';
  slowTimeOverlay.style.cssText = `
    position:fixed;inset:0;z-index:50;pointer-events:none;
    background:rgba(106,90,205,0.15);
    mix-blend-mode:color;
    transition:opacity 0.3s;
  `;
  document.body.appendChild(slowTimeOverlay);
}

export function hideSlowTimeFilter() {
  if (!slowTimeOverlay) return;
  slowTimeOverlay.remove();
  slowTimeOverlay = null;
}

// ---------------------------------------------------------------------------
// Disco mode visuals
// ---------------------------------------------------------------------------
let discoStrobeTimer = 0;
let discoStrobeColors = [0xff0040, 0x00ff80, 0x4080ff, 0xffff00, 0xff00ff, 0x00ffff];
let discoColorIndex = 0;

export function startDiscoVisuals() {
  discoStrobeTimer = 0;
  discoColorIndex = 0;

  const overlay = document.createElement('div');
  overlay.id = 'disco-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:45;pointer-events:none;opacity:0;
    transition:opacity 0.3s;
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.style.opacity = '1');
}

export function updateDiscoVisuals(delta) {
  if (!directionalLight) return;
  discoStrobeTimer += delta;
  if (discoStrobeTimer >= DISCO_STROBE_INTERVAL) {
    discoStrobeTimer = 0;
    discoColorIndex = (discoColorIndex + 1) % discoStrobeColors.length;
    const color = discoStrobeColors[discoColorIndex];
    directionalLight.color.setHex(color);
    directionalLight.intensity = 1.2;

    const overlay = document.getElementById('disco-overlay');
    if (overlay) {
      overlay.style.background = `radial-gradient(circle, ${new THREE.Color(color).getStyle()}22, transparent 70%)`;
    }
  }
}

export function stopDiscoVisuals() {
  if (directionalLight) {
    directionalLight.color.setHex(0xffffff);
    directionalLight.intensity = 0.6;
  }
  const overlay = document.getElementById('disco-overlay');
  if (overlay) overlay.remove();
}
