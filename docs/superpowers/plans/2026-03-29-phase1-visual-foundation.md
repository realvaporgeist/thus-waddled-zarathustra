# Phase 1 — Visual Foundation & Start Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the game into "Thus Waddles Zarathustra" with a cinematic 3D start screen, parallax mountains, weather system, aurora borealis, particle effects, screen juice, and polished HUD.

**Architecture:** New modules (`particles.js`, `weather.js`, `aurora.js`) are added alongside existing ones. The game loop in `main.js` gains a camera state machine for the cinematic intro. All visual systems integrate through the existing scene and render pipeline — no post-processing pass needed. Weather, aurora, and particles each manage their own Three.js objects and expose `update(delta)` + `init(scene)` interfaces.

**Tech Stack:** Three.js (^0.183.2), vanilla JS (ES6 modules), Vite, Web Audio API, CSS3 animations

**Note:** This project has no test framework. Verification steps use `npx vite` (dev server) for visual confirmation.

---

### Task 1: Constants & Game Rename

**Files:**
- Modify: `src/constants.js`
- Modify: `index.html`
- Modify: `src/screens.js`

- [ ] **Step 1: Add new constants to `src/constants.js`**

Append these blocks to the end of `src/constants.js`:

```js
// Parallax mountains
export const MOUNTAIN_LAYERS = [
  { scrollFactor: 0.1, zBase: -190, scale: 1.3, fogTint: 0.6, yOffset: 0 },   // far
  { scrollFactor: 0.3, zBase: -145, scale: 1.0, fogTint: 0.3, yOffset: 0 },   // mid
  { scrollFactor: 0.6, zBase: -110, scale: 0.7, fogTint: 0.0, yOffset: 0 },   // near
];

// Weather
export const WEATHER_TYPES = ['lightSnow', 'blizzard', 'clearAurora', 'fog'];
export const WEATHER_CHANGE_MIN = 60;
export const WEATHER_CHANGE_MAX = 90;
export const WEATHER_CROSSFADE_DURATION = 5;
export const SNOW_PARTICLE_COUNTS = { lightSnow: 200, blizzard: 600, clearAurora: 0, fog: 100 };
export const SNOW_AREA_WIDTH = 40;
export const SNOW_AREA_HEIGHT = 25;
export const SNOW_AREA_DEPTH = 60;
export const BLIZZARD_WIND_DRIFT = 3;

// Weather fog/sky per type
export const WEATHER_FOG = {
  lightSnow:   { skyColor: 0xa8c4d8, fogColor: 0xb0c8d6, fogNear: 30, fogFar: 200 },
  blizzard:    { skyColor: 0x8a9eb0, fogColor: 0x95aabb, fogNear: 10, fogFar: 80 },
  clearAurora: { skyColor: 0x0a1628, fogColor: 0x0a1628, fogNear: 50, fogFar: 300 },
  fog:         { skyColor: 0x9ab0c0, fogColor: 0xa0b8c8, fogNear: 8, fogFar: 60 },
};

// Aurora
export const AURORA_RIBBON_COUNT = 3;
export const AURORA_Y = 50;
export const AURORA_Z = -120;
export const AURORA_WIDTH = 80;
export const AURORA_SEGMENTS = 64;
export const AURORA_WAVE_SPEED = 0.3;
export const AURORA_COLOR_SPEED = 0.15;

// Particles
export const PARTICLE_BUDGET = 800;
export const COLLECTION_PARTICLES = {
  fish:       { count: 10, color: 0xc0d8e8, duration: 0.3, speed: 5, type: 'burst' },
  goldenFish: { count: 18, color: 0xffd700, duration: 0.5, speed: 4, type: 'burst' },
  quote:      { count: 12, color: 0xffeeaa, duration: 0.4, speed: 3, type: 'spiral' },
  abyssOrb:   { count: 22, color: 0x8800cc, duration: 0.6, speed: 6, type: 'implode' },
};

// Screen effects
export const SCREEN_SHAKE_DURATION = 0.15;
export const SCREEN_SHAKE_INTENSITY_LIGHT = 0.08;
export const SCREEN_SHAKE_INTENSITY_HEAVY = 0.2;
export const VIGNETTE_DURATION = 0.2;
export const VIGNETTE_OPACITY = 0.3;
export const SPEED_LINE_THRESHOLD = 0.8; // fraction of MAX_SPEED
export const NEAR_MISS_THRESHOLD = 0.3;

// Cinematic camera
export const CAMERA_INTRO_DURATION = 3.0;
export const CAMERA_INTRO_START = { x: 0, y: 40, z: 5 };
export const CAMERA_INTRO_END = { x: 0.5, y: 2.5, z: 6 };
export const CAMERA_INTRO_LOOK_START = { x: 0, y: 0, z: -100 };
export const CAMERA_INTRO_LOOK_END = { x: 0, y: 1.5, z: -2 };
export const CAMERA_GAMEPLAY_TRANSITION = 0.5;
export const CAMERA_IDLE_SWAY_SPEED = 0.3;
export const CAMERA_IDLE_SWAY_AMOUNT = 0.5;

// Penguin idle animation
export const IDLE_WADDLE_SPEED = 3;
export const IDLE_BLINK_MIN = 3;
export const IDLE_BLINK_MAX = 6;
export const IDLE_BLINK_DURATION = 0.15;
export const IDLE_LOOK_MIN = 5;
export const IDLE_LOOK_MAX = 10;
export const IDLE_LOOK_DURATION = 1.0;
export const KNOCKBACK_DURATION = 0.2;
export const KNOCKBACK_DISTANCE = 0.3;
```

- [ ] **Step 2: Update the HTML title**

In `index.html`, change:
```html
<title>Nietzsche Penguin</title>
```
to:
```html
<title>Thus Waddles Zarathustra</title>
```

- [ ] **Step 3: Update start screen title in `src/screens.js`**

In `src/screens.js`, in the `createStartScreen` function, change the title HTML:
```html
<h1 class="game-title">NIETZSCHE<br>PENGUIN</h1>
```
to:
```html
<h1 class="game-title">THUS WADDLES<br>ZARATHUSTRA</h1>
```

Also change the `localStorage` key prefix from `np_` to `twz_` in `refreshHighScore` and `showGameOverScreen` — actually, for backwards compatibility with existing save data, keep `np_` for now. We can migrate keys in a future task.

- [ ] **Step 4: Verify**

Run: `npx vite`
Expected: Page title says "Thus Waddles Zarathustra", start screen shows "THUS WADDLES ZARATHUSTRA".

- [ ] **Step 5: Commit**

```bash
git add src/constants.js index.html src/screens.js
git commit -m "feat: rename game and add Phase 1 constants"
```

---

### Task 2: Parallax Mountain System

**Files:**
- Modify: `src/terrain.js`
- Modify: `src/constants.js` (already done in Task 1)

- [ ] **Step 1: Refactor `createMountains()` in `src/terrain.js` to generate 3 layers**

Replace the entire `createMountains()` function and the `mountainGroup` variable with a layered system. Replace the import line to include the new constants, and replace all mountain-related code:

```js
// At top of file, update imports to include MOUNTAIN_LAYERS:
import {
  PATH_WIDTH,
  CHUNK_LENGTH,
  VISIBLE_CHUNKS,
  TERRAIN_Y,
  PATH_COLOR,
  SNOW_COLOR,
  MOUNTAIN_COLOR,
  MOUNTAIN_LAYERS,
} from './constants.js';
```

Replace `let mountainGroup = null;` with:
```js
const mountainLayers = []; // { group, scrollFactor, peaks[] }
```

