# Nietzsche Penguin Endless Runner — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-friendly 3D endless runner where a penguin runs toward unreachable mountains, dodging arctic/Nietzsche obstacles, collecting fish, and optionally triggering existential dread sequences for bonus points.

**Architecture:** Vanilla JS + Three.js game with Vite bundler. HTML overlays for UI (HUD, menus). Procedural geometry for all 3D models with factory functions enabling future GLTF swaps. Game state machine manages menu → playing → gameover transitions. requestAnimationFrame loop with delta-time drives all updates.

**Tech Stack:** Three.js, Vite, vanilla JS (ES modules), HTML/CSS overlays, localStorage, Google Fonts (Bangers)

**Spec:** `docs/superpowers/specs/2026-03-29-nietzsche-penguin-runner-design.md`

**Verification:** This is a visual game — each task ends with "Run dev server, verify visually" rather than unit tests. The dev server command is `npx vite` from project root.

---

## File Map

| File | Responsibility |
|------|---------------|
| `index.html` | Entry HTML with canvas container and UI overlay divs |
| `vite.config.js` | Vite config (minimal) |
| `package.json` | Dependencies (three, vite) |
| `src/constants.js` | All tunable game values — speeds, sizes, timing, points |
| `src/scene.js` | Three.js scene, camera, renderer, lighting, resize handler |
| `src/terrain.js` | Ice path chunks, mountains backdrop, snow environment |
| `src/penguin.js` | Penguin model factory, waddle animation, position/state |
| `src/controls.js` | Keyboard + touch swipe input, dispatches actions |
| `src/main.js` | Game state machine, game loop, orchestrates all modules |
| `src/obstacles.js` | Obstacle type factories, spawn manager, collision boxes |
| `src/collectibles.js` | Fish, golden fish, quote, abyss orb factories + spawn logic |
| `src/collision.js` | AABB collision detection between player and world objects |
| `src/hud.js` | HTML overlay for hearts, score, fish count, multiplier |
| `src/screens.js` | Start screen, game over screen, achievements gallery |
| `src/dread.js` | Existential dread mode effects, timer, visual changes |
| `src/achievements.js` | Achievement definitions, tracking, localStorage persistence |
| `src/audio.js` | Placeholder module (empty exports, future sound) |
| `style.css` | All styles for overlays, HUD, screens, fonts |

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `style.css`
- Create: `src/main.js`
- Create: `public/models/.gitkeep`
- Create: `assets/sounds/.gitkeep`
- Create: `assets/textures/.gitkeep`

- [ ] **Step 1: Initialize project with package.json**

```bash
cd /Users/cupariusjr./Documents/GitHub/nietzsche-penguin-the-game
npm init -y
npm install three
npm install -D vite
```

- [ ] **Step 2: Create vite.config.js**

```js
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
});
```

- [ ] **Step 3: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <title>Nietzsche Penguin</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Bangers&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <div id="game-container">
    <canvas id="game-canvas"></canvas>
    <div id="ui-overlay"></div>
  </div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create style.css**

```css
/* style.css */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  overflow: hidden;
  background: #000;
  font-family: 'Bangers', cursive;
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
}

#game-container {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
}

#game-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

#ui-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

#ui-overlay * {
  pointer-events: auto;
}
```

- [ ] **Step 5: Create placeholder main.js**

```js
// src/main.js
console.log('Nietzsche Penguin - game initializing...');
```

- [ ] **Step 6: Create directory placeholders**

```bash
mkdir -p public/models assets/sounds assets/textures src
touch public/models/.gitkeep assets/sounds/.gitkeep assets/textures/.gitkeep
```

- [ ] **Step 7: Verify — run dev server**

```bash
npx vite
```

Open browser at `http://localhost:5173`. Expect: black screen, "Nietzsche Penguin" in the tab title, console log message. No errors in console.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vite.config.js index.html style.css src/main.js public/ assets/
git commit -m "feat: scaffold project with Vite + Three.js"
```

---

### Task 2: Constants & Scene Setup

**Files:**
- Create: `src/constants.js`
- Create: `src/scene.js`
- Modify: `src/main.js`

- [ ] **Step 1: Create constants.js with all game config values**

```js
// src/constants.js

// World
export const LANE_WIDTH = 2.5;
export const LANE_POSITIONS = [-LANE_WIDTH, 0, LANE_WIDTH];
export const PATH_WIDTH = LANE_WIDTH * 3 + 1;
export const CHUNK_LENGTH = 50;
export const VISIBLE_CHUNKS = 4;
export const TERRAIN_Y = 0;

// Camera
export const CAMERA_OFFSET = { x: 0, y: 6, z: 10 };
export const CAMERA_LOOK_AHEAD = 20;
export const CAMERA_FOV = 65;

// Player
export const PLAYER_START_LANE = 1; // center lane (index into LANE_POSITIONS)
export const LANE_SWITCH_SPEED = 10; // units per second for lerp
export const JUMP_FORCE = 8;
export const GRAVITY = 20;
export const SLIDE_DURATION = 0.6; // seconds
export const PENGUIN_HEIGHT = 1.2;
export const PENGUIN_RADIUS = 0.4;

// Speed
export const BASE_SPEED = 12; // units per second
export const SPEED_INCREMENT = 0.3; // added per 10 seconds
export const MAX_SPEED = 30;
export const DREAD_SPEED_MULTIPLIER = 1.15;

// Obstacles
export const OBSTACLE_SPAWN_DISTANCE = 80; // spawn this far ahead
export const OBSTACLE_DESPAWN_DISTANCE = -10; // remove when this far behind
export const MIN_OBSTACLE_GAP = 8; // minimum distance between obstacles
export const BASE_OBSTACLE_INTERVAL = 1.5; // seconds between spawns at start
export const MIN_OBSTACLE_INTERVAL = 0.5; // fastest spawn rate

// Collectibles
export const FISH_SPAWN_CHANCE = 0.4; // per spawn opportunity
export const GOLDEN_FISH_CHANCE = 0.05;
export const QUOTE_SPAWN_CHANCE = 0.03;
export const ABYSS_ORB_MIN_INTERVAL = 45; // seconds between orb opportunities
export const ABYSS_ORB_MAX_INTERVAL = 90;
export const FISH_FLOAT_HEIGHT = 1.0;
export const FISH_ROTATE_SPEED = 2;

// Health
export const MAX_HEARTS = 3;
export const INVINCIBILITY_DURATION = 1.5; // seconds
export const FISH_PER_HEAL = 10;

// Scoring
export const POINTS_PER_METER = 1;
export const FISH_POINTS = 100;
export const GOLDEN_FISH_POINTS = 500;
export const DREAD_MULTIPLIER = 2;

// Dread mode
export const DREAD_DURATION = 12; // seconds
export const DREAD_DAMAGE_MULTIPLIER = 2; // hearts lost per hit
export const DREAD_FOG_NEAR = 5;
export const DREAD_FOG_FAR = 40;
export const NORMAL_FOG_NEAR = 20;
export const NORMAL_FOG_FAR = 120;

// Colors
export const SKY_COLOR = 0x87ceeb;
export const FOG_COLOR = 0xc8e6f0;
export const ICE_COLOR = 0xd4f1f9;
export const PATH_COLOR = 0xb8d8e8;
export const SNOW_COLOR = 0xffffff;
export const MOUNTAIN_COLOR = 0x8b9dc3;
export const DREAD_SKY_COLOR = 0x1a0a2e;
export const DREAD_FOG_COLOR = 0x0d0520;

// Controls
export const SWIPE_THRESHOLD = 30; // pixels minimum for swipe detection
export const SWIPE_MAX_TIME = 300; // ms max for a swipe gesture
```

- [ ] **Step 2: Create scene.js**

```js
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
} from './constants.js';

let scene, camera, renderer;

export function initScene(canvas) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY_COLOR);
  scene.fog = new THREE.Fog(FOG_COLOR, NORMAL_FOG_NEAR, NORMAL_FOG_FAR);

  camera = new THREE.PerspectiveCamera(
    CAMERA_FOV,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );
  camera.position.set(CAMERA_OFFSET.x, CAMERA_OFFSET.y, CAMERA_OFFSET.z);
  camera.lookAt(0, 1, -CAMERA_LOOK_AHEAD);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
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
```

- [ ] **Step 3: Update main.js to init scene**

```js
// src/main.js
import { initScene, render } from './scene.js';

const canvas = document.getElementById('game-canvas');
const { scene, camera, renderer } = initScene(canvas);

function gameLoop() {
  requestAnimationFrame(gameLoop);
  render();
}

gameLoop();
```

- [ ] **Step 4: Verify — run dev server**

```bash
npx vite
```

Expect: light blue sky background filling the viewport. No 3D objects yet. Resizing the window should adjust without distortion. No console errors.

- [ ] **Step 5: Commit**

```bash
git add src/constants.js src/scene.js src/main.js
git commit -m "feat: add constants and Three.js scene with camera and lighting"
```

---

### Task 3: Terrain — Ice Path & Mountains

**Files:**
- Create: `src/terrain.js`
- Modify: `src/main.js`

- [ ] **Step 1: Create terrain.js**

```js
// src/terrain.js
import * as THREE from 'three';
import {
  PATH_WIDTH,
  CHUNK_LENGTH,
  VISIBLE_CHUNKS,
  TERRAIN_Y,
  ICE_COLOR,
  PATH_COLOR,
  SNOW_COLOR,
  MOUNTAIN_COLOR,
} from './constants.js';

const chunks = [];
let mountainGroup = null;

const pathGeometry = new THREE.PlaneGeometry(PATH_WIDTH, CHUNK_LENGTH);
const pathMaterial = new THREE.MeshStandardMaterial({
  color: PATH_COLOR,
  roughness: 0.3,
  metalness: 0.1,
});

const snowGeometry = new THREE.PlaneGeometry(60, CHUNK_LENGTH);
const snowMaterial = new THREE.MeshStandardMaterial({
  color: SNOW_COLOR,
  roughness: 0.8,
});

export function createTerrain(scene) {
  // Initial path chunks
  for (let i = 0; i < VISIBLE_CHUNKS; i++) {
    spawnChunk(scene, -i * CHUNK_LENGTH);
  }

  // Mountains backdrop — stays at fixed distance
  mountainGroup = createMountains();
  scene.add(mountainGroup);

  // Side terrain (snow fields)
  createSideSnow(scene);
}

function spawnChunk(scene, zPosition) {
  const path = new THREE.Mesh(pathGeometry, pathMaterial);
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, TERRAIN_Y, zPosition);
  path.receiveShadow = true;
  scene.add(path);
  chunks.push({ mesh: path, z: zPosition });

  // Lane divider lines
  const lineGeometry = new THREE.PlaneGeometry(0.05, CHUNK_LENGTH);
  const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xaaccdd, transparent: true, opacity: 0.4 });
  for (const xOffset of [-2.5 / 2 - 0.625, 2.5 / 2 + 0.625]) {
    // Approximate lane boundaries
  }
}

