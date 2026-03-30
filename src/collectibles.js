// src/collectibles.js
import * as THREE from 'three';
import {
  LANE_POSITIONS,
  OBSTACLE_SPAWN_DISTANCE,
  TERRAIN_Y,
  FISH_FLOAT_HEIGHT,
  FISH_ROTATE_SPEED,
  FISH_SPAWN_CHANCE,
  GOLDEN_FISH_CHANCE,
  QUOTE_SPAWN_CHANCE,
  ABYSS_ORB_MIN_INTERVAL,
  ABYSS_ORB_MAX_INTERVAL,
  SHIELD_SPAWN_CHANCE,
  SHIELD_COOLDOWN,
  MAGNET_SPAWN_CHANCE,
  MAGNET_COOLDOWN,
  MAGNET_PULL_SPEED,
  LANE_WIDTH,
  PENGUIN_HEIGHT,
} from './constants.js';
import { getActiveObstacles } from './obstacles.js';
import { QUOTE_DATA } from './achievements.js';

// ---------------------------------------------------------------------------
// Active collectibles & collect effects
// ---------------------------------------------------------------------------
const activeCollectibles = [];
const collectEffects = [];

// ---------------------------------------------------------------------------
// Spawn tracking
// ---------------------------------------------------------------------------
let nextSpawnZ = -15;
let orbCooldownEnd = ABYSS_ORB_MIN_INTERVAL;
let shieldCooldownTimer = 0;
let magnetCooldownTimer = 0;

// ---------------------------------------------------------------------------
// Weather collectible modifiers
// ---------------------------------------------------------------------------
let fishSpawnBonus = 0;
let goldenFishMult = 1;

export function setWeatherCollectibleModifiers(bonus, goldMult) {
  fishSpawnBonus = bonus;
  goldenFishMult = goldMult;
}

// ---------------------------------------------------------------------------
// Active power-up state (for clustered spawning)
// ---------------------------------------------------------------------------
let shieldActive = false;
let magnetActive = false;

export function setActivePowerupState(shield, magnet) {
  shieldActive = shield;
  magnetActive = magnet;
}

// ---------------------------------------------------------------------------
// Shared geometry / material pools
// ---------------------------------------------------------------------------
const pool = {
  fishGeo: new THREE.ConeGeometry(0.15, 0.5, 8),
  fishMat: new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.4 }),
  fishTailGeo: new THREE.BufferGeometry(),
  goldenFishMat: new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.2, metalness: 0.8 }),
  goldenGlowGeo: new THREE.SphereGeometry(0.5, 12, 10),
  goldenGlowMat: new THREE.MeshStandardMaterial({ color: 0xffd700, transparent: true, opacity: 0.2, side: THREE.DoubleSide }),

  quoteGeo: new THREE.PlaneGeometry(2, 0.6),
  quoteGlowGeo: new THREE.SphereGeometry(1.2, 12, 10),
  quoteGlowMat: new THREE.MeshStandardMaterial({ color: 0xffff88, transparent: true, opacity: 0.15, side: THREE.DoubleSide }),

  orbGeo: new THREE.SphereGeometry(0.5, 16, 14),
  orbMat: new THREE.MeshStandardMaterial({ color: 0x440066, roughness: 0.3, metalness: 0.5 }),
  orbRingGeo: new THREE.TorusGeometry(0.7, 0.05, 8, 24),
  orbRingMat: new THREE.MeshStandardMaterial({ color: 0x8800cc, roughness: 0.3, metalness: 0.6 }),
  orbGlowGeo: new THREE.SphereGeometry(0.8, 12, 10),
  orbGlowMat: new THREE.MeshStandardMaterial({ color: 0xff0000, transparent: true, opacity: 0.15, side: THREE.DoubleSide }),

  // Collect effect
  effectGeo: new THREE.SphereGeometry(0.3, 8, 8),
};

{
  const vertices = new Float32Array([0, 0.25, -0.12, 0, -0.25, -0.12, 0, 0, -0.35]);
  pool.fishTailGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  pool.fishTailGeo.computeVertexNormals();
}

