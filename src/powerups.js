import {
  SHIELD_MAX_DURATION, MAGNET_DURATION,
  SLOW_TIME_DURATION, SLOW_TIME_FACTOR,
  RUSH_DURATION, RUSH_SCORE_MULTIPLIER,
  DISCO_SCORE_MULTIPLIER,
} from './constants.js';

// Active power-up state
const active = {
  shield: { on: false, timer: 0 },
  magnet: { on: false, timer: 0 },
  slowTime: { on: false, timer: 0 },
  rush: { on: false, timer: 0 },
};

let discoActive = false;
let onDiscoStart = null;
let onDiscoEnd = null;
let onShieldBreak = null;
let onEffectStart = null;
let onEffectEnd = null;

// Earned ability selection (for cycling when both charged)
let selectedAbility = 'slowTime'; // or 'rush'

export function initPowerups(callbacks = {}) {
  active.shield.on = false; active.shield.timer = 0;
  active.magnet.on = false; active.magnet.timer = 0;
  active.slowTime.on = false; active.slowTime.timer = 0;
  active.rush.on = false; active.rush.timer = 0;
  discoActive = false;
  selectedAbility = 'slowTime';
  onDiscoStart = callbacks.onDiscoStart || null;
  onDiscoEnd = callbacks.onDiscoEnd || null;
  onShieldBreak = callbacks.onShieldBreak || null;
  onEffectStart = callbacks.onEffectStart || null;
  onEffectEnd = callbacks.onEffectEnd || null;
}

export function activateShield() {
  active.shield.on = true;
  active.shield.timer = SHIELD_MAX_DURATION;
  if (onEffectStart) onEffectStart('shield');
  checkDisco();
}

export function activateMagnet() {
  active.magnet.on = true;
  active.magnet.timer = MAGNET_DURATION;
  if (onEffectStart) onEffectStart('magnet');
  checkDisco();
}

export function activateSlowTime() {
  active.slowTime.on = true;
  active.slowTime.timer = SLOW_TIME_DURATION;
  if (onEffectStart) onEffectStart('slowTime');
  checkDisco();
}

export function activateRush() {
  active.rush.on = true;
  active.rush.timer = RUSH_DURATION;
  if (onEffectStart) onEffectStart('rush');
  checkDisco();
}

function endEffect(key) {
  active[key].on = false;
  active[key].timer = 0;
  if (onEffectEnd) onEffectEnd(key);
  if (discoActive) endDisco();
}

function checkDisco() {
  if (active.shield.on && active.magnet.on && active.slowTime.on && active.rush.on) {
    if (!discoActive) {
      discoActive = true;
      if (onDiscoStart) onDiscoStart();
    }
  }
}

function endDisco() {
  if (discoActive) {
    discoActive = false;
    if (onDiscoEnd) onDiscoEnd();
  }
}

export function updatePowerups(delta) {
  for (const key of ['shield', 'magnet', 'slowTime', 'rush']) {
    if (!active[key].on) continue;
    // Shield doesn't drain during disco (invincible)
    if (key === 'shield' && discoActive) continue;
    active[key].timer -= delta;
    if (active[key].timer <= 0) endEffect(key);
  }
}

export function hitShield() {
  if (!active.shield.on) return false;
  if (discoActive) return true; // invincible during disco
  active.shield.on = false;
  active.shield.timer = 0;
  if (onShieldBreak) onShieldBreak();
  if (onEffectEnd) onEffectEnd('shield');
  return true;
}

export function isShieldActive() { return active.shield.on; }
export function isMagnetActive() { return active.magnet.on; }
export function isSlowTimeActive() { return active.slowTime.on; }
export function isRushActive() { return active.rush.on; }
export function isDiscoActive() { return discoActive; }

export function getSpeedMultiplier() {
  if (active.slowTime.on && !discoActive) return SLOW_TIME_FACTOR;
  return 1;
}

export function getScoreMultiplier() {
  if (discoActive) return DISCO_SCORE_MULTIPLIER;
  if (active.rush.on) return RUSH_SCORE_MULTIPLIER;
  return 1;
}

export function isInvincibleFromPowerup() {
  return active.rush.on || discoActive;
}

export function getSelectedAbility() {
  return selectedAbility;
}

export function cycleAbility() {
  selectedAbility = selectedAbility === 'slowTime' ? 'rush' : 'slowTime';
}

export function getActiveEffects() {
  return {
    shield: active.shield.on,
    magnet: active.magnet.on,
    slowTime: active.slowTime.on,
    rush: active.rush.on,
    disco: discoActive,
    shieldTimer: active.shield.timer,
    magnetTimer: active.magnet.timer,
    slowTimeTimer: active.slowTime.timer,
    rushTimer: active.rush.timer,
  };
}

export function cleanupPowerups() {
  for (const key of ['shield', 'magnet', 'slowTime', 'rush']) {
    active[key].on = false;
    active[key].timer = 0;
  }
  if (discoActive) endDisco();
}
