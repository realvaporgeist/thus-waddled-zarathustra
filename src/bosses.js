// src/bosses.js
import * as THREE from 'three';
import {
  BOSS_FIRST_DISTANCE, BOSS_MIN_INTERVAL, BOSS_MAX_INTERVAL,
  BOSS_WARNING_DURATION, BOSS_DEFEAT_DURATION,
  BOSS_UNLOCK_DISTANCES, BOSS_DURATIONS,
  TERRAIN_Y, SERPENT_MAX_HITS, TITAN_STOMP_INTERVAL,
} from './constants.js';
import { spawnBossObstacle, getObstacleHistory } from './obstacles.js';

let bossState = 'idle'; // 'idle' | 'warning' | 'active' | 'defeat'
let currentBoss = null;
let bossTimer = 0;
let nextBossDistance = BOSS_FIRST_DISTANCE;
let bossesDefeated = new Set();
let bossHitDuringEncounter = false;
let lastBossType = null; // 'gauntlet' or 'chase' — alternates
let onBossWarning = null;
let onBossActive = null;
let onBossDefeat = null;
let bossScene = null;

// Titan stomp callback (avoids circular dep with scene.js)
let onTitanStomp = null;

// ---------------------------------------------------------------------------
// Three.js resource cleanup helper
// ---------------------------------------------------------------------------
function disposeMeshRecursive(obj) {
  obj.traverse(child => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
      else child.material.dispose();
    }
  });
}

// ---------------------------------------------------------------------------
// Boss 1: The Last Man (gauntlet)
// Visual: hunched gray figure in background
// Pattern: ice block waves every 0.8s with shifting open lane
// ---------------------------------------------------------------------------
let lastManTimer = 0;
let lastManMesh = null;

function spawnLastManVisuals(scene) {
  lastManTimer = 0;
  const group = new THREE.Group();
  const bodyGeo = new THREE.CylinderGeometry(0.8, 1.2, 3, 8);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x555555, emissive: 0x222222 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 1.5;
  group.add(body);
  const headGeo = new THREE.SphereGeometry(0.5, 8, 6);
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.position.y = 3.3;
  group.add(head);
  // Screen-space: penguin at z=0, negative z = ahead
  group.position.set(0, TERRAIN_Y, -120);
  scene.add(group);
  lastManMesh = group;
}

function cleanupLastManVisuals(scene) {
  if (lastManMesh) { scene.remove(lastManMesh); disposeMeshRecursive(lastManMesh); lastManMesh = null; }
}

function updateLastMan(delta) {
  lastManTimer += delta;
  if (lastManTimer >= 0.8) {
    lastManTimer -= 0.8;
    const openLane = Math.floor((performance.now() / 800) % 3);
    for (let lane = 0; lane < 3; lane++) {
      if (lane === openLane) continue;
      // Screen-space: spawn 60 units ahead of the player
      spawnBossObstacle(bossScene, -60, lane, 'iceBlock');
    }
  }
}

// ---------------------------------------------------------------------------
// Boss 2: The Abyss Serpent (chase)
// Visual: massive dark shape with red eyes, looming ahead
// Pattern: serpent gains on player; hits make it lurch closer; 3 hits = game over
// ---------------------------------------------------------------------------
let serpentMesh = null;
let serpentDistance = 30;
let serpentHits = 0;

function spawnSerpentVisuals(scene) {
  serpentDistance = 30;
  serpentHits = 0;
  const group = new THREE.Group();
  const bodyGeo = new THREE.SphereGeometry(4, 12, 8);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a1e, emissive: 0x1a0a2e, emissiveIntensity: 0.3,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.scale.set(1.5, 1, 2);
  group.add(body);
  const eyeGeo = new THREE.SphereGeometry(0.5, 8, 6);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1 });
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-1.5, 1, -3);
  group.add(leftEye);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(1.5, 1, -3);
  group.add(rightEye);
  scene.add(group);
  serpentMesh = group;
}