function createMountains() {
  const group = new THREE.Group();
  const mountainMat = new THREE.MeshStandardMaterial({ color: MOUNTAIN_COLOR, flatShading: true });
  const snowCapMat = new THREE.MeshStandardMaterial({ color: SNOW_COLOR, flatShading: true });

  const peaks = [
    { x: -15, z: -150, height: 25, radius: 12 },
    { x: 0,   z: -170, height: 35, radius: 15 },
    { x: 20,  z: -155, height: 28, radius: 13 },
    { x: -30, z: -160, height: 20, radius: 10 },
    { x: 35,  z: -165, height: 22, radius: 11 },
    { x: 10,  z: -180, height: 30, radius: 14 },
    { x: -20, z: -175, height: 26, radius: 12 },
  ];

  for (const peak of peaks) {
    const geometry = new THREE.ConeGeometry(peak.radius, peak.height, 6);
    const mountain = new THREE.Mesh(geometry, mountainMat);
    mountain.position.set(peak.x, peak.height / 2, peak.z);
    group.add(mountain);

    // Snow cap
    const capGeometry = new THREE.ConeGeometry(peak.radius * 0.4, peak.height * 0.25, 6);
    const cap = new THREE.Mesh(capGeometry, snowCapMat);
    cap.position.set(peak.x, peak.height * 0.85, peak.z);
    group.add(cap);
  }

  return group;
}

function createSideSnow(scene) {
  // Left snow field
  const leftSnow = new THREE.Mesh(snowGeometry, snowMaterial);
  leftSnow.rotation.x = -Math.PI / 2;
  leftSnow.position.set(-35, TERRAIN_Y - 0.01, -75);
  leftSnow.receiveShadow = true;
  scene.add(leftSnow);

  // Right snow field
  const rightSnow = new THREE.Mesh(snowGeometry, snowMaterial);
  rightSnow.rotation.x = -Math.PI / 2;
  rightSnow.position.set(35, TERRAIN_Y - 0.01, -75);
  rightSnow.receiveShadow = true;
  scene.add(rightSnow);
}

export function updateTerrain(playerZ) {
  const farthestNeeded = playerZ - CHUNK_LENGTH * VISIBLE_CHUNKS;

  // Spawn new chunks ahead
  if (chunks.length > 0) {
    const farthest = chunks[chunks.length - 1].z;
    if (farthest > farthestNeeded) {
      const scene = chunks[0].mesh.parent;
      spawnChunk(scene, farthest - CHUNK_LENGTH);
    }
  }

  // Remove chunks behind camera
  while (chunks.length > 0 && chunks[0].z > playerZ + 20) {
    const old = chunks.shift();
    old.mesh.parent.remove(old.mesh);
    old.mesh.geometry !== pathGeometry && old.mesh.geometry.dispose();
  }

  // Mountains follow player Z but never get closer
  if (mountainGroup) {
    mountainGroup.position.z = playerZ - 150;
  }
}

export function getMountainGroup() {
  return mountainGroup;
}
```

- [ ] **Step 2: Wire terrain into main.js**

```js
// src/main.js
import { initScene, render } from './scene.js';
import { createTerrain, updateTerrain } from './terrain.js';

const canvas = document.getElementById('game-canvas');
const { scene, camera, renderer } = initScene(canvas);

createTerrain(scene);

let playerZ = 0;

function gameLoop() {
  requestAnimationFrame(gameLoop);

  // Simulate forward movement for testing
  playerZ -= 0.1;
  camera.position.z = playerZ + 10;
  camera.lookAt(0, 1, playerZ - 20);

  updateTerrain(playerZ);
  render();
}

gameLoop();
```

- [ ] **Step 3: Verify — run dev server**

```bash
npx vite
```

Expect: ice-blue path stretching forward toward snow-capped mountains. Camera slowly drifts forward. Mountains stay at a fixed visual distance. Path chunks spawn and recycle. Sky is light blue with fog.

- [ ] **Step 4: Commit**

```bash
git add src/terrain.js src/main.js
git commit -m "feat: add procedural ice path terrain and mountain backdrop"
```

---

### Task 4: Penguin Character

**Files:**
- Create: `src/penguin.js`
- Modify: `src/main.js`

- [ ] **Step 1: Create penguin.js with procedural model and waddle**

```js
// src/penguin.js
import * as THREE from 'three';
import {
  LANE_POSITIONS,
  PLAYER_START_LANE,
  LANE_SWITCH_SPEED,
  JUMP_FORCE,
  GRAVITY,
  SLIDE_DURATION,
  PENGUIN_HEIGHT,
  PENGUIN_RADIUS,
  TERRAIN_Y,
} from './constants.js';

let penguinGroup = null;
let currentLane = PLAYER_START_LANE;
let targetX = LANE_POSITIONS[currentLane];
let velocityY = 0;
let isJumping = false;
let isSliding = false;
let slideTimer = 0;
let waddleTime = 0;
let invincible = false;
let invincibleTimer = 0;
let blinkTimer = 0;

export function createPenguin(scene) {
  penguinGroup = new THREE.Group();

  // Body — black ellipsoid (squashed sphere)
  const bodyGeometry = new THREE.SphereGeometry(PENGUIN_RADIUS, 8, 8);
  bodyGeometry.scale(1, 1.4, 0.9);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = PENGUIN_HEIGHT * 0.5;
  body.castShadow = true;
  body.name = 'body';
  penguinGroup.add(body);

  // Belly — white front
  const bellyGeometry = new THREE.SphereGeometry(PENGUIN_RADIUS * 0.7, 8, 8);
  bellyGeometry.scale(0.8, 1.2, 0.5);
  const bellyMaterial = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });
  const belly = new THREE.Mesh(bellyGeometry, bellyMaterial);
  belly.position.set(0, PENGUIN_HEIGHT * 0.45, PENGUIN_RADIUS * 0.3);
  penguinGroup.add(belly);

  // Head
  const headGeometry = new THREE.SphereGeometry(PENGUIN_RADIUS * 0.6, 8, 8);
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = PENGUIN_HEIGHT * 0.95;
  head.castShadow = true;
  head.name = 'head';
  penguinGroup.add(head);

  // Eyes — white with black pupils
  const eyeGeometry = new THREE.SphereGeometry(0.08, 6, 6);
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilGeometry = new THREE.SphereGeometry(0.04, 6, 6);
  const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye.position.set(side * 0.15, PENGUIN_HEIGHT * 1.0, 0.3);
    penguinGroup.add(eye);

    const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    pupil.position.set(side * 0.15, PENGUIN_HEIGHT * 1.0, 0.36);
    penguinGroup.add(pupil);
  }

  // Beak — orange cone
  const beakGeometry = new THREE.ConeGeometry(0.08, 0.2, 4);
  const beakMaterial = new THREE.MeshStandardMaterial({ color: 0xff8c00 });
  const beak = new THREE.Mesh(beakGeometry, beakMaterial);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, PENGUIN_HEIGHT * 0.9, 0.45);
  penguinGroup.add(beak);

  // Feet — orange
  const footGeometry = new THREE.BoxGeometry(0.18, 0.06, 0.25);
  const footMaterial = new THREE.MeshStandardMaterial({ color: 0xff8c00 });
  for (const side of [-1, 1]) {
    const foot = new THREE.Mesh(footGeometry, footMaterial);
    foot.position.set(side * 0.15, 0.03, 0.05);
    foot.name = side === -1 ? 'leftFoot' : 'rightFoot';
    penguinGroup.add(foot);
  }

  // Wings — dark flippers
  const wingGeometry = new THREE.BoxGeometry(0.08, 0.5, 0.2);
  const wingMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(wingGeometry, wingMaterial);
    wing.position.set(side * (PENGUIN_RADIUS + 0.05), PENGUIN_HEIGHT * 0.5, 0);
    wing.name = side === -1 ? 'leftWing' : 'rightWing';
    penguinGroup.add(wing);
  }

  penguinGroup.position.set(LANE_POSITIONS[currentLane], TERRAIN_Y, 0);
  scene.add(penguinGroup);

  return penguinGroup;
}

export function updatePenguin(delta) {
  if (!penguinGroup) return;

  // Lane switching — lerp toward target X
  const dx = targetX - penguinGroup.position.x;
  if (Math.abs(dx) > 0.01) {
    penguinGroup.position.x += Math.sign(dx) * Math.min(LANE_SWITCH_SPEED * delta, Math.abs(dx));
  }

  // Jump physics
  if (isJumping) {
    velocityY -= GRAVITY * delta;
    penguinGroup.position.y += velocityY * delta;
    if (penguinGroup.position.y <= TERRAIN_Y) {
      penguinGroup.position.y = TERRAIN_Y;
      isJumping = false;
      velocityY = 0;
    }
  }

  // Slide timer
  if (isSliding) {
    slideTimer -= delta;
    penguinGroup.scale.y = 0.5;
    penguinGroup.position.y = TERRAIN_Y;
    if (slideTimer <= 0) {
      isSliding = false;
      penguinGroup.scale.y = 1;
    }
  }

  // Waddle animation (only when on ground and not sliding)
  if (!isJumping && !isSliding) {
    waddleTime += delta * 10;
    const waddle = Math.sin(waddleTime) * 0.05;
    penguinGroup.rotation.z = waddle;

    // Foot animation
    const leftFoot = penguinGroup.getObjectByName('leftFoot');
    const rightFoot = penguinGroup.getObjectByName('rightFoot');
    if (leftFoot) leftFoot.position.z = 0.05 + Math.sin(waddleTime) * 0.1;
    if (rightFoot) rightFoot.position.z = 0.05 + Math.sin(waddleTime + Math.PI) * 0.1;

    // Wing flap
    const leftWing = penguinGroup.getObjectByName('leftWing');
    const rightWing = penguinGroup.getObjectByName('rightWing');
    if (leftWing) leftWing.rotation.z = Math.sin(waddleTime * 0.5) * 0.15;
    if (rightWing) rightWing.rotation.z = -Math.sin(waddleTime * 0.5) * 0.15;
  }

  // Invincibility blink
  if (invincible) {
    invincibleTimer -= delta;
    blinkTimer += delta * 15;
    penguinGroup.visible = Math.sin(blinkTimer) > 0;
    if (invincibleTimer <= 0) {
      invincible = false;
      penguinGroup.visible = true;
    }
  }
}

export function switchLane(direction) {
  // direction: -1 (left) or +1 (right)
  const newLane = currentLane + direction;
  if (newLane >= 0 && newLane < LANE_POSITIONS.length) {
    currentLane = newLane;
    targetX = LANE_POSITIONS[currentLane];
  }
}

export function jump() {
  if (!isJumping && !isSliding) {
    isJumping = true;
    velocityY = JUMP_FORCE;
  }
}

export function slide() {
  if (!isJumping && !isSliding) {
    isSliding = true;
    slideTimer = SLIDE_DURATION;
  }
}

export function startInvincibility(duration) {
  invincible = true;
  invincibleTimer = duration;
  blinkTimer = 0;
}