// ---------------------------------------------------------------------------
// Fish pattern generators
// ---------------------------------------------------------------------------
function patternLine(lane, baseZ, count) {
  return Array.from({ length: count }, (_, i) => ({ lane, z: baseZ - i * 3, y: TERRAIN_Y + FISH_FLOAT_HEIGHT }));
}
function patternArc(lane, baseZ) {
  const n = 5;
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return { lane, z: baseZ - i * 2.5, y: TERRAIN_Y + FISH_FLOAT_HEIGHT + Math.sin(t * Math.PI) * 2.5 };
  });
}
function patternDiagonal(startLane, baseZ) {
  const dir = startLane === 0 ? 1 : startLane === 2 ? -1 : (Math.random() < 0.5 ? 1 : -1);
  return Array.from({ length: 3 }, (_, i) => ({
    lane: Math.max(0, Math.min(2, startLane + i * dir)), z: baseZ - i * 3, y: TERRAIN_Y + FISH_FLOAT_HEIGHT,
  }));
}
function patternVShape(lane, baseZ) {
  return [
    { lane, z: baseZ, y: TERRAIN_Y + FISH_FLOAT_HEIGHT + 2 },
    { lane, z: baseZ - 2.5, y: TERRAIN_Y + FISH_FLOAT_HEIGHT + 1 },
    { lane, z: baseZ - 5, y: TERRAIN_Y + FISH_FLOAT_HEIGHT },
    { lane, z: baseZ - 7.5, y: TERRAIN_Y + FISH_FLOAT_HEIGHT + 1 },
    { lane, z: baseZ - 10, y: TERRAIN_Y + FISH_FLOAT_HEIGHT + 2 },
  ];
}
function patternGroundLine(lane, baseZ) {
  return Array.from({ length: 4 }, (_, i) => ({
    lane, z: baseZ - i * 2.5, y: TERRAIN_Y + FISH_FLOAT_HEIGHT * 0.5,
  }));
}

// ---------------------------------------------------------------------------
// Obstacle-aware helpers
// ---------------------------------------------------------------------------
function getObstaclesNearZ(targetZ, range) {
  return getActiveObstacles().filter(obs => {
    const dz = obs.mesh.position.z - targetZ;
    return dz > -range && dz < range;
  });
}
function isLaneBlockedAtZ(lane, targetZ) {
  return getObstaclesNearZ(targetZ, 3).some(o => o.lane === lane && o.type === 'ground');
}
function getFreeLane(targetZ) {
  const free = [0, 1, 2].filter(l => !isLaneBlockedAtZ(l, targetZ));
  return free.length > 0 ? free[Math.floor(Math.random() * free.length)] : -1;
}

function pickFishPattern(lane, baseZ) {
  const nearby = getObstaclesNearZ(baseZ, 15);
  for (const obs of nearby) {
    if (obs.lane === lane) {
      if (obs.type === 'ground') return patternArc(lane, obs.mesh.position.z + 5);
      if (obs.type === 'overhead') return patternGroundLine(lane, obs.mesh.position.z + 5);
    }
  }
  const pats = [
    () => patternLine(lane, baseZ, 3 + Math.floor(Math.random() * 3)),
    () => patternDiagonal(lane, baseZ),
    () => patternVShape(lane, baseZ),
    () => patternLine(lane, baseZ, 4),
  ];
  return pats[Math.floor(Math.random() * pats.length)]();
}

// ---------------------------------------------------------------------------
// Create meshes
// ---------------------------------------------------------------------------
function createFishMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(pool.fishGeo, pool.fishMat);
  body.rotation.x = Math.PI / 2;
  g.add(body);
  const tail = new THREE.Mesh(pool.fishTailGeo, new THREE.MeshStandardMaterial({ color: 0x3366cc, side: THREE.DoubleSide }));
  tail.position.z = 0.25;
  g.add(tail);
  return g;
}
function createGoldenFishMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(pool.fishGeo, pool.goldenFishMat);
  body.rotation.x = Math.PI / 2;
  g.add(body);
  const tail = new THREE.Mesh(pool.fishTailGeo, new THREE.MeshStandardMaterial({ color: 0xccaa00, side: THREE.DoubleSide }));
  tail.position.z = 0.25;
  g.add(tail);
  g.add(new THREE.Mesh(pool.goldenGlowGeo, pool.goldenGlowMat));
  return g;
}

function createQuoteScrollMesh() {
  const g = new THREE.Group();
  // Parchment scroll — no text (fragment revealed via HUD)
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 80;
  const c = canvas.getContext('2d');
  c.fillStyle = '#f5e6c8';
  c.fillRect(0, 0, 256, 80);
  c.strokeStyle = '#8b7355';
  c.lineWidth = 3;
  c.strokeRect(4, 4, 248, 72);
  c.fillStyle = '#5a3a1a';
  c.font = 'bold 24px serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('?', 128, 40);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, transparent: true });
  g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.4), mat));
  g.add(new THREE.Mesh(pool.quoteGlowGeo, pool.quoteGlowMat));
  g.position.y = TERRAIN_Y + FISH_FLOAT_HEIGHT + 0.5;
  return g;
}

