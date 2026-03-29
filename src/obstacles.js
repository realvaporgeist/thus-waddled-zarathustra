// src/obstacles.js
import * as THREE from 'three';
import {
  LANE_POSITIONS,
  OBSTACLE_SPAWN_DISTANCE,
  TERRAIN_Y,
  MIN_OBSTACLE_GAP,
} from './constants.js';

// ---------------------------------------------------------------------------
// Active obstacle list
// ---------------------------------------------------------------------------
const activeObstacles = [];

// ---------------------------------------------------------------------------
// Spawn tracking — nextSpawnZ begins at 0 and decreases with playerZ
// ---------------------------------------------------------------------------
let nextSpawnZ = -20; // first obstacle fairly soon after start

// ---------------------------------------------------------------------------
// Shared geometry / material pools (reused across instances)
// ---------------------------------------------------------------------------
const pool = {
  // iceBlock
  iceBlockGeo: new THREE.BoxGeometry(1.8, 1.2, 1.2),
  iceBlockMat: new THREE.MeshStandardMaterial({
    color: 0x88ccee,
    transparent: true,
    opacity: 0.6,
    roughness: 0.2,
    metalness: 0.1,
  }),

  // icicles (single cylinder, we create 3 per group)
  icicleGeo: new THREE.CylinderGeometry(0.1, 0.3, 2.5, 6),
  icicleMat: new THREE.MeshStandardMaterial({
    color: 0xaaddff,
    transparent: true,
    opacity: 0.7,
  }),

  // snowball
  snowballGeo: new THREE.SphereGeometry(0.8, 12, 10),
  snowballMat: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }),

  // tombstone
  tombstoneGeo: new THREE.BoxGeometry(1.5, 1.8, 0.3),
  tombstoneMat: new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 }),

  // book
  bookGeo: new THREE.BoxGeometry(1.0, 1.4, 0.3),
  bookMat: new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.7 }),

  // eternalRing
  ringGeo: new THREE.TorusGeometry(1.2, 0.15, 8, 16),
  ringMat: new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3, metalness: 0.8 }),
};

// Create tombstone canvas texture (cached once)
let tombstoneTextureMat = null;
function getTombstoneTexturedMat() {
  if (tombstoneTextureMat) return tombstoneTextureMat;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Grey stone background
  ctx.fillStyle = '#888888';
  ctx.fillRect(0, 0, 256, 256);

  // Text
  ctx.fillStyle = '#222222';
  ctx.font = 'bold 28px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GOD IS', 128, 100);
  ctx.fillText('DEAD', 128, 145);

  const texture = new THREE.CanvasTexture(canvas);
  tombstoneTextureMat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.8,
  });
  return tombstoneTextureMat;
}

// ---------------------------------------------------------------------------
// Obstacle type definitions
// ---------------------------------------------------------------------------
const obstacleTypes = [
  'iceBlock',
  'icicles',
  'snowball',
  'tombstone',
  'book',
  'eternalRing',
];