export function isInvincible() { return invincible; }
export function isPlayerJumping() { return isJumping; }
export function isPlayerSliding() { return isSliding; }
export function getCurrentLane() { return currentLane; }
export function getPenguinGroup() { return penguinGroup; }

export function getPenguinBoundingBox() {
  if (!penguinGroup) return null;
  const pos = penguinGroup.position;
  const halfW = PENGUIN_RADIUS;
  const h = isSliding ? PENGUIN_HEIGHT * 0.5 : PENGUIN_HEIGHT;
  return new THREE.Box3(
    new THREE.Vector3(pos.x - halfW, pos.y, pos.z - halfW),
    new THREE.Vector3(pos.x + halfW, pos.y + h, pos.z + halfW)
  );
}

export function resetPenguin() {
  currentLane = PLAYER_START_LANE;
  targetX = LANE_POSITIONS[currentLane];
  velocityY = 0;
  isJumping = false;
  isSliding = false;
  slideTimer = 0;
  invincible = false;
  penguinGroup.position.set(LANE_POSITIONS[currentLane], TERRAIN_Y, 0);
  penguinGroup.scale.y = 1;
  penguinGroup.visible = true;
  penguinGroup.rotation.z = 0;
}
```

- [ ] **Step 2: Update main.js — add penguin, remove auto-camera drift**

```js
// src/main.js
import { initScene, render, getCamera } from './scene.js';
import { createTerrain, updateTerrain } from './terrain.js';
import { createPenguin, updatePenguin } from './penguin.js';
import { CAMERA_OFFSET, CAMERA_LOOK_AHEAD, BASE_SPEED } from './constants.js';

const canvas = document.getElementById('game-canvas');
const { scene } = initScene(canvas);

createTerrain(scene);
createPenguin(scene);

let playerZ = 0;
let lastTime = performance.now();

function gameLoop(now) {
  requestAnimationFrame(gameLoop);

  const delta = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  // Move world backward (penguin stays at z=0, world scrolls)
  playerZ -= BASE_SPEED * delta;

  updatePenguin(delta);
  updateTerrain(playerZ);

  // Camera follows
  const camera = getCamera();
  camera.position.set(CAMERA_OFFSET.x, CAMERA_OFFSET.y, CAMERA_OFFSET.z);
  camera.lookAt(0, 1, -CAMERA_LOOK_AHEAD);

  render();
}

requestAnimationFrame(gameLoop);
```

- [ ] **Step 3: Verify — run dev server**

Expect: penguin standing on the ice path, camera behind and above, mountains ahead. The world scrolls forward (terrain moves toward camera). Penguin waddles in place with feet and wings animating.

- [ ] **Step 4: Commit**

```bash
git add src/penguin.js src/main.js
git commit -m "feat: add procedural penguin character with waddle animation"
```

---

### Task 5: Controls — Keyboard & Touch Swipe

**Files:**
- Create: `src/controls.js`
- Modify: `src/main.js`

- [ ] **Step 1: Create controls.js**

```js
// src/controls.js
import { SWIPE_THRESHOLD, SWIPE_MAX_TIME } from './constants.js';

let onLeft = null;
let onRight = null;
let onJump = null;
let onSlide = null;
let onAction = null; // for start/restart

let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;

export function initControls(callbacks) {
  onLeft = callbacks.onLeft;
  onRight = callbacks.onRight;
  onJump = callbacks.onJump;
  onSlide = callbacks.onSlide;
  onAction = callbacks.onAction;

  // Keyboard
  window.addEventListener('keydown', handleKeyDown);

  // Touch
  window.addEventListener('touchstart', handleTouchStart, { passive: false });
  window.addEventListener('touchend', handleTouchEnd, { passive: false });
}

function handleKeyDown(e) {
  switch (e.code) {
    case 'ArrowLeft':
    case 'KeyA':
      onLeft?.();
      break;
    case 'ArrowRight':
    case 'KeyD':
      onRight?.();
      break;
    case 'ArrowUp':
    case 'KeyW':
    case 'Space':
      e.preventDefault();
      onJump?.();
      break;
    case 'ArrowDown':
    case 'KeyS':
    case 'ShiftLeft':
    case 'ShiftRight':
      onSlide?.();
      break;
    case 'Enter':
      onAction?.();
      break;
  }
}

function handleTouchStart(e) {
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchStartTime = performance.now();
}

function handleTouchEnd(e) {
  const touch = e.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;
  const dt = performance.now() - touchStartTime;

  if (dt > SWIPE_MAX_TIME) {
    // Too slow — treat as tap
    onAction?.();
    return;
  }

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx < SWIPE_THRESHOLD && absDy < SWIPE_THRESHOLD) {
    // Tap
    onAction?.();
    return;
  }

  if (absDx > absDy) {
    // Horizontal swipe
    if (dx < -SWIPE_THRESHOLD) onLeft?.();
    else if (dx > SWIPE_THRESHOLD) onRight?.();
  } else {
    // Vertical swipe
    if (dy < -SWIPE_THRESHOLD) onJump?.();
    else if (dy > SWIPE_THRESHOLD) onSlide?.();
  }
}

export function destroyControls() {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('touchstart', handleTouchStart);
  window.removeEventListener('touchend', handleTouchEnd);
}
```

- [ ] **Step 2: Wire controls into main.js**

```js
// src/main.js
import { initScene, render, getCamera } from './scene.js';
import { createTerrain, updateTerrain } from './terrain.js';
import { createPenguin, updatePenguin, switchLane, jump, slide } from './penguin.js';
import { initControls } from './controls.js';
import { CAMERA_OFFSET, CAMERA_LOOK_AHEAD, BASE_SPEED } from './constants.js';

const canvas = document.getElementById('game-canvas');
const { scene } = initScene(canvas);

createTerrain(scene);
createPenguin(scene);

initControls({
  onLeft: () => switchLane(-1),
  onRight: () => switchLane(1),
  onJump: () => jump(),
  onSlide: () => slide(),
  onAction: () => console.log('action pressed'),
});

let playerZ = 0;
let lastTime = performance.now();

function gameLoop(now) {
  requestAnimationFrame(gameLoop);

  const delta = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  playerZ -= BASE_SPEED * delta;

  updatePenguin(delta);
  updateTerrain(playerZ);

  const camera = getCamera();
  camera.position.set(CAMERA_OFFSET.x, CAMERA_OFFSET.y, CAMERA_OFFSET.z);
  camera.lookAt(0, 1, -CAMERA_LOOK_AHEAD);

  render();
}

requestAnimationFrame(gameLoop);
```

- [ ] **Step 3: Verify — run dev server**

Expect: arrow keys / WASD switch penguin between 3 lanes with smooth lerp. Space/up makes penguin jump with gravity arc. Down/shift makes penguin duck (squash to half height). Swipe gestures on mobile do the same. Tap logs "action pressed" to console.

- [ ] **Step 4: Commit**

```bash
git add src/controls.js src/main.js
git commit -m "feat: add keyboard and touch swipe controls"
```

---

### Task 6: Obstacles — Spawning & Collision

**Files:**
- Create: `src/obstacles.js`
- Create: `src/collision.js`
- Modify: `src/main.js`
- Modify: `src/constants.js`

- [ ] **Step 1: Create obstacles.js**

```js
// src/obstacles.js
import * as THREE from 'three';
import {
  LANE_POSITIONS,
  OBSTACLE_SPAWN_DISTANCE,
  OBSTACLE_DESPAWN_DISTANCE,
  TERRAIN_Y,
} from './constants.js';

const activeObstacles = [];
const obstacleGeometries = {};
const obstacleMaterials = {};

// Shared geometry/material pools (reuse for performance)
function getGeometries() {
  if (!obstacleGeometries.iceBlock) {
    obstacleGeometries.iceBlock = new THREE.BoxGeometry(1.8, 1.2, 1.2);
    obstacleGeometries.icicle = new THREE.CylinderGeometry(0.1, 0.3, 2.5, 6);
    obstacleGeometries.snowball = new THREE.SphereGeometry(0.8, 8, 8);
    obstacleGeometries.tombstone = new THREE.BoxGeometry(1.5, 1.8, 0.3);
    obstacleGeometries.book = new THREE.BoxGeometry(1.0, 1.4, 0.3);
    obstacleGeometries.ring = new THREE.TorusGeometry(1.2, 0.15, 8, 16);
    obstacleGeometries.crevasse = new THREE.BoxGeometry(PATH_WIDTH || 8.5, 0.1, 2.5);
  }
  return obstacleGeometries;
}

import { PATH_WIDTH } from './constants.js';

function getMaterials() {
  if (!obstacleMaterials.ice) {
    obstacleMaterials.ice = new THREE.MeshStandardMaterial({ color: 0x88ccee, transparent: true, opacity: 0.8 });
    obstacleMaterials.snow = new THREE.MeshStandardMaterial({ color: 0xffffff });
    obstacleMaterials.stone = new THREE.MeshStandardMaterial({ color: 0x666677 });
    obstacleMaterials.book = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    obstacleMaterials.ring = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0x553300 });
    obstacleMaterials.dark = new THREE.MeshStandardMaterial({ color: 0x222233 });
    obstacleMaterials.abyssEye = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  }
  return obstacleMaterials;
}

// Obstacle type definitions
// type: 'ground' (jump), 'overhead' (slide), 'lane' (dodge), 'crevasse' (jump)
const OBSTACLE_TYPES = [
  // Arctic
  {
    name: 'iceBlock',
    type: 'ground',
    create: () => {
      const geo = getGeometries();
      const mat = getMaterials();
      const mesh = new THREE.Mesh(geo.iceBlock, mat.ice);
      mesh.position.y = TERRAIN_Y + 0.6;
      mesh.castShadow = true;
      return { mesh, height: 1.2, type: 'ground' };
    },
  },
  {
    name: 'icicles',
    type: 'overhead',
    create: () => {
      const geo = getGeometries();
      const mat = getMaterials();
      const group = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const icicle = new THREE.Mesh(geo.icicle, mat.ice);
        icicle.position.set((i - 1) * 0.5, 0, 0);
        icicle.rotation.z = Math.PI; // point down
        group.add(icicle);
      }
      group.position.y = TERRAIN_Y + 2.5;
      return { mesh: group, height: 2.5, type: 'overhead' };
    },
  },
  {
    name: 'snowball',
    type: 'ground',
    create: () => {
      const geo = getGeometries();
      const mat = getMaterials();
      const mesh = new THREE.Mesh(geo.snowball, mat.snow);
      mesh.position.y = TERRAIN_Y + 0.8;
      mesh.castShadow = true;
      return { mesh, height: 1.6, type: 'ground', rolling: true };
    },
  },
  // Nietzsche
  {
    name: 'tombstone',
    type: 'ground',
    create: () => {
      const geo = getGeometries();
      const mat = getMaterials();
      const group = new THREE.Group();
      const stone = new THREE.Mesh(geo.tombstone, mat.stone);
      stone.position.y = TERRAIN_Y + 0.9;
      stone.castShadow = true;
      group.add(stone);

      // "GOD IS DEAD" text — canvas texture
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, 256, 128);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GOD IS', 128, 45);
      ctx.fillText('DEAD', 128, 85);
      const texture = new THREE.CanvasTexture(canvas);
      const textMat = new THREE.MeshBasicMaterial({ map: texture });
      const textPlane = new THREE.PlaneGeometry(1.4, 0.7);
      const textMesh = new THREE.Mesh(textPlane, textMat);
      textMesh.position.set(0, TERRAIN_Y + 0.9, 0.16);
      group.add(textMesh);

      return { mesh: group, height: 1.8, type: 'ground' };
    },
  },
  {
    name: 'book',
    type: 'ground',
    create: () => {
      const geo = getGeometries();
      const mat = getMaterials();
      const mesh = new THREE.Mesh(geo.book, mat.book);
      mesh.position.y = TERRAIN_Y + 0.7;
      mesh.rotation.y = Math.random() * 0.5 - 0.25;
      mesh.castShadow = true;
      return { mesh, height: 1.4, type: 'ground' };
    },
  },
  {
    name: 'eternalRing',
    type: 'overhead',
    create: () => {
      const geo = getGeometries();
      const mat = getMaterials();
      const mesh = new THREE.Mesh(geo.ring, mat.ring);
      mesh.position.y = TERRAIN_Y + 2.0;
      mesh.rotation.x = Math.PI / 2;
      return { mesh, height: 2.0, type: 'overhead', spinning: true };
    },
  },
];