function updateSerpent(delta) {
  if (!serpentMesh) return;
  serpentDistance -= delta * 0.8;
  // Screen-space: negative z = ahead, serpent looms and closes in
  serpentMesh.position.set(0, TERRAIN_Y + 2, -serpentDistance);
  serpentMesh.children[1].material.emissiveIntensity = 0.6 + Math.sin(performance.now() * 0.005) * 0.4;
  serpentMesh.children[2].material.emissiveIntensity = 0.6 + Math.sin(performance.now() * 0.005) * 0.4;
}

function cleanupSerpentVisuals(scene) {
  if (serpentMesh) { scene.remove(serpentMesh); disposeMeshRecursive(serpentMesh); serpentMesh = null; }
}

export function notifySerpentHit() {
  serpentHits++;
  serpentDistance -= 5;
  return serpentHits >= SERPENT_MAX_HITS;
}

// ---------------------------------------------------------------------------
// Boss 3: The Pale Criminal (gauntlet)
// Pattern: fog fills 2 lanes (clear lane rotates every 4s), plus crevasses
// No special visuals — the fog IS the boss
// ---------------------------------------------------------------------------
let paleCriminalTimer = 0;
let paleCriminalLane = 0;
let paleCriminalSpawnTimer = 0;

function updatePaleCriminal(delta) {
  paleCriminalTimer += delta;
  paleCriminalSpawnTimer += delta;
  if (paleCriminalTimer >= 4) {
    paleCriminalTimer -= 4;
    paleCriminalLane = (paleCriminalLane + 1) % 3;
  }
  if (paleCriminalSpawnTimer >= 2) {
    paleCriminalSpawnTimer -= 2;
    for (let lane = 0; lane < 3; lane++) {
      if (lane === paleCriminalLane) continue;
      spawnBossObstacle(bossScene, -50, lane, 'crevasse');
    }
  }
}

function resetPaleCriminal() {
  paleCriminalTimer = 0;
  paleCriminalLane = 0;
  paleCriminalSpawnTimer = 0;
}

// ---------------------------------------------------------------------------
// Boss 4: The Ice Titan (chase)
// Visual: massive ice figure in background
// Pattern: stomps every 3s (all-lane crevasse), ice spikes between stomps
// ---------------------------------------------------------------------------
let titanMesh = null;
let titanStompTimer = 0;
let titanSpikeTimer = 0;

function spawnTitanVisuals(scene) {
  titanStompTimer = 0;
  titanSpikeTimer = 0;
  const group = new THREE.Group();
  const bodyGeo = new THREE.BoxGeometry(6, 10, 4);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x88aacc, transparent: true, opacity: 0.8,
    emissive: 0x446688, emissiveIntensity: 0.2,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 5;
  group.add(body);
  const headGeo = new THREE.SphereGeometry(2, 8, 6);
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.position.y = 12;
  group.add(head);
  // Screen-space: visible in the distance ahead
  group.position.set(0, TERRAIN_Y, -100);
  scene.add(group);
  titanMesh = group;
}

function cleanupTitanVisuals(scene) {
  if (titanMesh) { scene.remove(titanMesh); disposeMeshRecursive(titanMesh); titanMesh = null; }
}

function updateIceTitan(delta) {
  titanStompTimer += delta;
  titanSpikeTimer += delta;
  if (titanStompTimer >= TITAN_STOMP_INTERVAL) {
    titanStompTimer -= TITAN_STOMP_INTERVAL;
    // Stomp crevasses spawn close — 15 units ahead
    for (let lane = 0; lane < 3; lane++) {
      spawnBossObstacle(bossScene, -15, lane, 'crevasse');
    }
    if (onTitanStomp) onTitanStomp();
  }
  if (titanSpikeTimer >= 1.0) {
    titanSpikeTimer -= 1.0;
    const lane = Math.floor(Math.random() * 3);
    spawnBossObstacle(bossScene, -60, lane, 'iceSpike');
  }
}