function createObstacleMesh(typeName) {
  let mesh;
  let height;
  let type; // 'ground' | 'overhead'

  switch (typeName) {
    case 'iceBlock': {
      mesh = new THREE.Mesh(pool.iceBlockGeo, pool.iceBlockMat);
      mesh.position.y = TERRAIN_Y + 0.6; // half-height above ground
      height = 1.2;
      type = 'ground';
      break;
    }

    case 'icicles': {
      mesh = new THREE.Group();
      for (let i = -1; i <= 1; i++) {
        const icicle = new THREE.Mesh(pool.icicleGeo, pool.icicleMat);
        icicle.position.set(i * 0.4, 0, 0);
        // Point downward: rotate 180 degrees so the narrow end points down
        icicle.rotation.x = Math.PI;
        mesh.add(icicle);
      }
      mesh.position.y = 2.5;
      height = 2.5;
      type = 'overhead';
      break;
    }

    case 'snowball': {
      mesh = new THREE.Mesh(pool.snowballGeo, pool.snowballMat);
      mesh.position.y = TERRAIN_Y + 0.8; // radius above ground
      height = 1.6;
      type = 'ground';
      break;
    }

    case 'tombstone': {
      // Use textured material for the front face, grey for the rest
      // THREE.js box face order: +x, -x, +y, -y, +z, -z
      const materials = [
        pool.tombstoneMat, // right
        pool.tombstoneMat, // left
        pool.tombstoneMat, // top
        pool.tombstoneMat, // bottom
        getTombstoneTexturedMat(), // front (+z faces player)
        pool.tombstoneMat, // back
      ];
      mesh = new THREE.Mesh(pool.tombstoneGeo, materials);
      mesh.position.y = TERRAIN_Y + 0.9; // half-height
      height = 1.8;
      type = 'ground';
      break;
    }

    case 'book': {
      mesh = new THREE.Mesh(pool.bookGeo, pool.bookMat);
      mesh.position.y = TERRAIN_Y + 0.7; // half-height
      // Random slight y rotation for a tossed-on-ground look
      mesh.rotation.y = (Math.random() - 0.5) * 0.6;
      height = 1.4;
      type = 'ground';
      break;
    }

    case 'eternalRing': {
      mesh = new THREE.Mesh(pool.ringGeo, pool.ringMat);
      mesh.position.y = 2.0;
      // Rotate to face the player (ring plane perpendicular to z-axis)
      mesh.rotation.x = Math.PI / 2;
      height = 2.4; // torus outer extent
      type = 'overhead';
      break;
    }

    default: {
      mesh = new THREE.Mesh(pool.iceBlockGeo, pool.iceBlockMat);
      mesh.position.y = TERRAIN_Y + 0.6;
      height = 1.2;
      type = 'ground';
    }
  }

  mesh.castShadow = true;
  return { mesh, height, type };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Attempt to spawn an obstacle if the player has advanced far enough.
 * @param {THREE.Scene} scene
 * @param {number} worldZ - current playerZ (decreasing over time)
 * @param {number} difficulty - increases over time (floor(elapsed / 10))
 */
export function spawnObstacle(scene, worldZ, difficulty) {
  // Only spawn when playerZ has moved past nextSpawnZ
  if (worldZ > nextSpawnZ) return;

  // Pick random type and lane
  const typeName = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
  const lane = Math.floor(Math.random() * LANE_POSITIONS.length);
  const laneX = LANE_POSITIONS[lane];

  const { mesh, height, type } = createObstacleMesh(typeName);

  // Place obstacle far ahead of the player in scene space.
  // Since the player is at z=0 and looks toward -z, spawn ahead at a negative z.
  mesh.position.x = laneX;
  mesh.position.z = -OBSTACLE_SPAWN_DISTANCE;

  scene.add(mesh);

  activeObstacles.push({
    mesh,
    height,
    type,       // 'ground' | 'overhead'
    typeName,
    lane,
  });

  // Schedule next spawn — gap decreases with difficulty
  const gap = Math.max(MIN_OBSTACLE_GAP, 15 - difficulty * 0.5);
  nextSpawnZ = worldZ - gap;
}

/**
 * Move all active obstacles toward the player and animate them.
 * @param {number} delta - seconds since last frame
 * @param {number} worldZ - current playerZ
 * @param {number} speed - current game speed
 */
export function updateObstacles(delta, worldZ, speed) {
  for (let i = activeObstacles.length - 1; i >= 0; i--) {
    const obs = activeObstacles[i];
    const mesh = obs.mesh;

    // Move obstacle toward the player (positive z direction)
    mesh.position.z += speed * delta;

    // Animate specific types
    if (obs.typeName === 'snowball') {
      mesh.rotation.x += delta * 3;
    } else if (obs.typeName === 'eternalRing') {
      mesh.rotation.z += delta * 2;
    }

    // Despawn once obstacle has passed well behind the camera (z > 5)
    if (mesh.position.z > 5) {
      mesh.parent?.remove(mesh);
      // Dispose group children if it's a group (icicles)
      if (mesh.isGroup) {
        mesh.children.forEach((child) => {
          // Geometries and materials are shared/pooled — don't dispose them
        });
      }
      activeObstacles.splice(i, 1);
    }
  }
}

/**
 * Return the current list of active obstacles for collision checks.
 */
export function getActiveObstacles() {
  return activeObstacles;
}

/**
 * Remove all obstacles from the scene and clear the list. Used on game reset.
 * @param {THREE.Scene} scene
 */
export function clearObstacles(scene) {
  for (const obs of activeObstacles) {
    scene.remove(obs.mesh);
  }
  activeObstacles.length = 0;
  nextSpawnZ = -20;
}