let nextSpawnZ = -30;

export function spawnObstacle(scene, worldZ, difficulty) {
  if (worldZ > nextSpawnZ) return;

  // Pick random type
  const typeDef = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
  const { mesh, height, type, rolling, spinning } = typeDef.create();

  // Pick random lane
  const lane = Math.floor(Math.random() * 3);
  const x = LANE_POSITIONS[lane];

  mesh.position.x = x;
  mesh.position.z = worldZ - OBSTACLE_SPAWN_DISTANCE;

  scene.add(mesh);

  activeObstacles.push({
    mesh,
    lane,
    type,
    height,
    rolling: rolling || false,
    spinning: spinning || false,
    z: mesh.position.z,
  });

  // Calculate next spawn distance based on difficulty
  const interval = Math.max(8, 15 - difficulty * 0.5);
  nextSpawnZ = mesh.position.z - interval;
}

export function updateObstacles(delta, worldZ, speed) {
  for (let i = activeObstacles.length - 1; i >= 0; i--) {
    const obs = activeObstacles[i];

    // Move obstacle toward player (world scrolls)
    obs.mesh.position.z += speed * delta;

    // Spinning animation for eternal rings
    if (obs.spinning) {
      obs.mesh.rotation.z += delta * 3;
    }

    // Rolling animation for snowballs
    if (obs.rolling) {
      obs.mesh.rotation.x += delta * 5;
    }

    // Despawn behind camera
    if (obs.mesh.position.z > OBSTACLE_DESPAWN_DISTANCE) {
      obs.mesh.parent?.remove(obs.mesh);
      activeObstacles.splice(i, 1);
    }
  }
}

export function getActiveObstacles() {
  return activeObstacles;
}

export function clearObstacles(scene) {
  for (const obs of activeObstacles) {
    scene.remove(obs.mesh);
  }
  activeObstacles.length = 0;
  nextSpawnZ = -30;
}
```

- [ ] **Step 2: Create collision.js**

```js
// src/collision.js
import * as THREE from 'three';
import { PENGUIN_RADIUS, PENGUIN_HEIGHT, TERRAIN_Y } from './constants.js';

const _playerBox = new THREE.Box3();
const _obstacleBox = new THREE.Box3();

export function checkCollision(penguinPos, penguinSliding, penguinJumping, obstacle) {
  // Player bounding box
  const playerH = penguinSliding ? PENGUIN_HEIGHT * 0.5 : PENGUIN_HEIGHT;
  _playerBox.min.set(
    penguinPos.x - PENGUIN_RADIUS,
    penguinPos.y,
    penguinPos.z - PENGUIN_RADIUS
  );
  _playerBox.max.set(
    penguinPos.x + PENGUIN_RADIUS,
    penguinPos.y + playerH,
    penguinPos.z + PENGUIN_RADIUS
  );

  // Obstacle bounding box
  const obsPos = obstacle.mesh.position;
  const obsHalfW = 0.8;
  const obsH = obstacle.height;

  if (obstacle.type === 'overhead') {
    // Overhead: top half of screen
    _obstacleBox.min.set(obsPos.x - obsHalfW, TERRAIN_Y + 1.0, obsPos.z - obsHalfW);
    _obstacleBox.max.set(obsPos.x + obsHalfW, TERRAIN_Y + obsH + 1.0, obsPos.z + obsHalfW);
  } else {
    // Ground level
    _obstacleBox.min.set(obsPos.x - obsHalfW, TERRAIN_Y, obsPos.z - obsHalfW);
    _obstacleBox.max.set(obsPos.x + obsHalfW, TERRAIN_Y + obsH, obsPos.z + obsHalfW);
  }

  return _playerBox.intersectsBox(_obstacleBox);
}
```

- [ ] **Step 3: Update main.js with obstacles**

Replace `src/main.js`:

```js
// src/main.js
import { initScene, render, getCamera, getScene } from './scene.js';
import { createTerrain, updateTerrain } from './terrain.js';
import {
  createPenguin, updatePenguin, switchLane, jump, slide,
  getPenguinGroup, isPlayerJumping, isPlayerSliding, isInvincible,
  startInvincibility,
} from './penguin.js';
import { initControls } from './controls.js';
import { spawnObstacle, updateObstacles, getActiveObstacles } from './obstacles.js';
import { checkCollision } from './collision.js';
import {
  CAMERA_OFFSET, CAMERA_LOOK_AHEAD, BASE_SPEED, SPEED_INCREMENT,
  MAX_SPEED, INVINCIBILITY_DURATION,
} from './constants.js';

const canvas = document.getElementById('game-canvas');
const { scene } = initScene(canvas);

createTerrain(scene);
createPenguin(scene);

initControls({
  onLeft: () => switchLane(-1),
  onRight: () => switchLane(1),
  onJump: () => jump(),
  onSlide: () => slide(),
  onAction: () => {},
});

let worldZ = 0;
let speed = BASE_SPEED;
let elapsed = 0;
let lastTime = performance.now();

function gameLoop(now) {
  requestAnimationFrame(gameLoop);

  const delta = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  elapsed += delta;

  // Speed increases over time
  speed = Math.min(BASE_SPEED + Math.floor(elapsed / 10) * SPEED_INCREMENT, MAX_SPEED);

  worldZ -= speed * delta;

  updatePenguin(delta);
  updateTerrain(worldZ);

  // Spawn obstacles
  const difficulty = Math.floor(elapsed / 10);
  spawnObstacle(scene, worldZ, difficulty);
  updateObstacles(delta, worldZ, speed);

  // Collision detection
  const penguin = getPenguinGroup();
  if (penguin && !isInvincible()) {
    for (const obs of getActiveObstacles()) {
      if (checkCollision(penguin.position, isPlayerSliding(), isPlayerJumping(), obs)) {
        console.log('HIT!', obs.type);
        startInvincibility(INVINCIBILITY_DURATION);
        break;
      }
    }
  }

  const camera = getCamera();
  camera.position.set(CAMERA_OFFSET.x, CAMERA_OFFSET.y, CAMERA_OFFSET.z);
  camera.lookAt(0, 1, -CAMERA_LOOK_AHEAD);

  render();
}

requestAnimationFrame(gameLoop);
```

- [ ] **Step 4: Verify — run dev server**

Expect: obstacles spawn ahead on the path and scroll toward the penguin. Ice blocks, snowballs, icicles, tombstones with "GOD IS DEAD" text, spinning eternal rings visible. Hitting an obstacle logs "HIT!" to console and penguin blinks. Can dodge by switching lanes, jump over ground obstacles, slide under overhead ones.

- [ ] **Step 5: Commit**

```bash
git add src/obstacles.js src/collision.js src/main.js
git commit -m "feat: add obstacle spawning, types, and collision detection"
```

---

### Task 7: Collectibles — Fish, Quotes, Abyss Orb

**Files:**
- Create: `src/collectibles.js`
- Modify: `src/main.js`

- [ ] **Step 1: Create collectibles.js**

```js
// src/collectibles.js
import * as THREE from 'three';
import {
  LANE_POSITIONS,
  TERRAIN_Y,
  FISH_FLOAT_HEIGHT,
  FISH_ROTATE_SPEED,
  FISH_SPAWN_CHANCE,
  GOLDEN_FISH_CHANCE,
  QUOTE_SPAWN_CHANCE,
  ABYSS_ORB_MIN_INTERVAL,
  ABYSS_ORB_MAX_INTERVAL,
  OBSTACLE_SPAWN_DISTANCE,
} from './constants.js';

const activeCollectibles = [];
let nextSpawnZ = -20;
let lastOrbTime = 0;
let orbCooldownEnd = 0;

const NIETZSCHE_QUOTES = [
  "What doesn't kill me makes me stronger",
  "He who has a why can bear any how",
  "You must have chaos within you to give birth to a dancing star",
  "There are no facts, only interpretations",
  "In heaven, all the interesting people are missing",
  "Without music, life would be a mistake",
  "Man is a rope, tied between beast and overman",
  "The higher we soar, the smaller we appear to those who cannot fly",
];

// Shared geometry/material
const fishGeometry = new THREE.ConeGeometry(0.15, 0.5, 4);
const fishMaterial = new THREE.MeshStandardMaterial({ color: 0x66aaff, emissive: 0x223355 });
const goldenFishMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0x886600 });

function createFishMesh(golden) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(fishGeometry, golden ? goldenFishMaterial : fishMaterial);
  body.rotation.z = Math.PI / 2;
  group.add(body);

  // Tail
  const tailGeo = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    -0.25, 0, 0,
    -0.45, 0.15, 0,
    -0.45, -0.15, 0,
  ]);
  tailGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  const tailMat = new THREE.MeshBasicMaterial({
    color: golden ? 0xffd700 : 0x66aaff,
    side: THREE.DoubleSide,
  });
  const tail = new THREE.Mesh(tailGeo, tailMat);
  group.add(tail);

  if (golden) {
    // Glow effect — slightly larger transparent sphere
    const glowGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.2,
    });
    group.add(new THREE.Mesh(glowGeo, glowMat));
  }

  return group;
}

function createQuoteMesh(quoteText) {
  const group = new THREE.Group();

  // Scroll/paper look
  const scrollGeo = new THREE.PlaneGeometry(2, 0.6);
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f5e6c8';
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = '#333';
  ctx.font = '18px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Word wrap for long quotes
  const words = quoteText.split(' ');
  let line = '';
  const lines = [];
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > 480) {
      lines.push(line.trim());
      line = word + ' ';
    } else {
      line = test;
    }
  }
  lines.push(line.trim());

  const lineHeight = 24;
  const startY = 64 - ((lines.length - 1) * lineHeight) / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], 256, startY + i * lineHeight);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
  const mesh = new THREE.Mesh(scrollGeo, mat);
  group.add(mesh);

  // Subtle glow
  const glowGeo = new THREE.SphereGeometry(0.8, 8, 8);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xffffcc,
    transparent: true,
    opacity: 0.15,
  });
  group.add(new THREE.Mesh(glowGeo, glowMat));

  return group;
}

