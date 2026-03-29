// src/obstacles.js
import * as THREE from 'three';
import {
  LANE_POSITIONS,
  OBSTACLE_SPAWN_DISTANCE,
  TERRAIN_Y,
  MIN_OBSTACLE_GAP,
  SNOWBALL_SPEED_MULT,
  ICE_SPIKE_SPEED_MULT,
  ICE_SPIKE_HEIGHT,
  ICE_WALL_HEIGHT,
  LANE_WIDTH,
  CREVASSE_MIN_DISTANCE,
  ICE_WALL_MIN_DISTANCE,
  WIND_GUST_MIN_DISTANCE,
  PHILOSOPHER_FOG_MIN_DISTANCE,
  PHILOSOPHER_FOG_DEPTH,
  MAX_COMPLEX_OBSTACLES,
} from './constants.js';

import { spawnFishAt } from './collectibles.js';

const activeObstacles = [];
let nextSpawnZ = -20;

const pool = {
  iceBlockGeo: new THREE.BoxGeometry(1.8, 1.2, 1.2),
  iceBlockMat: new THREE.MeshStandardMaterial({
    color: 0x88ccee, transparent: true, opacity: 0.6,
    roughness: 0.2, metalness: 0.1,
  }),

  // Smaller snowball — clearly jumpable
  snowballGeo: new THREE.SphereGeometry(0.5, 12, 10),
  snowballMat: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }),

  tombstoneGeo: new THREE.BoxGeometry(1.5, 1.8, 0.3),
  tombstoneMat: new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 }),

  bookGeo: new THREE.BoxGeometry(1.0, 1.4, 0.3),
  bookMat: new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.7 }),

  ringGeo: new THREE.TorusGeometry(1.2, 0.15, 8, 16),
  ringMat: new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3, metalness: 0.8 }),

  warningGeo: new THREE.PlaneGeometry(1.8, 1.8),
  warningMat: new THREE.MeshStandardMaterial({
    color: 0xff8800, transparent: true, opacity: 0.15, side: THREE.DoubleSide,
  }),

  // Ice spike
  spikeGeo: new THREE.ConeGeometry(0.5, ICE_SPIKE_HEIGHT, 6),
  spikeMat: new THREE.MeshStandardMaterial({
    color: 0x88ccee, transparent: true, opacity: 0.85,
    emissive: 0x225588, emissiveIntensity: 0.2,
  }),
  spikeTrailGeo: new THREE.PlaneGeometry(0.3, 2),
  spikeTrailMat: new THREE.MeshStandardMaterial({
    color: 0xaaddff, transparent: true, opacity: 0.3, side: THREE.DoubleSide,
  }),

  // Ice wall
  wallGeo: new THREE.BoxGeometry(LANE_WIDTH * 2.2, ICE_WALL_HEIGHT, 0.5),
  wallMat: new THREE.MeshStandardMaterial({
    color: 0x99ccdd, transparent: true, opacity: 0.7,
    emissive: 0x446688, emissiveIntensity: 0.15,
  }),
  veinGeo: new THREE.BoxGeometry(LANE_WIDTH * 2, 0.05, 0.52),
  veinMat: new THREE.MeshStandardMaterial({ color: 0xbbddee, emissive: 0xbbddee, emissiveIntensity: 0.3 }),

  // Crevasse
  crackGeo: new THREE.PlaneGeometry(LANE_WIDTH * 0.9, 2),
  crackMat: new THREE.MeshStandardMaterial({
    color: 0x0a0a2e, emissive: 0x1a1a4e, emissiveIntensity: 0.4,
    side: THREE.DoubleSide,
  }),
  crackGlowGeo: new THREE.PlaneGeometry(LANE_WIDTH * 0.6, 1.5),
  crackGlowMat: new THREE.MeshStandardMaterial({
    color: 0x4488ff, emissive: 0x4488ff, emissiveIntensity: 0.6,
    transparent: true, opacity: 0.4, side: THREE.DoubleSide,
  }),

  // Wind gust (single shared material — per-instance position randomization)
  streakGeo: new THREE.PlaneGeometry(3, 0.08),
  streakMat: new THREE.MeshStandardMaterial({
    color: 0xddeeff, transparent: true, opacity: 0.55,
    side: THREE.DoubleSide,
  }),

  // Philosopher fog (single geo + mat — per-instance scale for size variation)
  fogBallGeo: new THREE.SphereGeometry(1.5, 8, 6),
  fogBallMat: new THREE.MeshStandardMaterial({
    color: 0x8866aa, transparent: true, opacity: 0.18,
    emissive: 0x443366, emissiveIntensity: 0.1,
  }),
};

