// src/bosses.js
import {
  BOSS_FIRST_DISTANCE, BOSS_MIN_INTERVAL, BOSS_MAX_INTERVAL,
  BOSS_WARNING_DURATION, BOSS_DEFEAT_DURATION,
  BOSS_UNLOCK_DISTANCES, BOSS_DURATIONS,
} from './constants.js';

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

// Boss definitions
const GAUNTLET_BOSSES = [
  { id: 'lastMan', name: 'The Last Man', unlockDist: BOSS_UNLOCK_DISTANCES.lastMan, duration: BOSS_DURATIONS.lastMan, type: 'gauntlet', quote: '"The last man lives longest."' },
  { id: 'paleCriminal', name: 'The Pale Criminal', unlockDist: BOSS_UNLOCK_DISTANCES.paleCriminal, duration: BOSS_DURATIONS.paleCriminal, type: 'gauntlet', quote: '"The pale criminal — his deed speaks to him."' },
  { id: 'eternalReturn', name: 'The Eternal Return', unlockDist: BOSS_UNLOCK_DISTANCES.eternalReturn, duration: BOSS_DURATIONS.eternalReturn, type: 'gauntlet', quote: '"This life — you must live it once more and innumerable times more."' },
];

const CHASE_BOSSES = [
  { id: 'abyssSerpent', name: 'The Abyss Serpent', unlockDist: BOSS_UNLOCK_DISTANCES.abyssSerpent, duration: BOSS_DURATIONS.abyssSerpent, type: 'chase', quote: '"If you gaze long into an abyss..."' },
  { id: 'iceTitan', name: 'The Ice Titan', unlockDist: BOSS_UNLOCK_DISTANCES.iceTitan, duration: BOSS_DURATIONS.iceTitan, type: 'chase', quote: '"Of all that is written, I love only what a person has written with his blood."' },
];

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
}

export function updateBosses(delta, distance, playerZ) {
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
      if (currentBoss.updateFn) currentBoss.updateFn(delta, playerZ);
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
  if (onBossWarning) onBossWarning(currentBoss);
}

function endBossEncounter() {
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
  bossState = 'idle';
  currentBoss = null;
}