function createAbyssOrbMesh() {
  const group = new THREE.Group();

  // Dark sphere
  const orbGeo = new THREE.SphereGeometry(0.5, 12, 12);
  const orbMat = new THREE.MeshStandardMaterial({
    color: 0x1a0033,
    emissive: 0x330066,
    roughness: 0.2,
    metalness: 0.8,
  });
  const orb = new THREE.Mesh(orbGeo, orbMat);
  group.add(orb);

  // Swirling rings
  const ringGeo = new THREE.TorusGeometry(0.7, 0.03, 8, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x6600cc, transparent: true, opacity: 0.6 });
  const ring1 = new THREE.Mesh(ringGeo, ringMat);
  ring1.name = 'ring1';
  group.add(ring1);

  const ring2 = new THREE.Mesh(ringGeo, ringMat);
  ring2.rotation.x = Math.PI / 2;
  ring2.name = 'ring2';
  group.add(ring2);

  // Red glow
  const glowGeo = new THREE.SphereGeometry(0.8, 8, 8);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x660033,
    transparent: true,
    opacity: 0.2,
  });
  group.add(new THREE.Mesh(glowGeo, glowMat));

  return group;
}

export function spawnCollectibles(scene, worldZ, elapsed) {
  if (worldZ > nextSpawnZ) return;

  const lane = Math.floor(Math.random() * 3);
  const x = LANE_POSITIONS[lane];
  const z = worldZ - OBSTACLE_SPAWN_DISTANCE + 5; // slightly closer than obstacles

  // Decide what to spawn
  const roll = Math.random();

  // Abyss orb (rare, cooldown-based)
  if (elapsed > orbCooldownEnd && roll < 0.02) {
    const mesh = createAbyssOrbMesh();
    mesh.position.set(x, TERRAIN_Y + FISH_FLOAT_HEIGHT + 0.3, z);
    scene.add(mesh);
    activeCollectibles.push({ mesh, lane, type: 'abyssOrb', z: z });
    orbCooldownEnd = elapsed + ABYSS_ORB_MIN_INTERVAL +
      Math.random() * (ABYSS_ORB_MAX_INTERVAL - ABYSS_ORB_MIN_INTERVAL);
    nextSpawnZ = z - 5;
    return;
  }

  // Quote
  if (roll < QUOTE_SPAWN_CHANCE) {
    const quote = NIETZSCHE_QUOTES[Math.floor(Math.random() * NIETZSCHE_QUOTES.length)];
    const mesh = createQuoteMesh(quote);
    mesh.position.set(x, TERRAIN_Y + FISH_FLOAT_HEIGHT + 0.5, z);
    scene.add(mesh);
    activeCollectibles.push({ mesh, lane, type: 'quote', z: z, quoteText: quote });
    nextSpawnZ = z - 5;
    return;
  }

  // Golden fish
  if (roll < QUOTE_SPAWN_CHANCE + GOLDEN_FISH_CHANCE) {
    const mesh = createFishMesh(true);
    mesh.position.set(x, TERRAIN_Y + FISH_FLOAT_HEIGHT, z);
    scene.add(mesh);
    activeCollectibles.push({ mesh, lane, type: 'goldenFish', z: z });
    nextSpawnZ = z - 3;
    return;
  }

  // Regular fish
  if (roll < QUOTE_SPAWN_CHANCE + GOLDEN_FISH_CHANCE + FISH_SPAWN_CHANCE) {
    const mesh = createFishMesh(false);
    mesh.position.set(x, TERRAIN_Y + FISH_FLOAT_HEIGHT, z);
    scene.add(mesh);
    activeCollectibles.push({ mesh, lane, type: 'fish', z: z });
    nextSpawnZ = z - 3;
    return;
  }

  nextSpawnZ = worldZ - OBSTACLE_SPAWN_DISTANCE - 3;
}

export function updateCollectibles(delta, speed) {
  for (let i = activeCollectibles.length - 1; i >= 0; i--) {
    const col = activeCollectibles[i];
    col.mesh.position.z += speed * delta;

    // Float and rotate animation
    col.mesh.rotation.y += FISH_ROTATE_SPEED * delta;
    if (col.type !== 'quote') {
      col.mesh.position.y = TERRAIN_Y + FISH_FLOAT_HEIGHT + Math.sin(performance.now() * 0.003 + i) * 0.15;
    }

    // Abyss orb ring animation
    if (col.type === 'abyssOrb') {
      const ring1 = col.mesh.getObjectByName('ring1');
      const ring2 = col.mesh.getObjectByName('ring2');
      if (ring1) ring1.rotation.z += delta * 2;
      if (ring2) ring2.rotation.y += delta * 1.5;
    }

    // Despawn
    if (col.mesh.position.z > 5) {
      col.mesh.parent?.remove(col.mesh);
      activeCollectibles.splice(i, 1);
    }
  }
}

export function checkCollectiblePickup(penguinPos, penguinLane) {
  const collected = [];
  for (let i = activeCollectibles.length - 1; i >= 0; i--) {
    const col = activeCollectibles[i];
    const dz = Math.abs(col.mesh.position.z - penguinPos.z);
    const dx = Math.abs(col.mesh.position.x - penguinPos.x);

    if (dz < 1.5 && dx < 1.5) {
      collected.push({ type: col.type, quoteText: col.quoteText });
      col.mesh.parent?.remove(col.mesh);
      activeCollectibles.splice(i, 1);
    }
  }
  return collected;
}

export function clearCollectibles(scene) {
  for (const col of activeCollectibles) {
    scene.remove(col.mesh);
  }
  activeCollectibles.length = 0;
  nextSpawnZ = -20;
  orbCooldownEnd = 0;
}

export function getNietzscheQuotes() {
  return NIETZSCHE_QUOTES;
}
```

- [ ] **Step 2: Wire collectibles into main.js**

Add to imports in `src/main.js`:
```js
import { spawnCollectibles, updateCollectibles, checkCollectiblePickup } from './collectibles.js';
import { getCurrentLane } from './penguin.js';
```

Add inside the gameLoop, after obstacle updates:
```js
  // Collectibles
  spawnCollectibles(scene, worldZ, elapsed);
  updateCollectibles(delta, speed);

  // Pickup detection
  const penguin = getPenguinGroup();
  if (penguin) {
    const pickups = checkCollectiblePickup(penguin.position, getCurrentLane());
    for (const pickup of pickups) {
      console.log('Collected:', pickup.type, pickup.quoteText || '');
    }
  }
```

- [ ] **Step 3: Verify — run dev server**

Expect: fish (blue), golden fish (gold glow), quote scrolls, and dark swirling abyss orbs appear along the path. All float and rotate. Running into them logs the collection to console. Abyss orbs have animated swirling rings.

- [ ] **Step 4: Commit**

```bash
git add src/collectibles.js src/main.js
git commit -m "feat: add collectibles — fish, golden fish, quotes, abyss orb"
```

---

### Task 8: HUD — Hearts, Score, Fish Count

**Files:**
- Create: `src/hud.js`
- Modify: `style.css`
- Modify: `src/main.js`

- [ ] **Step 1: Create hud.js**

```js
// src/hud.js
import { MAX_HEARTS } from './constants.js';

let hudContainer = null;
let heartsEl = null;
let scoreEl = null;
let fishEl = null;
let multiplierEl = null;

export function createHUD() {
  hudContainer = document.createElement('div');
  hudContainer.id = 'hud';

  hudContainer.innerHTML = `
    <div id="hud-hearts"></div>
    <div id="hud-score">0</div>
    <div id="hud-fish">🐟 0</div>
    <div id="hud-multiplier" class="hidden">2X</div>
  `;

  document.getElementById('ui-overlay').appendChild(hudContainer);

  heartsEl = document.getElementById('hud-hearts');
  scoreEl = document.getElementById('hud-score');
  fishEl = document.getElementById('hud-fish');
  multiplierEl = document.getElementById('hud-multiplier');

  updateHearts(MAX_HEARTS);
}

export function updateHearts(hearts) {
  if (!heartsEl) return;
  heartsEl.innerHTML = '';
  for (let i = 0; i < MAX_HEARTS; i++) {
    const heart = document.createElement('span');
    heart.className = 'heart';
    heart.textContent = i < hearts ? '❤️' : '🖤';
    heartsEl.appendChild(heart);
  }
}

export function updateScore(score) {
  if (!scoreEl) return;
  scoreEl.textContent = Math.floor(score).toLocaleString();
}

export function updateFishCount(count) {
  if (!fishEl) return;
  fishEl.textContent = `🐟 ${count}`;
}

export function showMultiplier(show) {
  if (!multiplierEl) return;
  multiplierEl.classList.toggle('hidden', !show);
}

export function showHUD(visible) {
  if (hudContainer) {
    hudContainer.style.display = visible ? 'flex' : 'none';
  }
}
```

- [ ] **Step 2: Add HUD styles to style.css**

Append to `style.css`:

```css
/* HUD */
#hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 20px;
  font-size: 24px;
  color: #fff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  z-index: 10;
}

#hud-hearts {
  display: flex;
  gap: 4px;
  font-size: 28px;
}

#hud-score {
  font-family: 'Bangers', cursive;
  font-size: 36px;
  letter-spacing: 2px;
}

#hud-fish {
  font-size: 22px;
}

#hud-multiplier {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Bangers', cursive;
  font-size: 40px;
  color: #ff4444;
  text-shadow: 0 0 10px rgba(255, 0, 0, 0.7);
  animation: pulse 0.5s ease-in-out infinite alternate;
}

@keyframes pulse {
  from { transform: translateX(-50%) scale(1); }
  to { transform: translateX(-50%) scale(1.15); }
}

.hidden {
  display: none !important;
}
```

- [ ] **Step 3: Wire HUD into main.js**

Add import:
```js
import { createHUD, updateScore, updateHearts, updateFishCount } from './hud.js';
```

Call `createHUD()` after scene setup. Add game state variables:
```js
let score = 0;
let hearts = 3;
let fishCount = 0;
```

In the game loop, update score:
```js
  score += speed * delta * POINTS_PER_METER;
  updateScore(score);
```

In the collision handler, update hearts:
```js
  hearts--;
  updateHearts(hearts);
  if (hearts <= 0) {
    console.log('GAME OVER — score:', Math.floor(score));
  }
```

In the collectible pickup handler:
```js
  if (pickup.type === 'fish') {
    fishCount++;
    score += FISH_POINTS;
    updateFishCount(fishCount);
    if (fishCount % FISH_PER_HEAL === 0 && hearts < MAX_HEARTS) {
      hearts++;
      updateHearts(hearts);
    }
  } else if (pickup.type === 'goldenFish') {
    score += GOLDEN_FISH_POINTS;
    fishCount++;
    updateFishCount(fishCount);
  }