let tombstoneTextureMat = null;
function getTombstoneTexturedMat() {
  if (tombstoneTextureMat) return tombstoneTextureMat;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#888888';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#222222';
  ctx.font = 'bold 28px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GOD IS', 128, 100);
  ctx.fillText('DEAD', 128, 145);
  const texture = new THREE.CanvasTexture(canvas);
  tombstoneTextureMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 });
  return tombstoneTextureMat;
}

function applyCastShadow(mesh) {
  if (mesh.isMesh) {
    mesh.castShadow = true;
  } else {
    mesh.traverse(child => { if (child.isMesh) child.castShadow = true; });
  }
}

function getSpawnGap(difficulty) {
  return Math.max(MIN_OBSTACLE_GAP, 15 - difficulty * 0.5);
}

function createObstacleMesh(typeName) {
  let mesh, height, type;

  switch (typeName) {
    case 'iceBlock': {
      mesh = new THREE.Mesh(pool.iceBlockGeo, pool.iceBlockMat);
      mesh.position.y = TERRAIN_Y + 0.6;
      height = 1.2;
      type = 'ground';
      break;
    }

    case 'iceSpike': {
      const group = new THREE.Group();
      const spike = new THREE.Mesh(pool.spikeGeo, pool.spikeMat);
      spike.position.y = ICE_SPIKE_HEIGHT / 2;
      group.add(spike);
      const trail = new THREE.Mesh(pool.spikeTrailGeo, pool.spikeTrailMat);
      trail.rotation.x = -Math.PI / 2;
      trail.position.y = 0.05;
      trail.position.z = 1.5;
      group.add(trail);
      mesh = group;
      height = ICE_SPIKE_HEIGHT;
      type = 'ground';
      break;
    }

    case 'snowball': {
      mesh = new THREE.Mesh(pool.snowballGeo, pool.snowballMat);
      mesh.position.y = TERRAIN_Y + 0.5;
      height = 1.0; // jumpable height
      type = 'ground';
      break;
    }

    case 'tombstone': {
      const materials = [
        pool.tombstoneMat, pool.tombstoneMat,
        pool.tombstoneMat, pool.tombstoneMat,
        getTombstoneTexturedMat(), pool.tombstoneMat,
      ];
      mesh = new THREE.Mesh(pool.tombstoneGeo, materials);
      mesh.position.y = TERRAIN_Y + 0.9;
      height = 1.8;
      type = 'ground';
      break;
    }

    case 'book': {
      mesh = new THREE.Mesh(pool.bookGeo, pool.bookMat);
      mesh.position.y = TERRAIN_Y + 0.7;
      mesh.rotation.y = (Math.random() - 0.5) * 0.6;
      height = 1.4;
      type = 'ground';
      break;
    }

    case 'eternalRing': {
      mesh = new THREE.Group();
      const ring = new THREE.Mesh(pool.ringGeo, pool.ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.name = 'ring';
      mesh.add(ring);
      const w2 = new THREE.Mesh(pool.warningGeo, pool.warningMat);
      w2.rotation.x = -Math.PI / 2;
      w2.position.y = TERRAIN_Y + 0.02 - 2.0;
      mesh.add(w2);
      mesh.position.y = 2.0; // lowered — close enough to look threatening
      height = 2.4;
      type = 'overhead';
      break;
    }

    case 'iceWall': {
      const group = new THREE.Group();
      const wall = new THREE.Mesh(pool.wallGeo, pool.wallMat);
      wall.position.y = ICE_WALL_HEIGHT / 2;
      group.add(wall);
      for (let i = 0; i < 3; i++) {
        const vein = new THREE.Mesh(pool.veinGeo, pool.veinMat);
        vein.position.y = 0.5 + i * 0.8;
        vein.rotation.z = (Math.random() - 0.5) * 0.1;
        group.add(vein);
      }
      mesh = group;
      height = ICE_WALL_HEIGHT;
      type = 'ground';
      break;
    }

    case 'crevasse': {
      const group = new THREE.Group();
      const crack = new THREE.Mesh(pool.crackGeo, pool.crackMat);
      crack.rotation.x = -Math.PI / 2;
      crack.position.y = 0.02;
      group.add(crack);
      const glow = new THREE.Mesh(pool.crackGlowGeo, pool.crackGlowMat);
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = -0.1;
      group.add(glow);
      mesh = group;
      height = 0;
      type = 'ground';
      break;
    }

    case 'windGust': {
      const group = new THREE.Group();
      for (let i = 0; i < 5; i++) {
        const streak = new THREE.Mesh(pool.streakGeo, pool.streakMat);
        streak.position.set(
          (Math.random() - 0.5) * 2,
          0.5 + Math.random() * 1.5,
          (Math.random() - 0.5) * 2
        );
        group.add(streak);
      }
      mesh = group;
      height = 0;
      type = 'ground';
      break;
    }

    case 'philosopherFog': {
      const group = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        const fogBall = new THREE.Mesh(pool.fogBallGeo, pool.fogBallMat);
        const s = 0.8 + Math.random() * 0.35;
        fogBall.scale.set(s, s, s);
        fogBall.position.set(
          (Math.random() - 0.5) * 1.5,
          0.8 + Math.random() * 1.0,
          (Math.random() - 0.5) * PHILOSOPHER_FOG_DEPTH * 0.6
        );
        group.add(fogBall);
      }
      mesh = group;
      height = 2.5;
      type = 'ground';
      break;
    }

    default: {
      mesh = new THREE.Mesh(pool.iceBlockGeo, pool.iceBlockMat);
      mesh.position.y = TERRAIN_Y + 0.6;
      height = 1.2;
      type = 'ground';
    }
  }

  applyCastShadow(mesh);
  return { mesh, height, type };
}