Replace the `createMountains()` function with:
```js
function createMountainLayer(layerConfig, layerIndex) {
  const group = new THREE.Group();
  const baseTint = new THREE.Color(MOUNTAIN_COLOR);
  // Fog tint: blend toward sky blue for distant layers
  const fogColor = new THREE.Color(0xa8c4d8);
  const tintedColor = baseTint.clone().lerp(fogColor, layerConfig.fogTint);

  const mountainMat = new THREE.MeshStandardMaterial({
    color: tintedColor,
    flatShading: true,
  });
  const snowCapMat = new THREE.MeshStandardMaterial({
    color: 0xe8eef4,
    flatShading: true,
    opacity: 1 - layerConfig.fogTint * 0.5,
    transparent: layerConfig.fogTint > 0.3,
  });
  const deepSnowMat = new THREE.MeshStandardMaterial({
    color: 0xdde6ee,
    flatShading: true,
    opacity: 1 - layerConfig.fogTint * 0.3,
    transparent: layerConfig.fogTint > 0.3,
  });

  // Generate peaks for this layer
  const peakCount = layerIndex === 0 ? 8 : layerIndex === 1 ? 7 : 5;
  const peaks = [];
  for (let i = 0; i < peakCount; i++) {
    const spread = layerIndex === 0 ? 200 : layerIndex === 1 ? 180 : 160;
    const x = (i / (peakCount - 1)) * spread - spread / 2 + (Math.random() - 0.5) * 20;
    const baseHeight = layerIndex === 0 ? 55 : layerIndex === 1 ? 38 : 22;
    const h = baseHeight + (Math.random() - 0.5) * baseHeight * 0.5;
    const r = (h * 0.55 + Math.random() * 5) * layerConfig.scale;
    const z = layerConfig.zBase + (Math.random() - 0.5) * 15;
    peaks.push({ x, z, h: h * layerConfig.scale, r });
  }

  for (const peak of peaks) {
    const sides = 5 + Math.floor(Math.random() * 4);

    const geo = new THREE.ConeGeometry(peak.r, peak.h, sides);
    const mountain = new THREE.Mesh(geo, mountainMat);
    mountain.position.set(peak.x, peak.h / 2, peak.z);
    group.add(mountain);

    const capGeo = new THREE.ConeGeometry(peak.r * 0.45, peak.h * 0.35, sides);
    const cap = new THREE.Mesh(capGeo, snowCapMat);
    cap.position.set(peak.x, peak.h * 0.82, peak.z);
    group.add(cap);

    if (peak.h > 20) {
      const bandGeo = new THREE.ConeGeometry(peak.r * 0.65, peak.h * 0.2, sides);
      const band = new THREE.Mesh(bandGeo, deepSnowMat);
      band.position.set(peak.x, peak.h * 0.65, peak.z);
      group.add(band);
    }
  }

  return { group, scrollFactor: layerConfig.scrollFactor, baseX: 0 };
}

function createMountains(scene) {
  for (let i = 0; i < MOUNTAIN_LAYERS.length; i++) {
    const layer = createMountainLayer(MOUNTAIN_LAYERS[i], i);
    scene.add(layer.group);
    mountainLayers.push(layer);
  }
}
```

- [ ] **Step 2: Update `createTerrain` to call new `createMountains`**

Change:
```js
mountainGroup = createMountains();
scene.add(mountainGroup);
```
to:
```js
createMountains(scene);
```

- [ ] **Step 3: Add parallax scrolling to `updateTerrain`**

Add parallax update at the end of `updateTerrain`:
```js
export function updateTerrain(speed, delta) {
  // ... existing chunk logic stays the same ...

  // Parallax mountain scrolling
  for (const layer of mountainLayers) {
    layer.baseX += speed * delta * layer.scrollFactor * 0.02;
    layer.group.position.x = Math.sin(layer.baseX) * 2;
  }
}
```

- [ ] **Step 4: Update `getMountainGroup` export**

Replace:
```js
export function getMountainGroup() {
  return mountainGroup;
}
```
with:
```js
export function getMountainLayers() {
  return mountainLayers;
}
```

- [ ] **Step 5: Add `swayMountains` export for start screen idle camera**

Add this function:
```js
export function swayMountains(swayX) {
  for (let i = 0; i < mountainLayers.length; i++) {
    const layer = mountainLayers[i];
    layer.group.position.x = swayX * layer.scrollFactor * 3;
  }
}
```

- [ ] **Step 6: Verify**

Run: `npx vite`
Expected: Mountains appear in 3 distinct depth layers — far mountains are large and blue-tinted, mid mountains are medium and less tinted, near hills are smaller and full contrast. Mountains shift slightly as you play.

- [ ] **Step 7: Commit**

```bash
git add src/terrain.js
git commit -m "feat: add 3-layer parallax mountain system"
```

---

### Task 3: Particle System

**Files:**
- Create: `src/particles.js`

- [ ] **Step 1: Create `src/particles.js`**

```js
// src/particles.js
import * as THREE from 'three';
import { PARTICLE_BUDGET } from './constants.js';

// Pool-based particle emitter system
// Each particle: { position, velocity, life, maxLife, color, size }

const emitters = []; // active emitters
let scene = null;
let totalActiveParticles = 0;

// Shared geometry for all particles
const particleGeo = new THREE.BufferGeometry();
const MAX_PARTICLES_PER_EMITTER = 30;
const positions = new Float32Array(MAX_PARTICLES_PER_EMITTER * 3);
const colors = new Float32Array(MAX_PARTICLES_PER_EMITTER * 3);
const sizes = new Float32Array(MAX_PARTICLES_PER_EMITTER);

export function initParticles(sceneRef) {
  scene = sceneRef;
}

/**
 * Spawn a burst of particles at a world position.
 * @param {Object} config
 * @param {THREE.Vector3} config.position - World position
 * @param {number} config.count - Number of particles
 * @param {number} config.color - Hex color
 * @param {number} config.duration - Lifetime in seconds
 * @param {number} config.speed - Initial velocity magnitude
 * @param {string} config.type - 'burst' | 'spiral' | 'implode'
 * @param {number} [config.size=0.08] - Particle size
 */
export function emitParticles(config) {
  const {
    position, count, color, duration, speed,
    type = 'burst', size = 0.08,
  } = config;

  // Budget check
  if (totalActiveParticles + count > PARTICLE_BUDGET) return;

  const colorObj = new THREE.Color(color);
  const particles = [];

  for (let i = 0; i < count; i++) {
    const p = {
      x: position.x, y: position.y, z: position.z,
      vx: 0, vy: 0, vz: 0,
      life: 0,
      maxLife: duration * (0.7 + Math.random() * 0.6),
      size,
    };

    if (type === 'burst') {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI - Math.PI / 2;
      p.vx = Math.cos(theta) * Math.cos(phi) * speed * (0.5 + Math.random() * 0.5);
      p.vy = Math.sin(phi) * speed * (0.5 + Math.random() * 0.5) + 2;
      p.vz = Math.sin(theta) * Math.cos(phi) * speed * (0.5 + Math.random() * 0.5);
    } else if (type === 'spiral') {
      const angle = (i / count) * Math.PI * 4;
      const r = 0.5 + Math.random();
      p.vx = Math.cos(angle) * r * speed * 0.3;
      p.vy = speed * 0.5 + Math.random() * 2;
      p.vz = Math.sin(angle) * r * speed * 0.3;
    } else if (type === 'implode') {
      // Start spread out, converge to center, then explode
      const theta = Math.random() * Math.PI * 2;
      const r = 1.5 + Math.random() * 1.5;
      p.x += Math.cos(theta) * r;
      p.z += Math.sin(theta) * r;
      p.y += (Math.random() - 0.5) * r;
      // First half of life: move inward. We handle this in update.
      p.originX = position.x;
      p.originY = position.y;
      p.originZ = position.z;
      p.vx = 0; p.vy = 0; p.vz = 0;
      p.implode = true;
    }

    particles.push(p);
  }

  // Create Points mesh for this emitter
  const geom = new THREE.BufferGeometry();
  const posAttr = new Float32Array(count * 3);
  const colAttr = new Float32Array(count * 3);
  const sizeAttr = new Float32Array(count);
  geom.setAttribute('position', new THREE.BufferAttribute(posAttr, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(colAttr, 3));
  geom.setAttribute('size', new THREE.BufferAttribute(sizeAttr, 1));

  const mat = new THREE.PointsMaterial({
    size,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geom, mat);
  scene.add(points);

  emitters.push({
    particles,
    points,
    geom,
    mat,
    color: colorObj,
    maxDuration: duration * 1.3,
    elapsed: 0,
    type,
  });

  totalActiveParticles += count;
}

export function updateParticles(delta) {
  for (let e = emitters.length - 1; e >= 0; e--) {
    const emitter = emitters[e];
    emitter.elapsed += delta;

    const posArr = emitter.geom.attributes.position.array;
    const colArr = emitter.geom.attributes.color.array;

    let allDead = true;

    for (let i = 0; i < emitter.particles.length; i++) {
      const p = emitter.particles[i];
      p.life += delta;

      if (p.life >= p.maxLife) {
        // Hide dead particle
        posArr[i * 3] = 0; posArr[i * 3 + 1] = -100; posArr[i * 3 + 2] = 0;
        continue;
      }

      allDead = false;
      const t = p.life / p.maxLife; // 0..1 normalized life

      if (p.implode) {
        // First 40%: converge to origin. Last 60%: explode outward
        if (t < 0.4) {
          const it = t / 0.4;
          p.x = THREE.MathUtils.lerp(p.x, p.originX, it * 0.1);
          p.y = THREE.MathUtils.lerp(p.y, p.originY, it * 0.1);
          p.z = THREE.MathUtils.lerp(p.z, p.originZ, it * 0.1);
        } else {
          if (!p.exploded) {
            p.exploded = true;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI - Math.PI / 2;
            const s = 6 + Math.random() * 4;
            p.vx = Math.cos(theta) * Math.cos(phi) * s;
            p.vy = Math.sin(phi) * s + 2;
            p.vz = Math.sin(theta) * Math.cos(phi) * s;
          }
          p.x += p.vx * delta;
          p.vy -= 8 * delta; // gravity
          p.y += p.vy * delta;
          p.z += p.vz * delta;
        }
      } else {
        p.x += p.vx * delta;
        p.vy -= 5 * delta; // light gravity
        p.y += p.vy * delta;
        p.z += p.vz * delta;
      }

      posArr[i * 3] = p.x;
      posArr[i * 3 + 1] = p.y;
      posArr[i * 3 + 2] = p.z;

      // Fade color by life
      const fade = 1 - t;
      colArr[i * 3] = emitter.color.r * fade;
      colArr[i * 3 + 1] = emitter.color.g * fade;
      colArr[i * 3 + 2] = emitter.color.b * fade;
    }

    emitter.geom.attributes.position.needsUpdate = true;
    emitter.geom.attributes.color.needsUpdate = true;
    emitter.mat.opacity = Math.max(0, 1 - emitter.elapsed / emitter.maxDuration);

    if (allDead || emitter.elapsed >= emitter.maxDuration) {
      scene.remove(emitter.points);
      emitter.geom.dispose();
      emitter.mat.dispose();
      totalActiveParticles -= emitter.particles.length;
      emitters.splice(e, 1);
    }
  }
}

export function clearParticles() {
  for (const emitter of emitters) {
    scene.remove(emitter.points);
    emitter.geom.dispose();
    emitter.mat.dispose();
  }
  emitters.length = 0;
  totalActiveParticles = 0;
}

export function getActiveParticleCount() {
  return totalActiveParticles;
}
```