```

- [ ] **Step 4: Verify — run dev server**

Expect: HUD visible — hearts top-left, score top-center counting up, fish count top-right. Hitting obstacles decreases hearts. Collecting fish increases fish count and score. Every 10 fish restores a heart.

- [ ] **Step 5: Commit**

```bash
git add src/hud.js style.css src/main.js
git commit -m "feat: add HUD with hearts, score, and fish count"
```

---

### Task 9: Game State Machine & Screens

**Files:**
- Create: `src/screens.js`
- Modify: `src/main.js`
- Modify: `style.css`

- [ ] **Step 1: Create screens.js**

```js
// src/screens.js

const GAME_OVER_QUIPS = [
  'THE ABYSS CLAIMED YOU',
  'THUS SPOKE... NOBODY',
  'BEYOND GOOD AND ALIVE',
  'THE ETERNAL RETURN AWAITS',
  'GOD IS DEAD. SO ARE YOU.',
  'WHAT KILLED YOU MADE YOU... DEAD',
];

const GAME_OVER_QUOTES = [
  'He who fights with monsters should look to it that he himself does not become a monster.',
  'And if you gaze long into an abyss, the abyss also gazes into you.',
  'There is always some madness in love. But there is also always some reason in madness.',
  'In individuals, insanity is rare; but in groups, parties, nations and epochs, it is the rule.',
  'The snake which cannot cast its skin has to die.',
];

let startScreen = null;
let gameOverScreen = null;

export function createStartScreen(onStart) {
  startScreen = document.createElement('div');
  startScreen.id = 'start-screen';
  startScreen.innerHTML = `
    <h1 class="game-title">NIETZSCHE<br>PENGUIN</h1>
    <p class="subtitle">An Endless Run Toward Meaning</p>
    <p id="high-score-display"></p>
    <p class="start-prompt">TAP TO START</p>
    <button id="achievements-btn">ACHIEVEMENTS</button>
  `;

  document.getElementById('ui-overlay').appendChild(startScreen);

  // Update high score
  const highScore = localStorage.getItem('np_highscore') || 0;
  document.getElementById('high-score-display').textContent =
    highScore > 0 ? `HIGH SCORE: ${Number(highScore).toLocaleString()}` : '';

  // Start on click/tap/space
  const startHandler = (e) => {
    if (e.type === 'keydown' && e.code !== 'Space' && e.code !== 'Enter') return;
    onStart();
  };
  startScreen.addEventListener('click', startHandler);
  window.addEventListener('keydown', startHandler, { once: true });

  return startScreen;
}

export function hideStartScreen() {
  if (startScreen) {
    startScreen.style.display = 'none';
  }
}

export function showStartScreen() {
  if (startScreen) {
    startScreen.style.display = 'flex';
    const highScore = localStorage.getItem('np_highscore') || 0;
    const el = document.getElementById('high-score-display');
    if (el) el.textContent = highScore > 0 ? `HIGH SCORE: ${Number(highScore).toLocaleString()}` : '';
  }
}

export function showGameOverScreen(score, distance, fishCount, newAchievements, onRestart) {
  // Save high score
  const prev = Number(localStorage.getItem('np_highscore') || 0);
  const isNewHigh = score > prev;
  if (isNewHigh) {
    localStorage.setItem('np_highscore', Math.floor(score));
  }

  gameOverScreen = document.createElement('div');
  gameOverScreen.id = 'gameover-screen';

  const quip = GAME_OVER_QUIPS[Math.floor(Math.random() * GAME_OVER_QUIPS.length)];
  const quote = GAME_OVER_QUOTES[Math.floor(Math.random() * GAME_OVER_QUOTES.length)];

  gameOverScreen.innerHTML = `
    <h1 class="gameover-title">${quip}</h1>
    ${isNewHigh ? '<p class="new-high">NEW HIGH SCORE!</p>' : ''}
    <div class="gameover-stats">
      <p>SCORE: ${Math.floor(score).toLocaleString()}</p>
      <p>DISTANCE: ${Math.floor(distance)}m</p>
      <p>FISH: ${fishCount} 🐟</p>
    </div>
    <p class="gameover-quote">"${quote}"</p>
    ${newAchievements.length > 0 ? `
      <div class="gameover-achievements">
        <p>UNLOCKED:</p>
        ${newAchievements.map(a => `<p class="achievement-item">🏆 ${a}</p>`).join('')}
      </div>
    ` : ''}
    <button id="restart-btn" class="game-btn">PLAY AGAIN</button>
  `;

  document.getElementById('ui-overlay').appendChild(gameOverScreen);

  const restartHandler = () => {
    gameOverScreen.remove();
    gameOverScreen = null;
    onRestart();
  };

  document.getElementById('restart-btn').addEventListener('click', restartHandler);
  window.addEventListener('keydown', function handler(e) {
    if (e.code === 'Space' || e.code === 'Enter') {
      window.removeEventListener('keydown', handler);
      restartHandler();
    }
  });
}

export function hideGameOverScreen() {
  if (gameOverScreen) {
    gameOverScreen.remove();
    gameOverScreen = null;
  }
}
```

- [ ] **Step 2: Add screen styles to style.css**

Append to `style.css`:

```css
/* Screens */
#start-screen,
#gameover-screen {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  z-index: 100;
  text-align: center;
  padding: 20px;
}

.game-title {
  font-family: 'Bangers', cursive;
  font-size: clamp(48px, 12vw, 96px);
  line-height: 1;
  color: #fff;
  text-shadow: 4px 4px 0 #1a1a2e, 0 0 20px rgba(100, 180, 255, 0.5);
  margin-bottom: 10px;
}

.subtitle {
  font-size: 18px;
  color: #aaccee;
  font-style: italic;
  margin-bottom: 20px;
}

#high-score-display {
  font-family: 'Bangers', cursive;
  font-size: 24px;
  color: #ffd700;
  margin-bottom: 30px;
}

.start-prompt {
  font-family: 'Bangers', cursive;
  font-size: 28px;
  animation: pulse 0.8s ease-in-out infinite alternate;
  margin-bottom: 30px;
}

.gameover-title {
  font-family: 'Bangers', cursive;
  font-size: clamp(32px, 8vw, 64px);
  color: #ff4444;
  text-shadow: 3px 3px 0 #000;
  margin-bottom: 10px;
}

.new-high {
  font-family: 'Bangers', cursive;
  font-size: 28px;
  color: #ffd700;
  animation: pulse 0.5s ease-in-out infinite alternate;
  margin-bottom: 10px;
}

.gameover-stats {
  font-family: 'Bangers', cursive;
  font-size: 22px;
  line-height: 1.6;
  margin-bottom: 20px;
}

.gameover-quote {
  font-size: 16px;
  font-style: italic;
  color: #aaa;
  max-width: 400px;
  margin-bottom: 20px;
}

.gameover-achievements {
  margin-bottom: 20px;
}

.achievement-item {
  font-size: 18px;
  color: #ffd700;
}

.game-btn,
#achievements-btn {
  font-family: 'Bangers', cursive;
  font-size: 24px;
  padding: 12px 40px;
  background: #4488cc;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  letter-spacing: 2px;
  margin: 8px;
}

.game-btn:hover,
#achievements-btn:hover {
  background: #5599dd;
}
```

- [ ] **Step 3: Rewrite main.js with full game state machine**

```js
// src/main.js
import { initScene, render, getCamera, getScene } from './scene.js';
import { createTerrain, updateTerrain } from './terrain.js';
import {
  createPenguin, updatePenguin, switchLane, jump, slide,
  getPenguinGroup, isPlayerJumping, isPlayerSliding, isInvincible,
  startInvincibility, resetPenguin, getCurrentLane,
} from './penguin.js';
import { initControls } from './controls.js';
import { spawnObstacle, updateObstacles, getActiveObstacles, clearObstacles } from './obstacles.js';
import {
  spawnCollectibles, updateCollectibles, checkCollectiblePickup, clearCollectibles,
} from './collectibles.js';
import { checkCollision } from './collision.js';
import { createHUD, updateScore, updateHearts, updateFishCount, showHUD, showMultiplier } from './hud.js';
import { createStartScreen, hideStartScreen, showStartScreen, showGameOverScreen } from './screens.js';
import {
  CAMERA_OFFSET, CAMERA_LOOK_AHEAD, BASE_SPEED, SPEED_INCREMENT,
  MAX_SPEED, INVINCIBILITY_DURATION, POINTS_PER_METER,
  FISH_POINTS, GOLDEN_FISH_POINTS, FISH_PER_HEAL, MAX_HEARTS,
} from './constants.js';

// --- State ---
let gameState = 'menu'; // 'menu' | 'playing' | 'gameover'
let worldZ = 0;
let speed = 0;
let elapsed = 0;
let score = 0;
let hearts = MAX_HEARTS;
let fishCount = 0;
let distance = 0;
let lastTime = performance.now();
let newAchievements = [];

// --- Init ---
const canvas = document.getElementById('game-canvas');
const { scene } = initScene(canvas);

createTerrain(scene);
const penguinMesh = createPenguin(scene);
createHUD();
showHUD(false);

initControls({
  onLeft: () => { if (gameState === 'playing') switchLane(-1); },
  onRight: () => { if (gameState === 'playing') switchLane(1); },
  onJump: () => { if (gameState === 'playing') jump(); },
  onSlide: () => { if (gameState === 'playing') slide(); },
  onAction: () => {},
});

// --- Start screen ---
createStartScreen(startGame);

function startGame() {
  gameState = 'playing';
  hideStartScreen();
  showHUD(true);

  // Reset state
  worldZ = 0;
  speed = BASE_SPEED;
  elapsed = 0;
  score = 0;
  hearts = MAX_HEARTS;
  fishCount = 0;
  distance = 0;
  newAchievements = [];
  lastTime = performance.now();

  resetPenguin();
  clearObstacles(scene);
  clearCollectibles(scene);
  updateScore(0);
  updateHearts(hearts);
  updateFishCount(0);
  showMultiplier(false);
}

function gameOver() {
  gameState = 'gameover';
  showHUD(false);
  showGameOverScreen(score, distance, fishCount, newAchievements, startGame);
}