// ---------------------------------------------------------------------------
// Boss 5: The Eternal Return (gauntlet)
// Pattern: replays recent obstacle history at compressed intervals
// ---------------------------------------------------------------------------
let eternalReturnQueue = [];
let eternalReturnTimer = 0;
let eternalReturnStarted = false;

const REPLAYABLE_TYPES = ['iceBlock', 'iceSpike', 'snowball', 'tombstone', 'book', 'eternalRing', 'crevasse'];

function startEternalReturn() {
  const history = getObstacleHistory();
  eternalReturnQueue = history.slice(-30)
    .filter(h => REPLAYABLE_TYPES.includes(h.typeName) && h.lane >= 0 && h.lane <= 2)
    .map((h, i) => ({ ...h, delay: i * 0.5 }));
  eternalReturnTimer = 0;
  eternalReturnStarted = true;
}

function updateEternalReturn(delta) {
  if (!eternalReturnStarted) {
    startEternalReturn();
  }
  eternalReturnTimer += delta;
  while (eternalReturnQueue.length > 0 && eternalReturnTimer >= eternalReturnQueue[0].delay) {
    const item = eternalReturnQueue.shift();
    spawnBossObstacle(bossScene, -60, item.lane, item.typeName);
  }
}

function resetEternalReturn() {
  eternalReturnQueue = [];
  eternalReturnTimer = 0;
  eternalReturnStarted = false;
}

// ---------------------------------------------------------------------------
// Boss definitions
// ---------------------------------------------------------------------------
const GAUNTLET_BOSSES = [
  {
    id: 'lastMan', name: 'The Last Man',
    unlockDist: BOSS_UNLOCK_DISTANCES.lastMan, duration: BOSS_DURATIONS.lastMan,
    type: 'gauntlet', quote: '"The last man lives longest."',
    updateFn: updateLastMan,
    spawnVisuals: spawnLastManVisuals,
    cleanupVisuals: cleanupLastManVisuals,
  },
  {
    id: 'paleCriminal', name: 'The Pale Criminal',
    unlockDist: BOSS_UNLOCK_DISTANCES.paleCriminal, duration: BOSS_DURATIONS.paleCriminal,
    type: 'gauntlet', quote: '"The pale criminal \u2014 his deed speaks to him."',
    updateFn: updatePaleCriminal,
    // No special visuals — the fog IS the boss
  },
  {
    id: 'eternalReturn', name: 'The Eternal Return',
    unlockDist: BOSS_UNLOCK_DISTANCES.eternalReturn, duration: BOSS_DURATIONS.eternalReturn,
    type: 'gauntlet', quote: '"This life \u2014 you must live it once more and innumerable times more."',
    updateFn: updateEternalReturn,
    // No special visuals — the pattern IS the boss
  },
];

const CHASE_BOSSES = [
  {
    id: 'abyssSerpent', name: 'The Abyss Serpent',
    unlockDist: BOSS_UNLOCK_DISTANCES.abyssSerpent, duration: BOSS_DURATIONS.abyssSerpent,
    type: 'chase', quote: '"If you gaze long into an abyss..."',
    updateFn: updateSerpent,
    spawnVisuals: spawnSerpentVisuals,
    cleanupVisuals: cleanupSerpentVisuals,
  },
  {
    id: 'iceTitan', name: 'The Ice Titan',
    unlockDist: BOSS_UNLOCK_DISTANCES.iceTitan, duration: BOSS_DURATIONS.iceTitan,
    type: 'chase', quote: '"Of all that is written, I love only what a person has written with his blood."',
    updateFn: updateIceTitan,
    spawnVisuals: spawnTitanVisuals,
    cleanupVisuals: cleanupTitanVisuals,
  },
];

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------