- [ ] **Step 2: Verify the module loads**

Run: `npx vite`
Open browser console, confirm no import errors. (The module isn't wired into the game loop yet — that comes in Task 8.)

- [ ] **Step 3: Commit**

```bash
git add src/particles.js
git commit -m "feat: add pool-based particle system"
```

---

### Task 4: Aurora Borealis

**Files:**
- Create: `src/aurora.js`

- [ ] **Step 1: Create `src/aurora.js`**

```js
// src/aurora.js
import * as THREE from 'three';
import {
  AURORA_RIBBON_COUNT, AURORA_Y, AURORA_Z,
  AURORA_WIDTH, AURORA_SEGMENTS,
  AURORA_WAVE_SPEED, AURORA_COLOR_SPEED,
} from './constants.js';

let ribbons = []; // { mesh, material, phaseOffset }
let scene = null;
let currentOpacity = 0.4;
let targetOpacity = 0.4;
let dreadBlend = 0; // 0 = normal, 1 = dread red

const normalColors = [
  new THREE.Color(0x00ff88), // green
  new THREE.Color(0x00ccaa), // teal
  new THREE.Color(0x8844ff), // purple
];
const dreadColors = [
  new THREE.Color(0xff1111),
  new THREE.Color(0xcc0022),
  new THREE.Color(0x880044),
];

export function initAurora(sceneRef) {
  scene = sceneRef;

  for (let r = 0; r < AURORA_RIBBON_COUNT; r++) {
    const geometry = new THREE.BufferGeometry();
    const vertCount = AURORA_SEGMENTS * 2;
    const positions = new Float32Array(vertCount * 3);
    const uvs = new Float32Array(vertCount * 2);
    const indices = [];

    // Build ribbon strip
    for (let i = 0; i < AURORA_SEGMENTS; i++) {
      const u = i / (AURORA_SEGMENTS - 1);
      const x = (u - 0.5) * AURORA_WIDTH;
      const topIdx = i * 2;
      const botIdx = i * 2 + 1;

      positions[topIdx * 3] = x;
      positions[topIdx * 3 + 1] = 0;
      positions[topIdx * 3 + 2] = 0;

      positions[botIdx * 3] = x;
      positions[botIdx * 3 + 1] = -3 - Math.random() * 2;
      positions[botIdx * 3 + 2] = 0;

      uvs[topIdx * 2] = u;
      uvs[topIdx * 2 + 1] = 1;
      uvs[botIdx * 2] = u;
      uvs[botIdx * 2 + 1] = 0;

      if (i < AURORA_SEGMENTS - 1) {
        indices.push(topIdx, botIdx, topIdx + 2);
        indices.push(botIdx, botIdx + 2, topIdx + 2);
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(indices);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPhase: { value: r * 2.1 },
        uOpacity: { value: currentOpacity },
        uColor1: { value: normalColors[0].clone() },
        uColor2: { value: normalColors[1].clone() },
        uColor3: { value: normalColors[2].clone() },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uPhase;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          float wave = sin(pos.x * 0.08 + uTime + uPhase) * 4.0
                     + sin(pos.x * 0.15 + uTime * 0.7 + uPhase) * 2.0;
          pos.y += wave * uv.y;
          pos.z += sin(pos.x * 0.05 + uTime * 0.5) * 2.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        varying vec2 vUv;
        void main() {
          // Gradient across ribbon width
          vec3 col = mix(uColor1, uColor2, vUv.x);
          col = mix(col, uColor3, smoothstep(0.4, 0.8, vUv.x));
          // Fade at top and bottom
          float alpha = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
          // Fade at ribbon edges (left/right)
          alpha *= smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
          gl_FragColor = vec4(col, alpha * uOpacity);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, AURORA_Y + r * 5, AURORA_Z - r * 10);
    mesh.rotation.x = -0.15;
    scene.add(mesh);

    ribbons.push({ mesh, material, phaseOffset: r * 2.1 });
  }
}

export function updateAurora(delta) {
  const time = performance.now() * 0.001;

  // Smooth opacity transition
  currentOpacity += (targetOpacity - currentOpacity) * delta * 2;

  for (const ribbon of ribbons) {
    ribbon.material.uniforms.uTime.value = time * AURORA_WAVE_SPEED;
    ribbon.material.uniforms.uOpacity.value = currentOpacity;

    // Color blending between normal and dread
    for (let i = 0; i < 3; i++) {
      const uniform = [`uColor1`, `uColor2`, `uColor3`][i];
      ribbon.material.uniforms[uniform].value.lerpColors(
        normalColors[i], dreadColors[i], dreadBlend
      );
    }
  }
}

export function setAuroraOpacity(opacity) {
  targetOpacity = opacity;
}

export function setAuroraDreadBlend(blend) {
  dreadBlend = blend;
}

export function cleanupAurora() {
  for (const ribbon of ribbons) {
    scene.remove(ribbon.mesh);
    ribbon.material.dispose();
    ribbon.mesh.geometry.dispose();
  }
  ribbons = [];
}
```

- [ ] **Step 2: Verify**

Run: `npx vite`
No errors expected (not wired yet).

- [ ] **Step 3: Commit**

```bash
git add src/aurora.js
git commit -m "feat: add aurora borealis ribbon shader system"
```

---

### Task 5: Weather System

**Files:**
- Create: `src/weather.js`

- [ ] **Step 1: Create `src/weather.js`**

```js
// src/weather.js
import * as THREE from 'three';
import {
  WEATHER_TYPES, WEATHER_CHANGE_MIN, WEATHER_CHANGE_MAX,
  WEATHER_CROSSFADE_DURATION, SNOW_PARTICLE_COUNTS,
  SNOW_AREA_WIDTH, SNOW_AREA_HEIGHT, SNOW_AREA_DEPTH,
  BLIZZARD_WIND_DRIFT, WEATHER_FOG,
  SKY_COLOR, FOG_COLOR, NORMAL_FOG_NEAR, NORMAL_FOG_FAR,
} from './constants.js';
import { setAuroraOpacity } from './aurora.js';

let scene = null;
let snowPoints = null;
let snowPositions = null;
let snowVelocities = null;
let snowCount = 0;
const MAX_SNOW = 600; // max possible (blizzard)

let currentWeather = 'lightSnow';
let nextWeather = null;
let weatherTimer = 0;
let crossfadeTimer = 0;
let crossfading = false;

// Dread override
let dreadOverride = false;
let savedWeather = null;

// Fog/sky interpolation targets
let currentSky = new THREE.Color(SKY_COLOR);
let currentFog = new THREE.Color(FOG_COLOR);
let currentFogNear = NORMAL_FOG_NEAR;
let currentFogFar = NORMAL_FOG_FAR;

export function initWeather(sceneRef) {
  scene = sceneRef;

  // Create snow particle system with max capacity
  const geometry = new THREE.BufferGeometry();
  snowPositions = new Float32Array(MAX_SNOW * 3);
  snowVelocities = new Float32Array(MAX_SNOW * 3);

  // Initialize all particles below ground (inactive)
  for (let i = 0; i < MAX_SNOW; i++) {
    snowPositions[i * 3] = 0;
    snowPositions[i * 3 + 1] = -100;
    snowPositions[i * 3 + 2] = 0;
    snowVelocities[i * 3] = 0;
    snowVelocities[i * 3 + 1] = -2 - Math.random() * 3;
    snowVelocities[i * 3 + 2] = 0;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.15,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    sizeAttenuation: true,
  });

  snowPoints = new THREE.Points(geometry, material);
  scene.add(snowPoints);

  // Activate initial snow count
  snowCount = SNOW_PARTICLE_COUNTS[currentWeather];
  resetSnowPositions(snowCount);

  // Set initial weather timer
  weatherTimer = WEATHER_CHANGE_MIN + Math.random() * (WEATHER_CHANGE_MAX - WEATHER_CHANGE_MIN);

  applyWeatherVisuals(currentWeather, 1);
}

function resetSnowPositions(count) {
  for (let i = 0; i < MAX_SNOW; i++) {
    if (i < count) {
      snowPositions[i * 3] = (Math.random() - 0.5) * SNOW_AREA_WIDTH;
      snowPositions[i * 3 + 1] = Math.random() * SNOW_AREA_HEIGHT;
      snowPositions[i * 3 + 2] = -Math.random() * SNOW_AREA_DEPTH;
      snowVelocities[i * 3] = 0;
      snowVelocities[i * 3 + 1] = -2 - Math.random() * 3;
      snowVelocities[i * 3 + 2] = 0;
    } else {
      snowPositions[i * 3 + 1] = -100; // hide
    }
  }
}

function applyWeatherVisuals(weatherType, blend) {
  const config = WEATHER_FOG[weatherType];
  if (!config) return;

  const targetSky = new THREE.Color(config.skyColor);
  const targetFog = new THREE.Color(config.fogColor);

  currentSky.lerp(targetSky, blend);
  currentFog.lerp(targetFog, blend);
  currentFogNear = THREE.MathUtils.lerp(currentFogNear, config.fogNear, blend);
  currentFogFar = THREE.MathUtils.lerp(currentFogFar, config.fogFar, blend);

  scene.background.copy(currentSky);
  scene.fog.color.copy(currentFog);
  scene.fog.near = currentFogNear;
  scene.fog.far = currentFogFar;

  // Aurora opacity by weather type
  const auroraOpacity = {
    lightSnow: 0.4,
    blizzard: 0.0,
    clearAurora: 1.0,
    fog: 0.0,
  };
  setAuroraOpacity(auroraOpacity[weatherType] ?? 0.4);
}

export function updateWeather(delta) {
  if (dreadOverride) return; // dread controls visuals

  // Crossfade
  if (crossfading) {
    crossfadeTimer += delta;
    const t = Math.min(crossfadeTimer / WEATHER_CROSSFADE_DURATION, 1);

    applyWeatherVisuals(nextWeather, t * 0.1);

    // Interpolate snow particle count
    const fromCount = SNOW_PARTICLE_COUNTS[currentWeather];
    const toCount = SNOW_PARTICLE_COUNTS[nextWeather];
    snowCount = Math.round(THREE.MathUtils.lerp(fromCount, toCount, t));

    if (t >= 1) {
      crossfading = false;
      currentWeather = nextWeather;
      nextWeather = null;
      weatherTimer = WEATHER_CHANGE_MIN + Math.random() * (WEATHER_CHANGE_MAX - WEATHER_CHANGE_MIN);
    }
  } else {
    weatherTimer -= delta;
    if (weatherTimer <= 0) {
      // Pick a different weather
      const options = WEATHER_TYPES.filter(w => w !== currentWeather);
      nextWeather = options[Math.floor(Math.random() * options.length)];
      crossfading = true;
      crossfadeTimer = 0;
    }
  }

  // Update snow particles
  const isBlizzard = (crossfading ? nextWeather : currentWeather) === 'blizzard';
  const windX = isBlizzard ? BLIZZARD_WIND_DRIFT : 0;

  for (let i = 0; i < MAX_SNOW; i++) {
    if (i >= snowCount) {
      // Deactivate excess particles
      if (snowPositions[i * 3 + 1] > -50) {
        snowPositions[i * 3 + 1] -= 10 * delta; // fade down
      }
      continue;
    }

    snowPositions[i * 3] += (snowVelocities[i * 3] + windX) * delta;
    snowPositions[i * 3 + 1] += snowVelocities[i * 3 + 1] * delta;
    snowPositions[i * 3 + 2] += snowVelocities[i * 3 + 2] * delta;

    // Recycle particles that fall below ground
    if (snowPositions[i * 3 + 1] < -1) {
      snowPositions[i * 3] = (Math.random() - 0.5) * SNOW_AREA_WIDTH;
      snowPositions[i * 3 + 1] = SNOW_AREA_HEIGHT + Math.random() * 5;
      snowPositions[i * 3 + 2] = -Math.random() * SNOW_AREA_DEPTH;
      snowVelocities[i * 3] = (Math.random() - 0.5) * 0.5;
      snowVelocities[i * 3 + 1] = -2 - Math.random() * 3;
      snowVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }

    // Slight horizontal sway
    snowPositions[i * 3] += Math.sin(performance.now() * 0.001 + i) * 0.003;
  }

  snowPoints.geometry.attributes.position.needsUpdate = true;
}

export function setDreadOverride(active) {
  if (active && !dreadOverride) {
    dreadOverride = true;
    savedWeather = currentWeather;
  } else if (!active && dreadOverride) {
    dreadOverride = false;
    // Restore previous weather visuals
    currentSky.set(WEATHER_FOG[savedWeather].skyColor);
    currentFog.set(WEATHER_FOG[savedWeather].fogColor);
    currentFogNear = WEATHER_FOG[savedWeather].fogNear;
    currentFogFar = WEATHER_FOG[savedWeather].fogFar;
    snowCount = SNOW_PARTICLE_COUNTS[savedWeather];
  }
}

export function setWeather(weatherType) {
  if (!WEATHER_TYPES.includes(weatherType)) return;
  currentWeather = weatherType;
  snowCount = SNOW_PARTICLE_COUNTS[weatherType];
  resetSnowPositions(snowCount);
  applyWeatherVisuals(weatherType, 1);
  weatherTimer = WEATHER_CHANGE_MIN + Math.random() * (WEATHER_CHANGE_MAX - WEATHER_CHANGE_MIN);
  crossfading = false;
}

export function getCurrentWeather() {
  return currentWeather;
}

export function cleanupWeather() {
  if (snowPoints) {
    scene.remove(snowPoints);
    snowPoints.geometry.dispose();
    snowPoints.material.dispose();
    snowPoints = null;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/weather.js
git commit -m "feat: add weather system with snow, blizzard, clear, and fog"
```

---

### Task 6: Penguin Idle Animation & Knockback

**Files:**
- Modify: `src/penguin.js`

- [ ] **Step 1: Add idle animation imports and state**

At the top of `src/penguin.js`, update the import to include new constants:
```js
import {
  LANE_POSITIONS, PLAYER_START_LANE, LANE_SWITCH_SPEED,
  JUMP_FORCE, GRAVITY, SLIDE_DURATION,
  PENGUIN_HEIGHT, PENGUIN_RADIUS, TERRAIN_Y, BASE_SPEED,
  IDLE_WADDLE_SPEED, IDLE_BLINK_MIN, IDLE_BLINK_MAX,
  IDLE_BLINK_DURATION, IDLE_LOOK_MIN, IDLE_LOOK_MAX,
  IDLE_LOOK_DURATION, KNOCKBACK_DURATION, KNOCKBACK_DISTANCE,
} from './constants.js';
```

Add new state variables after the existing ones (after `let waddleTime = 0;`):
```js
// Idle animation state
let idleMode = false;
let idleBlinkTimer = 0;
let idleBlinkCooldown = 4;
let isBlinking = false;
let idleLookTimer = 0;
let idleLookCooldown = 7;
let idleLookDirection = 0; // -1, 0, 1
let idleLookProgress = 0;

// Knockback state
let knockbackActive = false;
let knockbackTimer = 0;
let knockbackStartZ = 0;

// Head reference for look animation
let head = null;

// Eye references for blink
let eyeWhites = [];
let pupils = [];
```

- [ ] **Step 2: Store head and eye references in `createPenguin`**

In the `createPenguin` function, update the head creation to store the reference. After `penguinGroup.add(head);`, the head variable is local — change the local `const head` to use the module-level `head`:

Change:
```js
  const headGeo = new THREE.SphereGeometry(PENGUIN_RADIUS * 0.6, 12, 10);
  headMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
  const head = new THREE.Mesh(headGeo, headMat);
```
to:
```js
  const headGeo = new THREE.SphereGeometry(PENGUIN_RADIUS * 0.6, 12, 10);
  headMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
  head = new THREE.Mesh(headGeo, headMat);
```

In the eyes loop, store references:
```js
  eyeWhites = [];
  pupils = [];
  for (const xOff of [-0.1, 0.1]) {
    const eyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    eyeWhite.position.set(xOff, PENGUIN_HEIGHT * 0.88, PENGUIN_RADIUS * 0.5);
    penguinGroup.add(eyeWhite);
    eyeWhites.push(eyeWhite);
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(xOff, PENGUIN_HEIGHT * 0.88, PENGUIN_RADIUS * 0.55);
    penguinGroup.add(pupil);
    pupils.push(pupil);
  }
```

- [ ] **Step 3: Add idle update function**

Add this function before the `export function updatePenguin`:

```js
function updateIdle(delta) {
  if (!penguinGroup || !idleMode) return;

  // Slow waddle
  waddleTime += delta * IDLE_WADDLE_SPEED;
  body.rotation.z = Math.sin(waddleTime) * 0.03;
  leftWing.rotation.z = Math.sin(waddleTime) * 0.08;
  rightWing.rotation.z = -Math.sin(waddleTime) * 0.08;

  // Blink
  idleBlinkTimer += delta;
  if (isBlinking) {
    if (idleBlinkTimer >= IDLE_BLINK_DURATION) {
      isBlinking = false;
      idleBlinkTimer = 0;
      idleBlinkCooldown = IDLE_BLINK_MIN + Math.random() * (IDLE_BLINK_MAX - IDLE_BLINK_MIN);
      for (const ew of eyeWhites) ew.scale.y = 1;
      for (const p of pupils) p.visible = true;
    } else {
      for (const ew of eyeWhites) ew.scale.y = 0.1;
      for (const p of pupils) p.visible = false;
    }
  } else {
    if (idleBlinkTimer >= idleBlinkCooldown) {
      isBlinking = true;
      idleBlinkTimer = 0;
    }
  }

  // Head look
  idleLookTimer += delta;
  if (idleLookDirection === 0) {
    if (idleLookTimer >= idleLookCooldown) {
      idleLookDirection = Math.random() < 0.5 ? -1 : 1;
      idleLookTimer = 0;
      idleLookProgress = 0;
    }
  } else {
    idleLookProgress += delta / IDLE_LOOK_DURATION;
    if (idleLookProgress >= 1) {
      idleLookDirection = 0;
      idleLookTimer = 0;
      idleLookCooldown = IDLE_LOOK_MIN + Math.random() * (IDLE_LOOK_MAX - IDLE_LOOK_MIN);
      if (head) head.rotation.y = 0;
    } else {
      // Look then return: sine curve
      const t = Math.sin(idleLookProgress * Math.PI);
      if (head) head.rotation.y = idleLookDirection * t * 0.4;
    }
  }
}
```

- [ ] **Step 4: Add knockback update to `updatePenguin`**

Inside `updatePenguin`, after the invincibility block (after the `if (invincible) { ... }` block), add:

```js
  // Knockback
  if (knockbackActive) {
    knockbackTimer += delta;
    const t = knockbackTimer / KNOCKBACK_DURATION;
    if (t >= 1) {
      knockbackActive = false;
      penguinGroup.position.z = 0;
    } else {
      // Ease out: moves back then returns
      const ease = Math.sin(t * Math.PI);
      penguinGroup.position.z = ease * KNOCKBACK_DISTANCE;
    }
  }
```

- [ ] **Step 5: Export new functions**

Add these exports:
```js
export function setIdleMode(enabled) {
  idleMode = enabled;
  if (enabled) {
    waddleTime = 0;
    idleBlinkTimer = 0;
    idleLookTimer = 0;
    idleLookDirection = 0;
    if (head) head.rotation.y = 0;
    for (const ew of eyeWhites) ew.scale.y = 1;
    for (const p of pupils) p.visible = true;
    // Face camera for start screen
    if (penguinGroup) penguinGroup.rotation.y = 0;
  } else {
    // Face away for gameplay
    if (penguinGroup) penguinGroup.rotation.y = Math.PI;
    if (head) head.rotation.y = 0;
    for (const ew of eyeWhites) ew.scale.y = 1;
    for (const p of pupils) p.visible = true;
  }
}

export function triggerKnockback() {
  knockbackActive = true;
  knockbackTimer = 0;
}

export function updateIdleAnimation(delta) {
  updateIdle(delta);
}
```

- [ ] **Step 6: Reset idle state in `resetPenguin`**

At the end of `resetPenguin`, add:
```js
  idleMode = false;
  knockbackActive = false;
  knockbackTimer = 0;
  if (head) head.rotation.y = 0;
  for (const ew of eyeWhites) ew.scale.y = 1;
  for (const p of pupils) p.visible = true;
```

- [ ] **Step 7: Commit**

```bash
git add src/penguin.js
git commit -m "feat: add penguin idle animation and knockback"
```

---

### Task 7: Screen Effects (Shake, Vignette, Speed Lines)

**Files:**
- Modify: `src/scene.js`
- Modify: `style.css`

- [ ] **Step 1: Add screen shake and vignette to `src/scene.js`**

Add new imports at the top:
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
  SCREEN_SHAKE_DURATION,
} from './constants.js';
```

Add state variables after the existing color declarations:
```js
// Screen shake
let shakeTimer = 0;
let shakeIntensity = 0;
let shakeOffsetX = 0;
let shakeOffsetY = 0;