// --- Game Loop ---
function gameLoop(now) {
  requestAnimationFrame(gameLoop);

  const delta = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  if (gameState === 'playing') {
    elapsed += delta;

    // Speed increases over time
    speed = Math.min(BASE_SPEED + Math.floor(elapsed / 10) * SPEED_INCREMENT, MAX_SPEED);

    worldZ -= speed * delta;
    distance += speed * delta;

    // Score
    score += speed * delta * POINTS_PER_METER;
    updateScore(score);

    updatePenguin(delta);
    updateTerrain(worldZ);

    // Obstacles
    const difficulty = Math.floor(elapsed / 10);
    spawnObstacle(scene, worldZ, difficulty);
    updateObstacles(delta, worldZ, speed);

    // Collectibles
    spawnCollectibles(scene, worldZ, elapsed);
    updateCollectibles(delta, speed);

    // Collision with obstacles
    const penguin = getPenguinGroup();
    if (penguin && !isInvincible()) {
      for (const obs of getActiveObstacles()) {
        if (checkCollision(penguin.position, isPlayerSliding(), isPlayerJumping(), obs)) {
          hearts -= 1;
          updateHearts(hearts);
          if (hearts <= 0) {
            gameOver();
            return;
          }
          startInvincibility(INVINCIBILITY_DURATION);
          break;
        }
      }
    }

    // Collectible pickups
    if (penguin) {
      const pickups = checkCollectiblePickup(penguin.position, getCurrentLane());
      for (const pickup of pickups) {
        if (pickup.type === 'fish') {
          fishCount++;
          score += FISH_POINTS;
          updateFishCount(fishCount);
          if (fishCount % FISH_PER_HEAL === 0 && hearts < MAX_HEARTS) {
            hearts++;
            updateHearts(hearts);
          }
        } else if (pickup.type === 'goldenFish') {
          fishCount++;
          score += GOLDEN_FISH_POINTS;
          updateFishCount(fishCount);
        } else if (pickup.type === 'quote') {
          console.log('Quote collected:', pickup.quoteText);
        } else if (pickup.type === 'abyssOrb') {
          console.log('Abyss orb collected — dread mode TODO');
        }
      }
    }
  }

  // Camera (always render even in menu for background)
  const camera = getCamera();
  camera.position.set(CAMERA_OFFSET.x, CAMERA_OFFSET.y, CAMERA_OFFSET.z);
  camera.lookAt(0, 1, -CAMERA_LOOK_AHEAD);

  render();
}

requestAnimationFrame(gameLoop);
```

- [ ] **Step 4: Verify — run dev server**

Expect: Start screen with "NIETZSCHE PENGUIN" title, "TAP TO START" prompt. Clicking/tapping/pressing space starts the game. HUD appears. Playing works as before. When hearts reach 0, game over screen appears with quip, stats, quote. "PLAY AGAIN" restarts the game. High score persists across plays.

- [ ] **Step 5: Commit**

```bash
git add src/screens.js src/main.js style.css
git commit -m "feat: add game state machine, start screen, and game over screen"
```

---

### Task 10: Existential Dread Mode

**Files:**
- Create: `src/dread.js`
- Modify: `src/main.js`
- Modify: `src/scene.js`

- [ ] **Step 1: Add scene color transition helpers to scene.js**

Add to `src/scene.js`:

```js
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
} from './constants.js';

// ... existing code ...

const normalSky = new THREE.Color(SKY_COLOR);
const dreadSky = new THREE.Color(DREAD_SKY_COLOR);
const normalFog = new THREE.Color(FOG_COLOR);
const dreadFogColor = new THREE.Color(DREAD_FOG_COLOR);

export function transitionToDread(t) {
  // t: 0 = normal, 1 = full dread
  scene.background.lerpColors(normalSky, dreadSky, t);
  scene.fog.color.lerpColors(normalFog, dreadFogColor, t);
  scene.fog.near = THREE.MathUtils.lerp(NORMAL_FOG_NEAR, DREAD_FOG_NEAR, t);
  scene.fog.far = THREE.MathUtils.lerp(NORMAL_FOG_FAR, DREAD_FOG_FAR, t);
}
```

- [ ] **Step 2: Create dread.js**

```js
// src/dread.js
import * as THREE from 'three';
import { transitionToDread } from './scene.js';
import { DREAD_DURATION, DREAD_SPEED_MULTIPLIER, TERRAIN_Y } from './constants.js';

let active = false;
let timer = 0;
let transitionProgress = 0; // 0 to 1
let dreadEyes = null;
let shadowCreatures = [];
let dreadQuoteCallback = null;

const TRANSITION_IN_DURATION = 1.5; // seconds to fade in
const TRANSITION_OUT_DURATION = 1.0;

export function startDread(scene, onEnd) {
  active = true;
  timer = DREAD_DURATION;
  transitionProgress = 0;
  dreadQuoteCallback = onEnd;

  // Create giant red eyes on the horizon
  dreadEyes = createDreadEyes();
  dreadEyes.position.set(0, 15, -140);
  scene.add(dreadEyes);

  // Shadow creatures on sides
  shadowCreatures = createShadowCreatures();
  for (const creature of shadowCreatures) {
    scene.add(creature);
  }
}

function createDreadEyes() {
  const group = new THREE.Group();

  const eyeGeo = new THREE.SphereGeometry(3, 12, 12);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const pupilGeo = new THREE.SphereGeometry(1.2, 8, 8);
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

  // Left eye
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-8, 0, 0);
  group.add(leftEye);
  const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
  leftPupil.position.set(-8, 0, 2);
  group.add(leftPupil);

  // Right eye
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(8, 0, 0);
  group.add(rightEye);
  const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
  rightPupil.position.set(8, 0, 2);
  group.add(rightPupil);

  // Glow
  const glowGeo = new THREE.SphereGeometry(5, 8, 8);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.15,
  });
  group.add(new THREE.Mesh(glowGeo, glowMat));

  group.visible = false;
  return group;
}

function createShadowCreatures() {
  const creatures = [];
  const creatureMat = new THREE.MeshBasicMaterial({ color: 0x0a0015, transparent: true, opacity: 0 });

  for (let i = 0; i < 6; i++) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.ConeGeometry(1, 4, 5), creatureMat.clone());
    body.position.y = 2;
    group.add(body);

    // Red eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0 });
    const eyeGeo = new THREE.SphereGeometry(0.15, 6, 6);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat.clone());
    leftEye.position.set(-0.3, 3.2, 0.4);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat.clone());
    rightEye.position.set(0.3, 3.2, 0.4);
    group.add(rightEye);

    const side = i < 3 ? -1 : 1;
    const zOffset = (i % 3) * -15 - 10;
    group.position.set(side * (6 + Math.random() * 3), TERRAIN_Y, zOffset);

    creatures.push(group);
  }

  return creatures;
}

export function updateDread(delta) {
  if (!active) return;

  timer -= delta;

  // Transition in
  if (timer > DREAD_DURATION - TRANSITION_IN_DURATION) {
    transitionProgress = Math.min(1, (DREAD_DURATION - timer) / TRANSITION_IN_DURATION);
  }
  // Transition out
  else if (timer < TRANSITION_OUT_DURATION) {
    transitionProgress = Math.max(0, timer / TRANSITION_OUT_DURATION);
  } else {
    transitionProgress = 1;
  }

  transitionToDread(transitionProgress);

  // Eyes visibility and pulsing
  if (dreadEyes) {
    dreadEyes.visible = transitionProgress > 0.3;
    const pulse = 0.8 + Math.sin(performance.now() * 0.005) * 0.2;
    dreadEyes.scale.setScalar(pulse * transitionProgress);
  }

  // Shadow creatures fade in/out
  for (const creature of shadowCreatures) {
    creature.traverse((child) => {
      if (child.material && child.material.opacity !== undefined) {
        child.material.opacity = transitionProgress * 0.7;
      }
    });
    // Slight sway
    creature.rotation.z = Math.sin(performance.now() * 0.002 + creature.position.x) * 0.1;
  }

  // End dread mode
  if (timer <= 0) {
    endDread();
  }
}

function endDread() {
  active = false;
  transitionProgress = 0;
  transitionToDread(0);

  // Remove eyes
  if (dreadEyes) {
    dreadEyes.parent?.remove(dreadEyes);
    dreadEyes = null;
  }

  // Remove shadow creatures
  for (const creature of shadowCreatures) {
    creature.parent?.remove(creature);
  }
  shadowCreatures = [];

  if (dreadQuoteCallback) {
    dreadQuoteCallback();
  }
}

export function isDreadActive() {
  return active;
}

export function getDreadSpeedMultiplier() {
  return active ? DREAD_SPEED_MULTIPLIER : 1;
}

export function cleanupDread() {
  if (active) {
    active = false;
    transitionToDread(0);
    if (dreadEyes) {
      dreadEyes.parent?.remove(dreadEyes);
      dreadEyes = null;
    }
    for (const creature of shadowCreatures) {
      creature.parent?.remove(creature);
    }
    shadowCreatures = [];
  }
}
```

- [ ] **Step 3: Wire dread mode into main.js**

Add imports:
```js
import { startDread, updateDread, isDreadActive, getDreadSpeedMultiplier, cleanupDread } from './dread.js';
import { DREAD_MULTIPLIER, DREAD_DAMAGE_MULTIPLIER } from './constants.js';
```

In `startGame()`, add:
```js
  cleanupDread();
```

In game loop, multiply speed by dread factor:
```js
  const dreadMultiplier = getDreadSpeedMultiplier();
  const currentSpeed = speed * dreadMultiplier;
```

Use `currentSpeed` instead of `speed` for movement and scoring. Apply `DREAD_MULTIPLIER` to score when dread active:
```js
  const scoreMultiplier = isDreadActive() ? DREAD_MULTIPLIER : 1;
  score += currentSpeed * delta * POINTS_PER_METER * scoreMultiplier;
```

In collision, use dread damage:
```js
  const damage = isDreadActive() ? DREAD_DAMAGE_MULTIPLIER : 1;
  hearts -= damage;
```

In collectible handler for `abyssOrb`:
```js
  if (pickup.type === 'abyssOrb' && !isDreadActive()) {
    startDread(scene, () => {
      showMultiplier(false);
      // Show dread exit quote briefly (handled by a timeout overlay)
    });
    showMultiplier(true);
  }
```

Add `updateDread(delta)` call in the loop. Add `showMultiplier(isDreadActive())` to keep multiplier in sync.

- [ ] **Step 4: Verify — run dev server**

Expect: When collecting an abyss orb, screen darkens over 1.5s, giant red pulsing eyes appear on horizon, shadow creatures fade in on sides. "2X" multiplier badge pulsates. After 12 seconds, light returns. Score accumulates faster during dread. Getting hit costs 2 hearts during dread. Obstacles are harder to see in the dark.

- [ ] **Step 5: Commit**

```bash
git add src/dread.js src/scene.js src/main.js
git commit -m "feat: add existential dread mode with visual effects and multiplier"
```

---

### Task 11: Achievements System

**Files:**
- Create: `src/achievements.js`
- Modify: `src/main.js`
- Modify: `src/screens.js`
- Modify: `style.css`

- [ ] **Step 1: Create achievements.js**

```js
// src/achievements.js