function createAbyssOrbMesh() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(pool.orbGeo, pool.orbMat));
  const r1 = new THREE.Mesh(pool.orbRingGeo, pool.orbRingMat); r1.name = 'ring1'; g.add(r1);
  const r2 = new THREE.Mesh(pool.orbRingGeo, pool.orbRingMat); r2.name = 'ring2'; r2.rotation.x = Math.PI / 2; g.add(r2);
  g.add(new THREE.Mesh(pool.orbGlowGeo, pool.orbGlowMat));
  g.position.y = TERRAIN_Y + FISH_FLOAT_HEIGHT + 0.3;
  return g;
}

function createShieldPickupMesh() {
  const group = new THREE.Group();
  const geo = new THREE.IcosahedronGeometry(0.5, 1);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x64c8ff, transparent: true, opacity: 0.6,
    emissive: 0x64c8ff, emissiveIntensity: 0.3,
  });
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);
  return group;
}

function createMagnetPickupMesh() {
  const group = new THREE.Group();
  const geo = new THREE.TorusGeometry(0.35, 0.12, 8, 16);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 0.4,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI / 2;
  group.add(mesh);
  return group;
}

function spawnShieldPickup(scene, baseZ, lane) {
  if (lane < 0) return;
  const mesh = createShieldPickupMesh();
  mesh.position.set(LANE_POSITIONS[lane], TERRAIN_Y + FISH_FLOAT_HEIGHT, baseZ);
  scene.add(mesh);
  activeCollectibles.push({ mesh, type: 'shield', lane, collected: false, collectTime: 0 });
}

function spawnMagnetPickup(scene, baseZ, lane) {
  if (lane < 0) return;
  const mesh = createMagnetPickupMesh();
  mesh.position.set(LANE_POSITIONS[lane], TERRAIN_Y + FISH_FLOAT_HEIGHT, baseZ);
  scene.add(mesh);
  activeCollectibles.push({ mesh, type: 'magnet', lane, collected: false, collectTime: 0 });
}