// Speed lines (DOM-based for simplicity)
let speedLinesContainer = null;
```

Add these functions:
```js
export function triggerScreenShake(intensity) {
  shakeTimer = SCREEN_SHAKE_DURATION;
  shakeIntensity = intensity;
}

export function updateScreenEffects(delta) {
  // Screen shake
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
  void vignette.offsetWidth; // reflow
  vignette.classList.add('vignette-flash');
  setTimeout(() => vignette.classList.add('hidden'), 200);
}
```

- [ ] **Step 2: Add vignette and speed lines HTML elements**

In `index.html`, inside `<div id="game-container">`, after `<div id="ui-overlay"></div>`, add:
```html
<div id="damage-vignette" class="hidden"></div>
<div id="speed-lines" class="hidden"></div>
```

- [ ] **Step 3: Add vignette and speed line CSS to `style.css`**

Append to `style.css`:
```css
/* Damage vignette */
#damage-vignette {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
  background: radial-gradient(ellipse at center, transparent 50%, rgba(255, 0, 0, 0.3) 100%);
  opacity: 0;
}

#damage-vignette.vignette-flash {
  animation: vignette-pulse 0.2s ease-out forwards;
}

@keyframes vignette-pulse {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

/* Speed lines */
#speed-lines {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 5;
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0.05) 0%,
    transparent 15%,
    transparent 85%,
    rgba(255, 255, 255, 0.05) 100%
  );
  opacity: 0;
  transition: opacity 0.3s;
}