const MILESTONE_ACHIEVEMENTS = [
  { id: 'first_steps', name: 'First Steps', description: 'Run 100m', check: (stats) => stats.distance >= 100 },
  { id: 'long_walk', name: 'The Long Walk', description: 'Run 1km', check: (stats) => stats.distance >= 1000 },
  { id: 'ubermensch', name: 'Ubermensch', description: 'Run 5km', check: (stats) => stats.distance >= 5000 },
  { id: 'stared_abyss', name: 'Stared Into the Abyss', description: 'Survive 1 dread sequence', check: (stats) => stats.dreadsSurvived >= 1 },
  { id: 'abyss_veteran', name: 'Abyss Veteran', description: 'Survive 10 dread sequences total', check: (stats) => stats.totalDreadsSurvived >= 10 },
  { id: 'fish_philosopher', name: 'Fish Philosopher', description: 'Collect 100 fish in one run', check: (stats) => stats.fishThisRun >= 100 },
  { id: 'eternal_return', name: 'Eternal Return', description: 'Play 10 games', check: (stats) => stats.totalGames >= 10 },
  { id: 'beyond_good_evil', name: 'Beyond Good and Evil', description: 'Score 10,000 points', check: (stats) => stats.score >= 10000 },
];

const STORAGE_KEY = 'np_achievements';
const QUOTES_KEY = 'np_quotes';
const STATS_KEY = 'np_stats';

function loadData(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function getUnlockedAchievements() {
  return loadData(STORAGE_KEY, []);
}

export function getCollectedQuotes() {
  return loadData(QUOTES_KEY, []);
}

export function getPersistentStats() {
  return loadData(STATS_KEY, { totalDreadsSurvived: 0, totalGames: 0 });
}

export function collectQuote(quoteText) {
  const quotes = getCollectedQuotes();
  if (!quotes.includes(quoteText)) {
    quotes.push(quoteText);
    saveData(QUOTES_KEY, quotes);
    return true; // new quote
  }
  return false;
}

export function checkAchievements(runStats) {
  const unlocked = getUnlockedAchievements();
  const newlyUnlocked = [];

  for (const achievement of MILESTONE_ACHIEVEMENTS) {
    if (!unlocked.includes(achievement.id) && achievement.check(runStats)) {
      unlocked.push(achievement.id);
      newlyUnlocked.push(achievement.name);
    }
  }

  saveData(STORAGE_KEY, unlocked);
  return newlyUnlocked;
}

export function incrementPersistentStats(runStats) {
  const stats = getPersistentStats();
  stats.totalDreadsSurvived += runStats.dreadsSurvived || 0;
  stats.totalGames += 1;
  saveData(STATS_KEY, stats);
  return stats;
}

export function getAllAchievements() {
  return MILESTONE_ACHIEVEMENTS;
}
```

- [ ] **Step 2: Add achievements gallery to screens.js**

Add to `src/screens.js`:

```js
import { getAllAchievements, getUnlockedAchievements, getCollectedQuotes } from './achievements.js';
import { getNietzscheQuotes } from './collectibles.js';

// In createStartScreen, wire up the achievements button:
// document.getElementById('achievements-btn').addEventListener('click', showAchievementsGallery);
```

Add a `showAchievementsGallery` function:

```js
export function showAchievementsGallery() {
  const overlay = document.createElement('div');
  overlay.id = 'achievements-gallery';

  const unlocked = getUnlockedAchievements();
  const allAchievements = getAllAchievements();
  const collectedQuotes = getCollectedQuotes();
  const allQuotes = getNietzscheQuotes();

  overlay.innerHTML = `
    <h2 class="gallery-title">ACHIEVEMENTS</h2>
    <div class="gallery-section">
      <h3>MILESTONES</h3>
      ${allAchievements.map(a => `
        <div class="gallery-item ${unlocked.includes(a.id) ? 'unlocked' : 'locked'}">
          <span class="gallery-icon">${unlocked.includes(a.id) ? '🏆' : '🔒'}</span>
          <span class="gallery-name">${unlocked.includes(a.id) ? a.name : '???'}</span>
          <span class="gallery-desc">${a.description}</span>
        </div>
      `).join('')}
    </div>
    <div class="gallery-section">
      <h3>NIETZSCHE QUOTES (${collectedQuotes.length}/${allQuotes.length})</h3>
      ${allQuotes.map(q => `
        <div class="gallery-item ${collectedQuotes.includes(q) ? 'unlocked' : 'locked'}">
          <span class="gallery-icon">${collectedQuotes.includes(q) ? '📜' : '❓'}</span>
          <span class="gallery-text">${collectedQuotes.includes(q) ? `"${q}"` : '???'}</span>
        </div>
      `).join('')}
    </div>
    <button id="gallery-close" class="game-btn">BACK</button>
  `;

  document.getElementById('ui-overlay').appendChild(overlay);
  document.getElementById('gallery-close').addEventListener('click', () => overlay.remove());
}
```

- [ ] **Step 3: Add gallery styles to style.css**

Append:

```css
/* Achievements Gallery */
#achievements-gallery {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  z-index: 200;
  overflow-y: auto;
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.gallery-title {
  font-family: 'Bangers', cursive;
  font-size: 42px;
  margin-bottom: 20px;
}

.gallery-section {
  width: 100%;
  max-width: 500px;
  margin-bottom: 30px;
}

.gallery-section h3 {
  font-family: 'Bangers', cursive;
  font-size: 22px;
  color: #aaccee;
  margin-bottom: 10px;
  border-bottom: 1px solid #333;
  padding-bottom: 5px;
}

.gallery-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #222;
  font-size: 16px;
}

.gallery-item.locked {
  opacity: 0.4;
}

.gallery-icon {
  font-size: 22px;
  min-width: 30px;
  text-align: center;
}

.gallery-name {
  font-weight: bold;
}

.gallery-desc {
  color: #888;
  font-size: 14px;
}

.gallery-text {
  font-style: italic;
  font-size: 14px;
}
```

- [ ] **Step 4: Wire achievements into main.js**

Add imports:
```js
import {
  checkAchievements, incrementPersistentStats, getPersistentStats,
  collectQuote,
} from './achievements.js';
```

Track `dreadsSurvived` during the run. On dread end callback, increment.

In `gameOver()`:
```js
  const persistentStats = incrementPersistentStats({ dreadsSurvived: dreadsSurvivedThisRun });
  const runStats = {
    distance,
    score,
    fishThisRun: fishCount,
    dreadsSurvived: dreadsSurvivedThisRun,
    totalDreadsSurvived: persistentStats.totalDreadsSurvived,
    totalGames: persistentStats.totalGames,
  };
  newAchievements = checkAchievements(runStats);
```

In quote collectible handler:
```js
  const isNew = collectQuote(pickup.quoteText);
  if (isNew) newAchievements.push(`Quote: "${pickup.quoteText}"`);
```

- [ ] **Step 5: Verify — run dev server**

Expect: Achievements button on start screen opens gallery. Milestones show as locked (???) until conditions met. Collected quotes appear, uncollected show ???. Playing the game and dying shows any newly unlocked achievements on game over screen. Data persists across browser refreshes.

- [ ] **Step 6: Commit**

```bash
git add src/achievements.js src/screens.js src/main.js style.css
git commit -m "feat: add achievements system with gallery and localStorage persistence"
```

---

### Task 12: Audio Placeholder & Polish

**Files:**
- Create: `src/audio.js`
- Modify: `src/main.js`

- [ ] **Step 1: Create audio.js placeholder**

```js
// src/audio.js
// Placeholder for future sound effects and music.
// Each function is called by the game but does nothing until
// sound files are added to assets/sounds/.

export function initAudio() {}
export function playJump() {}
export function playHit() {}
export function playCollect() {}
export function playDreadEnter() {}
export function playDreadExit() {}
export function playGameOver() {}
export function setMusicPlaying(playing) {}
```

- [ ] **Step 2: Import audio stubs in main.js**

```js
import { initAudio, playJump, playHit, playCollect, playDreadEnter, playDreadExit, playGameOver } from './audio.js';
```

Call `initAudio()` on init. Call `playJump()` in jump handler, `playHit()` on collision, `playCollect()` on fish pickup, `playDreadEnter()` / `playDreadExit()` on dread transitions, `playGameOver()` on game over. These are no-ops now but wired for future use.

- [ ] **Step 3: Add .gitignore for dist and node_modules**

```
node_modules/
dist/
.env*.local
```

- [ ] **Step 4: Verify — full playthrough**

Run `npx vite` and do a full playthrough:
1. Start screen appears with title, tap to start
2. Penguin runs forward, obstacles spawn, can dodge/jump/slide
3. Fish collectible increases count and score
4. Getting hit loses hearts, invincibility blink
5. 0 hearts = game over screen with stats
6. Abyss orb triggers dread mode — dark, eyes, 2x multiplier
7. Achievements gallery accessible and tracks progress
8. High score persists
9. Play again works cleanly (no leftover obstacles/collectibles)
10. Mobile: test swipe controls on device or Chrome DevTools mobile emulation

- [ ] **Step 5: Commit**

```bash
git add src/audio.js .gitignore src/main.js
git commit -m "feat: add audio placeholder and gitignore, complete MVP"
```

---

### Task 13: Final Integration & Main.js Assembly

**Files:**
- Modify: `src/main.js` (final complete version)

This task assembles the complete `main.js` with all systems properly integrated. Previous tasks built each system; this ensures the final file has no TODO comments, all handlers are wired, and the game loop is clean.

- [ ] **Step 1: Write complete main.js**

The file should contain:
- All imports from every module
- Game state variables (gameState, worldZ, speed, elapsed, score, hearts, fishCount, distance, dreadsSurvivedThisRun, newAchievements)
- Scene, terrain, penguin, HUD initialization
- Controls wired with gameState guards
- Start screen creation
- `startGame()` function that resets everything
- `gameOver()` function with achievement checks and persistent stats
- Game loop with: speed calc → movement → penguin update → terrain update → obstacle spawn/update → collectible spawn/update → collision check → pickup handling → dread update → camera → render
- All audio stub calls at appropriate points

- [ ] **Step 2: Verify — complete playthrough on desktop and mobile emulation**

Test every feature:
- Start → Play → Die → Game Over → Play Again cycle
- Lane switching (left/right)
- Jump over ground obstacles
- Slide under overhead obstacles
- Fish collection (regular + golden)
- Health restore at 10 fish
- Quote collection
- Abyss orb → dread mode → 2x multiplier → 2x damage → exits after 12s
- Achievements unlock and display
- High score persistence
- Mobile swipe controls (Chrome DevTools → Toggle Device Toolbar)

- [ ] **Step 3: Commit**

```bash
git add src/main.js
git commit -m "feat: finalize game loop integration with all systems"
```

---

## Summary

| Task | What it builds | Key files |
|------|---------------|-----------|
| 1 | Project scaffold | package.json, vite.config.js, index.html, style.css |
| 2 | Constants + Three.js scene | constants.js, scene.js |
| 3 | Ice path terrain + mountains | terrain.js |
| 4 | Penguin character + waddle | penguin.js |
| 5 | Keyboard + touch controls | controls.js |
| 6 | Obstacles + collision | obstacles.js, collision.js |
| 7 | Fish, quotes, abyss orbs | collectibles.js |
| 8 | HUD overlay | hud.js |
| 9 | Game state machine + screens | screens.js, main.js |
| 10 | Existential dread mode | dread.js |
| 11 | Achievements system | achievements.js |
| 12 | Audio placeholder + polish | audio.js, .gitignore |
| 13 | Final integration | main.js (complete) |