// ---------------------------------------------------------------------------
// Special spawn functions for multi-lane / special obstacles
// ---------------------------------------------------------------------------

function spawnIceWall(scene, worldZ) {
  const openLane = Math.floor(Math.random() * 3);
  const { mesh, height, type } = createObstacleMesh('iceWall');
  const blockedLanes = [0, 1, 2].filter(l => l !== openLane);
  const centerX = (LANE_POSITIONS[blockedLanes[0]] + LANE_POSITIONS[blockedLanes[1]]) / 2;
  mesh.position.set(centerX, TERRAIN_Y, worldZ);
  scene.add(mesh);
  activeObstacles.push({ mesh, height, type, typeName: 'iceWall', lane: -1, openLane });
}

function spawnWindGust(scene, worldZ) {
  const { mesh } = createObstacleMesh('windGust');
  const lane = 1;
  mesh.position.set(LANE_POSITIONS[lane], TERRAIN_Y, worldZ);
  const windDir = Math.random() < 0.5 ? -1 : 1;
  mesh.rotation.y = windDir > 0 ? 0 : Math.PI;
  scene.add(mesh);
  activeObstacles.push({ mesh, height: 0, type: 'ground', typeName: 'windGust', lane, windDirection: windDir, triggered: false });
}

function spawnPhilosopherFog(scene, worldZ, lane) {
  const { mesh } = createObstacleMesh('philosopherFog');
  mesh.position.set(LANE_POSITIONS[lane], TERRAIN_Y, worldZ);
  scene.add(mesh);
  activeObstacles.push({ mesh, height: 2.5, type: 'ground', typeName: 'philosopherFog', lane });

  // Roll contents: 50% fish, 30% obstacle, 20% empty
  const roll = Math.random();
  if (roll < 0.5) {
    spawnFishAt(scene, worldZ - PHILOSOPHER_FOG_DEPTH * 0.3, lane);
  } else if (roll < 0.8) {
    spawnObstacleAt(scene, worldZ - PHILOSOPHER_FOG_DEPTH * 0.3, lane, 'iceBlock');
  }
  // else: empty
}