export function initBosses(scene, callbacks = {}) {
  bossState = 'idle';
  currentBoss = null;
  bossTimer = 0;
  nextBossDistance = BOSS_FIRST_DISTANCE;
  bossesDefeated = new Set();
  bossHitDuringEncounter = false;
  lastBossType = null;
  bossScene = scene;
  onBossWarning = callbacks.onBossWarning || null;
  onBossActive = callbacks.onBossActive || null;
  onBossDefeat = callbacks.onBossDefeat || null;
  onTitanStomp = callbacks.onTitanStomp || null;
}

export function updateBosses(delta, distance) {
  switch (bossState) {
    case 'idle':
      if (distance >= nextBossDistance) {
        startBossEncounter(distance);
      }
      break;

    case 'warning':
      bossTimer -= delta;
      if (bossTimer <= 0) {
        bossState = 'active';
        bossTimer = currentBoss.duration;
        bossHitDuringEncounter = false;
        if (onBossActive) onBossActive(currentBoss);
      }
      break;

    case 'active':
      bossTimer -= delta;
      if (currentBoss.updateFn) currentBoss.updateFn(delta);
      if (bossTimer <= 0) {
        bossState = 'defeat';
        bossTimer = BOSS_DEFEAT_DURATION;
        bossesDefeated.add(currentBoss.id);
        if (onBossDefeat) onBossDefeat(currentBoss, bossHitDuringEncounter);
      }
      break;

    case 'defeat':
      bossTimer -= delta;
      if (bossTimer <= 0) {
        endBossEncounter();
      }
      break;
  }
}

function startBossEncounter(distance) {
  const nextType = lastBossType === 'gauntlet' ? 'chase' : 'gauntlet';
  const pool = nextType === 'gauntlet' ? GAUNTLET_BOSSES : CHASE_BOSSES;
  const available = pool.filter(b => distance >= b.unlockDist);

  if (available.length === 0) {
    const altPool = nextType === 'gauntlet' ? CHASE_BOSSES : GAUNTLET_BOSSES;
    const altAvailable = altPool.filter(b => distance >= b.unlockDist);
    if (altAvailable.length === 0) return;
    currentBoss = altAvailable[Math.floor(Math.random() * altAvailable.length)];
  } else {
    currentBoss = available[Math.floor(Math.random() * available.length)];
  }

  lastBossType = currentBoss.type;
  bossState = 'warning';
  bossTimer = BOSS_WARNING_DURATION;

  // Spawn boss visuals (screen-space — no playerZ needed)
  if (currentBoss.spawnVisuals) currentBoss.spawnVisuals(bossScene);

  // Reset boss-specific timers for bosses without spawnVisuals
  if (currentBoss.id === 'paleCriminal') resetPaleCriminal();
  if (currentBoss.id === 'eternalReturn') resetEternalReturn();

  if (onBossWarning) onBossWarning(currentBoss);
}

function endBossEncounter() {
  if (currentBoss && currentBoss.cleanupVisuals) currentBoss.cleanupVisuals(bossScene);
  currentBoss = null;
  bossState = 'idle';
  nextBossDistance += BOSS_MIN_INTERVAL + Math.random() * (BOSS_MAX_INTERVAL - BOSS_MIN_INTERVAL);
}

export function isBossActive() {
  return bossState === 'active';
}

export function isBossEncounter() {
  return bossState !== 'idle';
}

export function getBossState() {
  return bossState;
}

export function getCurrentBoss() {
  return currentBoss;
}

export function getBossTimer() {
  return bossTimer;
}

export function notifyBossHit() {
  bossHitDuringEncounter = true;
}

export function getAllBossesDefeated() {
  return bossesDefeated;
}

export function cleanupBosses() {
  if (currentBoss && currentBoss.cleanupVisuals) currentBoss.cleanupVisuals(bossScene);
  bossState = 'idle';
  currentBoss = null;
}