// ---------------------------------------------------------------------------
// Collect effect (expanding sphere)
// ---------------------------------------------------------------------------
function spawnCollectEffect(scene, pos, color) {
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 });
  const mesh = new THREE.Mesh(pool.effectGeo, mat);
  mesh.position.copy(pos);
  scene.add(mesh);
  collectEffects.push({ mesh, mat, timer: 0 });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export function spawnCollectibles(scene, worldZ, elapsed) {
  if (worldZ > nextSpawnZ) return;
  const spawnZ = -(OBSTACLE_SPAWN_DISTANCE - 5);
  const roll = Math.random();

  if (elapsed > orbCooldownEnd && roll < 0.02) {
    const lane = getFreeLane(spawnZ);
    if (lane < 0) { nextSpawnZ = worldZ - 5; return; }
    const mesh = createAbyssOrbMesh();
    mesh.position.x = LANE_POSITIONS[lane]; mesh.position.z = spawnZ;
    scene.add(mesh);
    activeCollectibles.push({ mesh, type: 'abyssOrb', lane, collected: false, collectTime: 0 });
    nextSpawnZ = worldZ - 20;
    orbCooldownEnd = elapsed + ABYSS_ORB_MIN_INTERVAL + Math.random() * (ABYSS_ORB_MAX_INTERVAL - ABYSS_ORB_MIN_INTERVAL);
    return;
  }

  // Power-up spawns — slightly boosted when the other collectible power-up is active
  const shieldChance = magnetActive ? SHIELD_SPAWN_CHANCE * 2 : SHIELD_SPAWN_CHANCE;
  const magnetChance = shieldActive ? MAGNET_SPAWN_CHANCE * 2 : MAGNET_SPAWN_CHANCE;
  if (shieldCooldownTimer <= 0 && Math.random() < shieldChance) {
    spawnShieldPickup(scene, spawnZ, getFreeLane(spawnZ));
    shieldCooldownTimer = magnetActive ? SHIELD_COOLDOWN * 0.6 : SHIELD_COOLDOWN;
    nextSpawnZ = worldZ - 15;
    return;
  }
  if (magnetCooldownTimer <= 0 && Math.random() < magnetChance) {
    spawnMagnetPickup(scene, spawnZ, getFreeLane(spawnZ));
    magnetCooldownTimer = shieldActive ? MAGNET_COOLDOWN * 0.6 : MAGNET_COOLDOWN;
    nextSpawnZ = worldZ - 15;
    return;
  }

  if (roll < 0.02 + QUOTE_SPAWN_CHANCE) {
    const lane = getFreeLane(spawnZ);
    if (lane < 0) { nextSpawnZ = worldZ - 5; return; }
    const mesh = createQuoteScrollMesh();
    mesh.position.x = LANE_POSITIONS[lane]; mesh.position.z = spawnZ;
    scene.add(mesh);
    activeCollectibles.push({ mesh, type: 'quote', lane, collected: false, collectTime: 0 });
    nextSpawnZ = worldZ - 15;

  } else if (roll < 0.02 + QUOTE_SPAWN_CHANCE + GOLDEN_FISH_CHANCE * goldenFishMult) {
    const lane = getFreeLane(spawnZ);
    if (lane < 0) { nextSpawnZ = worldZ - 5; return; }
    const mesh = createGoldenFishMesh();
    mesh.position.x = LANE_POSITIONS[lane]; mesh.position.z = spawnZ; mesh.position.y = TERRAIN_Y + FISH_FLOAT_HEIGHT;
    scene.add(mesh);
    activeCollectibles.push({ mesh, type: 'goldenFish', lane, collected: false, collectTime: 0 });
    nextSpawnZ = worldZ - 12;

  } else if (roll < 0.02 + QUOTE_SPAWN_CHANCE + GOLDEN_FISH_CHANCE * goldenFishMult + FISH_SPAWN_CHANCE * (1 + fishSpawnBonus)) {
    const lane = Math.floor(Math.random() * LANE_POSITIONS.length);
    const positions = pickFishPattern(lane, spawnZ);
    for (const pos of positions) {
      if (isLaneBlockedAtZ(pos.lane, pos.z)) continue;
      const mesh = createFishMesh();
      mesh.position.x = LANE_POSITIONS[pos.lane]; mesh.position.z = pos.z; mesh.position.y = pos.y;
      scene.add(mesh);
      activeCollectibles.push({ mesh, type: 'fish', lane: pos.lane, collected: false, collectTime: 0 });
    }
    nextSpawnZ = worldZ - 10;
  } else {
    nextSpawnZ = worldZ - 5;
  }
}

export function updateCollectibles(delta, speed) {
  if (shieldCooldownTimer > 0) shieldCooldownTimer -= delta;
  if (magnetCooldownTimer > 0) magnetCooldownTimer -= delta;

  // Update collect effects
  for (let i = collectEffects.length - 1; i >= 0; i--) {
    const eff = collectEffects[i];
    eff.timer += delta;
    const t = eff.timer / 0.35;
    const s = 1 + t * 3;
    eff.mesh.scale.set(s, s, s);
    eff.mat.opacity = 0.7 * (1 - t);
    if (t >= 1) {
      eff.mesh.parent?.remove(eff.mesh);
      eff.mat.dispose();
      collectEffects.splice(i, 1);
    }
  }

  // Update collectibles
  for (let i = activeCollectibles.length - 1; i >= 0; i--) {
    const col = activeCollectibles[i];
    const mesh = col.mesh;

    // Collected — animate out
    if (col.collected) {
      col.collectTime += delta;
      const t = Math.min(col.collectTime / 0.25, 1);
      mesh.position.y += delta * 8;
      const s = 1 + t * 1.5;
      mesh.scale.set(s, s, s);
      if (t >= 1) {
        mesh.parent?.remove(mesh);
        activeCollectibles.splice(i, 1);
      }
      continue;
    }

    mesh.position.z += speed * delta;
    mesh.position.y += Math.sin(performance.now() * 0.003 + i) * 0.002;
    mesh.rotation.y += FISH_ROTATE_SPEED * delta;

    if (col.type === 'abyssOrb') {
      const r1 = mesh.getObjectByName('ring1');
      const r2 = mesh.getObjectByName('ring2');
      if (r1) r1.rotation.z += delta * 2;
      if (r2) r2.rotation.y += delta * 1.5;
    }

    if (mesh.position.z > 5) {
      mesh.parent?.remove(mesh);
      activeCollectibles.splice(i, 1);
    }
  }
}