// ---------------------------------------------------------------------------
// Helper: spawn a specific obstacle at a given position (used by fog contents)
// ---------------------------------------------------------------------------
function spawnObstacleAt(scene, z, lane, typeName) {
  const { mesh, height, type } = createObstacleMesh(typeName);
  mesh.position.x = LANE_POSITIONS[lane];
  mesh.position.z = z;
  scene.add(mesh);
  activeObstacles.push({ mesh, height, type, typeName, lane });
}

// ---------------------------------------------------------------------------
// Distance-gated obstacle type selection
// ---------------------------------------------------------------------------
function getAvailableObstacleTypes(distance, weather) {
  const types = ['iceBlock', 'iceSpike', 'snowball', 'tombstone', 'book', 'eternalRing'];
  if (distance >= CREVASSE_MIN_DISTANCE) types.push('crevasse');
  if (distance >= ICE_WALL_MIN_DISTANCE) types.push('iceWall');
  if (distance >= WIND_GUST_MIN_DISTANCE && (weather === 'blizzard' || weather === 'fog')) {
    types.push('windGust');
  }
  if (distance >= PHILOSOPHER_FOG_MIN_DISTANCE && weather === 'fog') {
    types.push('philosopherFog');
  }
  return types;
}

function countComplexObstacles() {
  return activeObstacles.filter(o =>
    o.typeName === 'iceWall' || o.typeName === 'philosopherFog'
  ).length;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function spawnObstacle(scene, worldZ, difficulty, distance, weather) {
  if (worldZ > nextSpawnZ) return;

  let types = getAvailableObstacleTypes(distance, weather);
  if (countComplexObstacles() >= MAX_COMPLEX_OBSTACLES) {
    types = types.filter(t => t !== 'iceWall' && t !== 'philosopherFog');
  }

  const typeName = types[Math.floor(Math.random() * types.length)];

  // Special spawn for multi-lane obstacles
  if (typeName === 'iceWall') {
    spawnIceWall(scene, -OBSTACLE_SPAWN_DISTANCE);
    nextSpawnZ = worldZ - getSpawnGap(difficulty);
    return;
  }
  if (typeName === 'windGust') {
    spawnWindGust(scene, -OBSTACLE_SPAWN_DISTANCE);
    nextSpawnZ = worldZ - getSpawnGap(difficulty);
    return;
  }
  if (typeName === 'philosopherFog') {
    const lane = Math.floor(Math.random() * LANE_POSITIONS.length);
    spawnPhilosopherFog(scene, -OBSTACLE_SPAWN_DISTANCE, lane);
    nextSpawnZ = worldZ - getSpawnGap(difficulty);
    return;
  }

  const lane = Math.floor(Math.random() * LANE_POSITIONS.length);
  const { mesh, height, type } = createObstacleMesh(typeName);
  mesh.position.x = LANE_POSITIONS[lane];
  mesh.position.z = -OBSTACLE_SPAWN_DISTANCE;
  scene.add(mesh);
  activeObstacles.push({ mesh, height, type, typeName, lane });

  nextSpawnZ = worldZ - getSpawnGap(difficulty);
}

export function updateObstacles(delta, worldZ, speed) {
  for (let i = activeObstacles.length - 1; i >= 0; i--) {
    const obs = activeObstacles[i];
    const mesh = obs.mesh;

    // Speed multipliers for fast-moving obstacles
    let speedMul = 1;
    if (obs.typeName === 'snowball') speedMul = SNOWBALL_SPEED_MULT;
    else if (obs.typeName === 'iceSpike') speedMul = ICE_SPIKE_SPEED_MULT;
    mesh.position.z += speed * delta * speedMul;

    if (obs.typeName === 'snowball') {
      mesh.rotation.x += delta * 5; // fast roll
    } else if (obs.typeName === 'eternalRing') {
      const ring = mesh.getObjectByName?.('ring');
      if (ring) ring.rotation.z += delta * 2;
    }

    if (mesh.position.z > 5) {
      mesh.parent?.remove(mesh);
      activeObstacles.splice(i, 1);
    }
  }
}

export function getActiveObstacles() {
  return activeObstacles;
}

export function clearObstacles(scene) {
  for (const obs of activeObstacles) { scene.remove(obs.mesh); }
  activeObstacles.length = 0;
  nextSpawnZ = -20;
}
