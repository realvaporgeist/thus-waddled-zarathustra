// src/obstacles.js
import * as THREE from 'three';
import {
  LANE_POSITIONS,
  OBSTACLE_SPAWN_DISTANCE,
  TERRAIN_Y,
  MIN_OBSTACLE_GAP,
  SNOWBALL_SPEED_MULT,
} from './constants.js';

const activeObstacles = [];
let nextSpawnZ = -20;

const pool = {
  iceBlockGeo: new THREE.BoxGeometry(1.8, 1.2, 1.2),
  iceBlockMat: new THREE.MeshStandardMaterial({
    color: 0x88ccee, transparent: true, opacity: 0.6,
    roughness: 0.2, metalness: 0.1,
  }),

  icicleGeo: new THREE.CylinderGeometry(0.1, 0.3, 2.5, 6),
  icicleMat: new THREE.MeshStandardMaterial({
    color: 0xaaddff, transparent: true, opacity: 0.7,
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

  beamGeo: new THREE.BoxGeometry(1.6, 0.12, 0.12),
  beamMat: new THREE.MeshStandardMaterial({
    color: 0x99bbdd, transparent: true, opacity: 0.5,
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

const obstacleTypes = [
  'iceBlock', 'icicles', 'snowball', 'tombstone', 'book', 'eternalRing',
];

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

    case 'icicles': {
      mesh = new THREE.Group();
      const beam = new THREE.Mesh(pool.beamGeo, pool.beamMat);
      beam.position.y = 1.2;
      mesh.add(beam);
      for (let i = -1; i <= 1; i++) {
        const icicle = new THREE.Mesh(pool.icicleGeo, pool.icicleMat);
        icicle.position.set(i * 0.4, 0, 0);
        icicle.rotation.x = Math.PI;
        mesh.add(icicle);
      }
      const w1 = new THREE.Mesh(pool.warningGeo, pool.warningMat);
      w1.rotation.x = -Math.PI / 2;
      w1.position.y = TERRAIN_Y + 0.02 - 2.8;
      mesh.add(w1);
      mesh.position.y = 2.8;
      height = 2.5;
      type = 'overhead';
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

export function spawnObstacle(scene, worldZ, difficulty) {
  if (worldZ > nextSpawnZ) return;

  const typeName = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
  const lane = Math.floor(Math.random() * LANE_POSITIONS.length);

  const { mesh, height, type } = createObstacleMesh(typeName);
  mesh.position.x = LANE_POSITIONS[lane];
  mesh.position.z = -OBSTACLE_SPAWN_DISTANCE;

  scene.add(mesh);
  activeObstacles.push({ mesh, height, type, typeName, lane });

  const gap = Math.max(MIN_OBSTACLE_GAP, 15 - difficulty * 0.5);
  nextSpawnZ = worldZ - gap;
}

export function updateObstacles(delta, worldZ, speed) {
  for (let i = activeObstacles.length - 1; i >= 0; i--) {
    const obs = activeObstacles[i];
    const mesh = obs.mesh;

    // Snowball rolls faster than other obstacles
    const speedMul = obs.typeName === 'snowball' ? SNOWBALL_SPEED_MULT : 1;
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