#speed-lines.active {
  opacity: 1;
}
```

- [ ] **Step 4: Add speed line helper**

Add to `src/scene.js`:
```js
export function setSpeedLinesVisible(visible) {
  const el = document.getElementById('speed-lines');
  if (el) {
    el.classList.toggle('hidden', !visible);
    el.classList.toggle('active', visible);
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/scene.js style.css index.html
git commit -m "feat: add screen shake, damage vignette, and speed lines"
```

---

### Task 8: HUD Polish

**Files:**
- Modify: `src/hud.js`
- Modify: `style.css`

- [ ] **Step 1: Add dread timer bar and score bounce to `src/hud.js`**

Add a dread timer bar element. After the toast creation in `createHUD`, add:
```js
  // Dread timer bar
  const dreadBar = document.createElement('div');
  dreadBar.id = 'dread-timer-bar';
  dreadBar.className = 'hidden';
  dreadBar.innerHTML = '<div id="dread-timer-fill"></div>';
  document.getElementById('ui-overlay').appendChild(dreadBar);
```

Add these new exported functions:
```js
export function bounceScore() {
  if (!scoreEl) return;
  scoreEl.classList.remove('score-bounce');
  void scoreEl.offsetWidth;
  scoreEl.classList.add('score-bounce');
}

export function shakeHeart(index) {
  if (!heartsEl) return;
  const hearts = heartsEl.querySelectorAll('.heart');
  if (hearts[index]) {
    hearts[index].classList.add('heart-shake');
    setTimeout(() => hearts[index].classList.remove('heart-shake'), 300);
  }
}

export function pulseLastHeart() {
  if (!heartsEl) return;
  const hearts = heartsEl.querySelectorAll('.heart');
  // Add pulse to first visible heart
  for (const h of hearts) {
    h.classList.remove('heart-pulse');
  }
  const visibleHearts = [...hearts].filter(h => h.textContent === '\u2764\uFE0F');
  if (visibleHearts.length === 1) {
    visibleHearts[0].classList.add('heart-pulse');
  }
}

export function updateDreadTimerBar(progress, visible) {
  const bar = document.getElementById('dread-timer-bar');
  const fill = document.getElementById('dread-timer-fill');
  if (!bar || !fill) return;
  bar.classList.toggle('hidden', !visible);
  fill.style.width = `${progress * 100}%`;
}
```

- [ ] **Step 2: Update `showToast` for slide-in-from-right with frosted glass**

Replace the `showToast` function:
```js
export function showToast(text, duration = 2000) {
  if (!toastEl) return;
  toastEl.textContent = text;
  toastEl.classList.remove('hidden');
  toastEl.classList.remove('toast-slide-in');
  void toastEl.offsetWidth;
  toastEl.classList.add('toast-slide-in');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('toast-slide-in');
    toastEl.classList.add('toast-slide-out');
    setTimeout(() => {
      toastEl.classList.add('hidden');
      toastEl.classList.remove('toast-slide-out');
    }, 300);
  }, duration);
}
```

- [ ] **Step 3: Add HUD animation CSS to `style.css`**

Replace the existing toast CSS and add new HUD styles. Find and replace the `#hud-toast` and `#hud-toast.toast-fade` and `@keyframes toast-in` blocks with:

```css
/* Toast notification — frosted glass, slide from right */
#hud-toast {
  position: absolute;
  top: 100px;
  right: -300px;
  background: rgba(10, 15, 30, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #ffd700;
  padding: 12px 24px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 500;
  text-align: left;
  z-index: 12;
  pointer-events: none;
  max-width: 80vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: right 0.3s ease-out;
}

#hud-toast.toast-slide-in {
  right: 20px;
}

#hud-toast.toast-slide-out {
  right: -300px;
  transition: right 0.3s ease-in;
}

/* Score bounce */
.score-bounce {
  animation: score-pop 0.2s ease-out;
}

@keyframes score-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* Heart animations */
.heart-shake {
  animation: heart-jitter 0.3s ease-out;
}

@keyframes heart-jitter {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-3px); }
  40% { transform: translateX(3px); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
}

.heart-pulse {
  animation: heart-warn 1s ease-in-out infinite;
}

@keyframes heart-warn {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

/* Dread timer bar */
#dread-timer-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(0, 0, 0, 0.3);
  z-index: 15;
}

#dread-timer-fill {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, #440066, #8800cc);
  box-shadow: 2px 0 8px rgba(136, 0, 204, 0.8);
  transition: width 0.1s linear;
}
```

Also remove the old `@keyframes toast-in` block if it still exists.

- [ ] **Step 4: Commit**

```bash
git add src/hud.js style.css
git commit -m "feat: add HUD polish — score bounce, heart anims, dread timer, frosted toasts"
```

---

### Task 9: Wire Everything into Main Game Loop

**Files:**
- Modify: `src/main.js`
- Modify: `src/screens.js`

- [ ] **Step 1: Add imports to `src/main.js`**

Add new imports at the top of `src/main.js`:
```js
import { initParticles, updateParticles, emitParticles, clearParticles } from './particles.js';
import { initAurora, updateAurora, cleanupAurora } from './aurora.js';
import { initWeather, updateWeather, setWeather, setDreadOverride, cleanupWeather } from './weather.js';
import {
  setIdleMode, updateIdleAnimation, triggerKnockback,
} from './penguin.js';
import {
  triggerScreenShake, updateScreenEffects, getShakeOffset,
  showRedVignette, setSpeedLinesVisible,
} from './scene.js';
import {
  bounceScore, shakeHeart, pulseLastHeart, updateDreadTimerBar,
} from './hud.js';
```

Also add to the destructured constants import:
```js
import {
  CAMERA_OFFSET, CAMERA_LOOK_AHEAD, BASE_SPEED, SPEED_INCREMENT,
  MAX_SPEED, INVINCIBILITY_DURATION, POINTS_PER_METER, FISH_POINTS,
  GOLDEN_FISH_POINTS, FISH_PER_HEAL, MAX_HEARTS, DREAD_MULTIPLIER,
  DREAD_DAMAGE_MULTIPLIER,
  SCREEN_SHAKE_INTENSITY_LIGHT, SCREEN_SHAKE_INTENSITY_HEAVY,
  SPEED_LINE_THRESHOLD, COLLECTION_PARTICLES,
  CAMERA_INTRO_DURATION, CAMERA_INTRO_START, CAMERA_INTRO_END,
  CAMERA_INTRO_LOOK_START, CAMERA_INTRO_LOOK_END,
  CAMERA_GAMEPLAY_TRANSITION, CAMERA_IDLE_SWAY_SPEED, CAMERA_IDLE_SWAY_AMOUNT,
  NEAR_MISS_THRESHOLD, LANE_WIDTH,
} from './constants.js';
```

- [ ] **Step 2: Add camera state machine variables**

After the existing game state variables, add:
```js
// Camera state machine
let cameraState = 'intro'; // 'intro' | 'idle' | 'transitioning' | 'gameplay'
let cameraTimer = 0;
let introSkipped = false;
```

- [ ] **Step 3: Initialize new systems after scene setup**

After `createHUD(() => togglePause());` and before `initAudio();`, add:
```js
initParticles(scene);
initAurora(scene);
initWeather(scene);

// Start screen: clear/aurora weather, idle penguin
setWeather('clearAurora');
setIdleMode(true);
```

- [ ] **Step 4: Update `startGame` to handle camera transition**

Replace the existing `startGame` function:
```js
function startGame() {
  hideStartScreen();
  hideGameOverScreen();

  cameraState = 'transitioning';
  cameraTimer = 0;
  introSkipped = false;

  setIdleMode(false);

  playerZ = 0;
  speed = BASE_SPEED;
  elapsed = 0;
  lastTime = performance.now();
  score = 0;
  distance = 0;
  hearts = 3;
  fishCount = 0;
  goldenFishCount = 0;
  newAchievements = [];
  dreadsSurvivedThisRun = 0;
  lastDamageDistance = 0;
  longestNoDamage = 0;

  cleanupDread();
  clearParticles();

  resetPenguin();
  applySkin(getSelectedSkin());
  clearObstacles(scene);
  clearCollectibles(scene);
  resetTerrain();

  updateScore(0);
  updateHearts(hearts);
  updateFishCount(0);
  showHUD(true);
  showMultiplier(false);
  updateDreadTimerBar(0, false);

  // Set random weather for gameplay
  const gameWeathers = ['lightSnow', 'blizzard', 'clearAurora', 'fog'];
  setWeather(gameWeathers[Math.floor(Math.random() * gameWeathers.length)]);

  startMusic();
  gameState = 'playing';
}
```