export function checkCollectiblePickup(penguinPos, penguinLane, scene) {
  const collected = [];
  for (let i = activeCollectibles.length - 1; i >= 0; i--) {
    const col = activeCollectibles[i];
    if (col.collected) continue;
    const mesh = col.mesh;
    const dz = Math.abs(mesh.position.z - penguinPos.z);
    const dx = Math.abs(mesh.position.x - penguinPos.x);
    const dy = mesh.position.y - penguinPos.y;
    if (dz < 1.5 && dx < 1.5 && dy < PENGUIN_HEIGHT + 0.8 && dy > -1.0) {
      col.collected = true;
      col.collectTime = 0;
      // Spawn visual effect
      const effectColor = col.type === 'goldenFish' ? 0xffd700 : col.type === 'abyssOrb' ? 0x8800cc : col.type === 'quote' ? 0xffff88 : col.type === 'shield' ? 0x64c8ff : col.type === 'magnet' ? 0x00e5ff : 0x4488ff;
      if (scene) spawnCollectEffect(scene, mesh.position.clone(), effectColor);
      collected.push({ type: col.type });
    }
  }
  return collected;
}

export function clearCollectibles(scene) {
  for (const col of activeCollectibles) scene.remove(col.mesh);
  activeCollectibles.length = 0;
  for (const eff of collectEffects) { eff.mesh.parent?.remove(eff.mesh); eff.mat.dispose(); }
  collectEffects.length = 0;
  nextSpawnZ = -15;
  orbCooldownEnd = ABYSS_ORB_MIN_INTERVAL;
  shieldCooldownTimer = 0;
  magnetCooldownTimer = 0;
}

export function applyMagnetPull(playerLane, penguinZ, delta) {
  const playerX = LANE_POSITIONS[playerLane];
  for (const c of activeCollectibles) {
    if (c.collected || (c.type !== 'fish' && c.type !== 'goldenFish')) continue;
    // Only pull fish that are nearby in Z (ahead of or just behind the player)
    const dz = c.mesh.position.z - penguinZ;
    if (dz < -20 || dz > 3) continue;
    const dx = Math.abs(c.mesh.position.x - playerX);
    if (dx < 0.3) {
      // Snap to player lane when close enough
      c.mesh.position.x = playerX;
    } else if (dx < LANE_WIDTH * 2) {
      const dir = playerX > c.mesh.position.x ? 1 : -1;
      c.mesh.position.x += dir * (LANE_WIDTH / MAGNET_PULL_SPEED) * delta;
    }
  }
}

export function snapFishToNearestLane() {
  for (const c of activeCollectibles) {
    if (c.collected || (c.type !== 'fish' && c.type !== 'goldenFish')) continue;
    let nearestX = LANE_POSITIONS[0];
    let nearestDist = Math.abs(c.mesh.position.x - LANE_POSITIONS[0]);
    for (let i = 1; i < LANE_POSITIONS.length; i++) {
      const d = Math.abs(c.mesh.position.x - LANE_POSITIONS[i]);
      if (d < nearestDist) { nearestDist = d; nearestX = LANE_POSITIONS[i]; }
    }
    c.mesh.position.x = nearestX;
  }
}

export function autoCollectAllFish(penguinPos, scene) {
  const collected = [];
  for (const c of activeCollectibles) {
    if (c.collected) continue;
    if (c.type === 'fish' || c.type === 'goldenFish') {
      c.collected = true;
      c.collectTime = 0;
      collected.push({ type: c.type });
    }
  }
  return collected;
}

// ---------------------------------------------------------------------------
// Disco-opportunity helpers
// ---------------------------------------------------------------------------
export function boostPowerupSpawns() {
  // When one collectible power-up activates, reset the other's cooldown
  shieldCooldownTimer = 0;
  magnetCooldownTimer = 0;
}

export function forceSpawnPowerupNearby(scene, type, playerZ, lane) {
  // Spawn a power-up pickup ~12 units ahead of the player
  const z = playerZ - 12;
  if (type === 'shield') {
    spawnShieldPickup(scene, z, lane);
  } else if (type === 'magnet') {
    spawnMagnetPickup(scene, z, lane);
  }
}

export function spawnFishAt(scene, z, lane) {
  if (lane < 0 || lane >= LANE_POSITIONS.length) return;
  const mesh = createFishMesh();
  mesh.position.set(LANE_POSITIONS[lane], TERRAIN_Y + FISH_FLOAT_HEIGHT, z);
  scene.add(mesh);
  activeCollectibles.push({ mesh, type: 'fish', lane, collected: false, collectTime: 0 });
}

export function getNietzscheQuotes() {
  return QUOTE_DATA.map(q => q.fragments.join(' '));
}
