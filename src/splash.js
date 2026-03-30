// src/splash.js — Cinematic splash screen: penguin staring into the abyss
import * as THREE from 'three';
import { PENGUIN_HEIGHT, PENGUIN_RADIUS } from './constants.js';

let renderer = null;
let splashScene = null;
let camera = null;
let penguin = null;
let abyssGlow = null;
let animId = null;
let resizeHandler = null;

function createSplashPenguin() {
  const group = new THREE.Group();

  const bodyGeo = new THREE.SphereGeometry(PENGUIN_RADIUS, 16, 12);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.scale.set(1, 1.4, 0.9);
  body.position.y = PENGUIN_HEIGHT * 0.45;
  group.add(body);

  const bellyGeo = new THREE.SphereGeometry(PENGUIN_RADIUS * 0.7, 12, 10);
  const bellyMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const belly = new THREE.Mesh(bellyGeo, bellyMat);
  belly.scale.set(0.8, 1.2, 0.6);
  belly.position.set(0, PENGUIN_HEIGHT * 0.4, PENGUIN_RADIUS * 0.35);
  group.add(belly);

  const headGeo = new THREE.SphereGeometry(PENGUIN_RADIUS * 0.6, 12, 10);
  const headMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = PENGUIN_HEIGHT * 0.85;
  group.add(head);

  const eyeWhiteGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const pupilGeo = new THREE.SphereGeometry(0.035, 8, 8);
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
  for (const xOff of [-0.1, 0.1]) {
    const ew = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    ew.position.set(xOff, PENGUIN_HEIGHT * 0.88, PENGUIN_RADIUS * 0.5);
    group.add(ew);
    const p = new THREE.Mesh(pupilGeo, pupilMat);
    p.position.set(xOff, PENGUIN_HEIGHT * 0.88, PENGUIN_RADIUS * 0.55);
    group.add(p);
  }

  const beakGeo = new THREE.ConeGeometry(0.06, 0.18, 8);
  const beakMat = new THREE.MeshStandardMaterial({ color: 0xff8c00 });
  const beak = new THREE.Mesh(beakGeo, beakMat);
  beak.position.set(0, PENGUIN_HEIGHT * 0.82, PENGUIN_RADIUS * 0.65);
  beak.rotation.x = Math.PI / 2;
  group.add(beak);

  const footGeo = new THREE.BoxGeometry(0.15, 0.05, 0.2);
  const feetMat = new THREE.MeshStandardMaterial({ color: 0xff8c00 });
  const lf = new THREE.Mesh(footGeo, feetMat);
  lf.position.set(-0.12, 0.025, 0.05);
  group.add(lf);
  const rf = new THREE.Mesh(footGeo, feetMat);
  rf.position.set(0.12, 0.025, 0.05);
  group.add(rf);

  const wingGeo = new THREE.BoxGeometry(0.08, 0.35, 0.2);
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x2a2a4a });
  const lw = new THREE.Mesh(wingGeo, wingMat);
  lw.position.set(-PENGUIN_RADIUS - 0.04, PENGUIN_HEIGHT * 0.45, 0);
  group.add(lw);
  const rw = new THREE.Mesh(wingGeo, wingMat);
  rw.position.set(PENGUIN_RADIUS + 0.04, PENGUIN_HEIGHT * 0.45, 0);
  group.add(rw);

  return group;
}

export function initSplash(canvas) {
  const w = canvas.clientWidth || window.innerWidth;
  const h = canvas.clientHeight || window.innerHeight;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  splashScene = new THREE.Scene();
  splashScene.fog = new THREE.FogExp2(0x050010, 0.1);

  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 50);
  // Centered, pulled back — penguin's rotation provides the 3/4 view
  camera.position.set(0.3, 0.8, 2.2);
  camera.lookAt(0, 0.4, 0);

  // Ambient — enough to read shapes, still moody
  splashScene.add(new THREE.AmbientLight(0x2a2a55, 0.9));

  // Key light from upper-right — illuminates the penguin's face and belly
  const keyLight = new THREE.DirectionalLight(0x8899cc, 2.0);
  keyLight.position.set(2, 2, 1);
  splashScene.add(keyLight);

  // Blue rim light from behind-left — silhouette edge on the void side
  const rimLight = new THREE.DirectionalLight(0x6688ff, 2.5);
  rimLight.position.set(-2, 1.5, -2);
  splashScene.add(rimLight);

  // Purple rim from behind-right — subtle second edge
  const rimLight2 = new THREE.DirectionalLight(0x8844cc, 1.0);
  rimLight2.position.set(1, 2, -3);
  splashScene.add(rimLight2);

  // Red-purple abyss glow from below/ahead-left
  abyssGlow = new THREE.PointLight(0x880044, 2.0, 6);
  abyssGlow.position.set(-1, -0.3, -1);
  splashScene.add(abyssGlow);

  // Dark ground plane
  const groundGeo = new THREE.PlaneGeometry(20, 20);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x0a0015, roughness: 0.9 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  splashScene.add(ground);

  // Penguin in profile, gazing left into the void — belly and face visible to camera
  penguin = createSplashPenguin();
  penguin.rotation.y = Math.PI * 0.55;
  splashScene.add(penguin);

  // Animation
  const startTime = performance.now();
  function animate() {
    animId = requestAnimationFrame(animate);
    const elapsed = (performance.now() - startTime) / 1000;

    // Subtle breathing
    penguin.scale.y = 1 + Math.sin(elapsed * 1.5) * 0.008;

    // Very slow camera drift
    camera.position.x = 0.3 + Math.sin(elapsed * 0.12) * 0.05;
    camera.position.y = 0.8 + Math.cos(elapsed * 0.08) * 0.02;
    camera.lookAt(0, 0.4, 0);

    // Pulsing abyss glow
    abyssGlow.intensity = 1.5 + Math.sin(elapsed * 0.7) * 0.5;

    renderer.render(splashScene, camera);
  }
  animate();

  // Handle resize
  resizeHandler = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resizeHandler);
}

export function destroySplash() {
  if (animId) cancelAnimationFrame(animId);
  if (resizeHandler) window.removeEventListener('resize', resizeHandler);
  if (splashScene) {
    splashScene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
  }
  if (renderer) renderer.dispose();
  renderer = null;
  splashScene = null;
  camera = null;
  penguin = null;
  abyssGlow = null;
  animId = null;
  resizeHandler = null;
}