- [ ] **Step 5: Update `gameOver` to reset to idle/menu state**

At the end of the `gameOver` function, after `showGameOverScreen(...)`, add:
```js
  setSpeedLinesVisible(false);
  updateDreadTimerBar(0, false);
  clearParticles();
```

- [ ] **Step 6: Update the game loop for camera states, effects, and particles**

Replace the camera/render section at the bottom of `gameLoop` (everything after the `if (gameState === 'playing') { ... }` block):

```js
  // Update visual systems (always run)
  updateAurora(delta);
  updateParticles(delta);
  updateScreenEffects(delta);

  // Weather updates only during gameplay
  if (gameState === 'playing') {
    updateWeather(delta);
  }

  // Camera positioning
  const camera = getCamera();
  const shake = getShakeOffset();

  if (cameraState === 'intro') {
    cameraTimer += delta;
    const t = Math.min(cameraTimer / CAMERA_INTRO_DURATION, 1);
    const ease = t * t * (3 - 2 * t); // smoothstep

    camera.position.set(
      THREE.MathUtils.lerp(CAMERA_INTRO_START.x, CAMERA_INTRO_END.x, ease),
      THREE.MathUtils.lerp(CAMERA_INTRO_START.y, CAMERA_INTRO_END.y, ease),
      THREE.MathUtils.lerp(CAMERA_INTRO_START.z, CAMERA_INTRO_END.z, ease),
    );
    camera.lookAt(
      THREE.MathUtils.lerp(CAMERA_INTRO_LOOK_START.x, CAMERA_INTRO_LOOK_END.x, ease),
      THREE.MathUtils.lerp(CAMERA_INTRO_LOOK_START.y, CAMERA_INTRO_LOOK_END.y, ease),
      THREE.MathUtils.lerp(CAMERA_INTRO_LOOK_START.z, CAMERA_INTRO_LOOK_END.z, ease),
    );

    if (t >= 1 || introSkipped) {
      cameraState = 'idle';
      cameraTimer = 0;
    }
  } else if (cameraState === 'idle') {
    // Gentle sway
    const sway = Math.sin(performance.now() * 0.001 * CAMERA_IDLE_SWAY_SPEED) * CAMERA_IDLE_SWAY_AMOUNT;
    camera.position.set(
      CAMERA_INTRO_END.x + sway,
      CAMERA_INTRO_END.y,
      CAMERA_INTRO_END.z,
    );
    camera.lookAt(
      CAMERA_INTRO_LOOK_END.x + sway * 0.3,
      CAMERA_INTRO_LOOK_END.y,
      CAMERA_INTRO_LOOK_END.z,
    );

    // Update idle animation
    updateIdleAnimation(delta);

    // Sway mountains with camera
    swayMountains(sway);
  } else if (cameraState === 'transitioning') {
    cameraTimer += delta;
    const t = Math.min(cameraTimer / CAMERA_GAMEPLAY_TRANSITION, 1);
    const ease = t * t * (3 - 2 * t);

    camera.position.set(
      THREE.MathUtils.lerp(CAMERA_INTRO_END.x, CAMERA_OFFSET.x, ease),
      THREE.MathUtils.lerp(CAMERA_INTRO_END.y, CAMERA_OFFSET.y, ease),
      THREE.MathUtils.lerp(CAMERA_INTRO_END.z, CAMERA_OFFSET.z, ease),
    );
    camera.lookAt(
      THREE.MathUtils.lerp(CAMERA_INTRO_LOOK_END.x, 0, ease),
      THREE.MathUtils.lerp(CAMERA_INTRO_LOOK_END.y, 1, ease),
      THREE.MathUtils.lerp(CAMERA_INTRO_LOOK_END.z, -CAMERA_LOOK_AHEAD, ease),
    );

    if (t >= 1) {
      cameraState = 'gameplay';
    }
  } else {
    // Gameplay camera
    camera.position.set(
      CAMERA_OFFSET.x + shake.x,
      CAMERA_OFFSET.y + shake.y,
      CAMERA_OFFSET.z,
    );
    camera.lookAt(0, 1, -CAMERA_LOOK_AHEAD);
  }

  // Speed lines based on current speed
  if (gameState === 'playing') {
    setSpeedLinesVisible(speed >= MAX_SPEED * SPEED_LINE_THRESHOLD);
  }

  render();
}
```

You'll also need to add the THREE import and swayMountains import at the top:
```js
import * as THREE from 'three';
import { swayMountains } from './terrain.js';
```

- [ ] **Step 7: Add collection particle emission**

In the collectible pickup section of the game loop, add particle emission after each pickup type. Inside the `for (const pickup of pickups)` loop, add particles after the existing logic:

After `playCollect();` in the fish block:
```js
          const penguinPos = penguinForPickup.position;
          emitParticles({ ...COLLECTION_PARTICLES.fish, position: penguinPos.clone() });
          bounceScore();
```

After `playGoldenCollect();` in the golden fish block:
```js
          emitParticles({ ...COLLECTION_PARTICLES.goldenFish, position: penguinForPickup.position.clone() });
          bounceScore();
```

After `playQuoteCollect();` in the quote block:
```js
          emitParticles({ ...COLLECTION_PARTICLES.quote, position: penguinForPickup.position.clone() });
```

After `playDreadEnter();` in the abyss orb block:
```js
          emitParticles({ ...COLLECTION_PARTICLES.abyssOrb, position: penguinForPickup.position.clone() });
```

- [ ] **Step 8: Add damage effects**

In the collision detection section, after `playHit();`, add:
```js
          const shakeStrength = isDreadActive() ? SCREEN_SHAKE_INTENSITY_HEAVY : SCREEN_SHAKE_INTENSITY_LIGHT;
          triggerScreenShake(shakeStrength);
          showRedVignette();
          triggerKnockback();
          shakeHeart(hearts - 1); // shake the heart about to disappear
```

After `updateHearts(hearts);` (after reducing hearts), add:
```js
          pulseLastHeart();
```

- [ ] **Step 9: Add dread timer bar update**

In the game loop, after `updateDread(delta);`, add:
```js
    if (isDreadActive()) {
      const dreadProgress = 1 - (getDreadTimer() / DREAD_DURATION);
      updateDreadTimerBar(dreadProgress, true);
    } else {
      updateDreadTimerBar(0, false);
    }
```

This requires exporting `getDreadTimer` from `dread.js`. Add to `src/dread.js`:
```js
export function getDreadTimer() { return timer; }
```

And import it in `main.js`:
```js
import { startDread, updateDread, isDreadActive, getDreadSpeedMultiplier, cleanupDread, getDreadTimer } from './dread.js';
```

Also import `DREAD_DURATION` in main.js constants import:
```js
DREAD_DAMAGE_MULTIPLIER, DREAD_DURATION,
```

- [ ] **Step 10: Handle intro skip**

In the `createStartScreen` call, update the start handler to handle intro skip. In `src/screens.js`, update the start handler in `createStartScreen`:

The current handler starts the game on any click/key. We need to also support skipping the intro. The simplest approach: in `main.js`, add a skip handler before `createStartScreen`:

```js
// Skip intro on any input
function handleIntroSkip(e) {
  if (cameraState === 'intro') {
    introSkipped = true;
    cameraState = 'idle';
    cameraTimer = 0;
    e.stopPropagation?.();
  }
}
window.addEventListener('keydown', handleIntroSkip);
window.addEventListener('click', handleIntroSkip);
window.addEventListener('touchstart', handleIntroSkip);
```

- [ ] **Step 11: Update `gameOver` to return camera to idle**

At the bottom of `gameOver`, after the `showGameOverScreen(...)` call, the camera should stay in gameplay position (game over screen overlays it). When the player returns to the start screen, we should reset:

Add to the game over screen's restart callback area — actually, the restart calls `startGame()` which handles everything. But for returning to menu from pause (quit), we need to add idle setup. In the quit handler in `togglePause`:

Change the quit callback:
```js
() => {
  gameState = 'gameover';
  hidePauseScreen();
  setSpeedLinesVisible(false);
  updateDreadTimerBar(0, false);
  clearParticles();
  gameOver();
},
```

- [ ] **Step 12: Near-miss detection**

Add near-miss detection in the collision loop. After the collision check `for (const obs of getActiveObstacles())` block, inside the `if (penguin && !isInvincible())` block, after the collision loop, add a near-miss check:

```js
      // Near-miss detection (same lane, obstacle just passed, not hit)
      for (const obs of getActiveObstacles()) {
        if (obs.nearMissShown) continue;
        const dz = obs.mesh.position.z - penguin.position.z;
        // Obstacle just passed the penguin (dz > 0 means behind penguin) and is in adjacent lane
        if (dz > 0 && dz < 2 && obs.lane !== getCurrentLane()) {
          const laneDiff = Math.abs(obs.lane - getCurrentLane());
          if (laneDiff === 1) {
            const dx = Math.abs(penguin.position.x - obs.mesh.position.x);
            if (dx < LANE_WIDTH + NEAR_MISS_THRESHOLD) {
              obs.nearMissShown = true;
              showToast('CLOSE!', 800);
            }
          }
        }
      }
```

- [ ] **Step 13: Verify**

Run: `npx vite`

Expected:
- Page loads with camera sweeping from high above to hero position
- Penguin faces camera, waddles gently, blinks, looks around
- Aurora borealis visible in sky
- Mountains show 3 depth layers with slight parallax
- Clicking/pressing SPACE starts game with camera transition
- Snow particles fall during gameplay
- Weather changes every 60-90s
- Collecting fish shows particle burst + score bounce
- Taking damage shows screen shake + red vignette + heart shake
- Dread mode shows timer bar at top
- Speed lines appear at high speeds
- Near-miss shows "CLOSE!" toast

- [ ] **Step 14: Commit**

```bash
git add src/main.js src/dread.js src/screens.js
git commit -m "feat: wire cinematic camera, particles, weather, and effects into game loop"
```

---

### Task 10: Dread Mode Integration with Aurora & Weather

**Files:**
- Modify: `src/dread.js`

- [ ] **Step 1: Import aurora and weather controls**

Add imports at the top of `src/dread.js`:
```js
import { setAuroraDreadBlend } from './aurora.js';
import { setDreadOverride } from './weather.js';
```

- [ ] **Step 2: Update `startDread` to trigger aurora and weather**

At the end of `startDread`, after adding shadow creatures, add:
```js
  setAuroraDreadBlend(0); // will be animated in updateDread
  setDreadOverride(true);
```

- [ ] **Step 3: Update `updateDread` to animate aurora blend**

Inside `updateDread`, after the `transitionToDread(transitionProgress);` call, add:
```js
  // Aurora shifts to dread colors
  setAuroraDreadBlend(transitionProgress);
```

- [ ] **Step 4: Update `endDread` to restore aurora and weather**

In `endDread`, after `transitionToDread(0);`, add:
```js
  setAuroraDreadBlend(0);
  setDreadOverride(false);
```

- [ ] **Step 5: Update `cleanupDread` to restore aurora and weather**

In `cleanupDread`, inside the `if (active)` block, after `transitionToDread(0);`, add:
```js
    setAuroraDreadBlend(0);
    setDreadOverride(false);
```

- [ ] **Step 6: Commit**

```bash
git add src/dread.js
git commit -m "feat: integrate dread mode with aurora color shift and weather override"
```

---

### Task 11: Start Screen UI Overlay Styling

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Update start screen CSS for transparent overlay**

Replace the existing `#start-screen` styles to work as an overlay on the 3D scene:

```css
#start-screen {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 10vh;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    transparent 30%,
    rgba(0, 0, 0, 0.3) 60%,
    rgba(0, 0, 0, 0.6) 100%
  );
  color: #fff;
  z-index: 100;
  text-align: center;
  padding-left: 20px;
  padding-right: 20px;
}
```

Update the title to animate in:
```css
.game-title {
  font-size: clamp(48px, 12vw, 96px);
  font-weight: 700;
  line-height: 1;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 4px;
  text-shadow: 4px 4px 0 #1a1a2e, 0 0 20px rgba(100, 180, 255, 0.5);
  margin-bottom: 10px;
  animation: title-fade-in 1s ease-out 3s both;
}

@keyframes title-fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 400;
  color: #aaccee;
  font-style: italic;
  margin-bottom: 20px;
  letter-spacing: 1px;
  animation: title-fade-in 1s ease-out 3.5s both;
}

.start-prompt {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: 3px;
  animation: pulse-text 0.8s ease-in-out infinite alternate, title-fade-in 0.5s ease-out 3.5s both;
  margin-bottom: 30px;
}

#high-score-display {
  font-size: 24px;
  font-weight: 600;
  color: #ffd700;
  margin-bottom: 30px;
  animation: title-fade-in 0.5s ease-out 3.5s both;
}

.controls-hint {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #7799bb;
  margin-bottom: 24px;
  line-height: 1.6;
  animation: title-fade-in 0.5s ease-out 3.5s both;
}

.menu-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  animation: title-fade-in 0.5s ease-out 4s both;
}
```

Also update `#gameover-screen` to keep the transparent background:
```css
#gameover-screen {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  z-index: 100;
  text-align: center;
  padding: 20px;
}
```

- [ ] **Step 2: Commit**

```bash
git add style.css
git commit -m "feat: update start screen to transparent overlay with fade-in animations"
```

---

### Task 12: Final Polish & Integration Test

**Files:**
- Modify: `src/main.js` (minor fixes)

- [ ] **Step 1: Ensure `swayMountains` is imported in `main.js`**

Verify the import exists:
```js
import { createTerrain, updateTerrain, resetTerrain, swayMountains } from './terrain.js';
```

- [ ] **Step 2: Ensure `THREE` is imported in `main.js`**

Verify:
```js
import * as THREE from 'three';
```

- [ ] **Step 3: Full integration test**

Run: `npx vite`

Verify this checklist:
1. **Title**: Browser tab says "Thus Waddles Zarathustra"
2. **Intro camera**: Camera sweeps from high above to hero shot over 3 seconds
3. **Intro skip**: Any input during sweep jumps to hero position
4. **Idle penguin**: Waddles slowly, blinks, looks left/right
5. **Start screen**: Title fades in at 3s, subtitle at 3.5s, buttons at 4s
6. **Mountains**: 3 parallax layers visible, sway with camera
7. **Aurora**: Green-teal-purple ribbons shimmer in sky
8. **Start game**: Camera transitions smoothly to gameplay position
9. **Snow**: Particles fall during gameplay
10. **Weather**: Changes type every 60-90s with crossfade
11. **Fish collect**: Silver particle burst + score bounces
12. **Golden fish**: Gold particle burst
13. **Damage**: Screen shake + red vignette + heart shake + knockback
14. **Low health**: Last heart pulses
15. **Speed lines**: Appear at high speeds
16. **Dread mode**: Timer bar at top, aurora turns red
17. **Near miss**: "CLOSE!" toast on narrow dodge
18. **Toasts**: Slide in from right with frosted glass
19. **Game over**: Screen overlays, play again works

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: Phase 1 complete — visual foundation and cinematic start screen"
```

---

## File Structure Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/constants.js` | Modify | All new constants for Phase 1 |
| `index.html` | Modify | Title rename, vignette/speed-line elements |
| `style.css` | Modify | HUD animations, toast restyle, dread bar, vignette, speed lines, start screen overlay |
| `src/screens.js` | Modify | Title rename |
| `src/terrain.js` | Modify | 3-layer parallax mountains |
| `src/penguin.js` | Modify | Idle animation, knockback, eye/head references |
| `src/scene.js` | Modify | Screen shake, vignette, speed lines |
| `src/hud.js` | Modify | Score bounce, heart anims, dread timer bar, frosted toasts |
| `src/dread.js` | Modify | Aurora/weather integration, getDreadTimer export |
| `src/main.js` | Modify | Camera state machine, system initialization, effect wiring |
| `src/particles.js` | **Create** | Pool-based particle emitter system |
| `src/aurora.js` | **Create** | Aurora borealis ribbon shader |
| `src/weather.js` | **Create** | Weather state machine with snow particles |
