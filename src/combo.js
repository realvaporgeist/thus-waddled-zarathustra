import {
  COMBO_TIERS,
  COMBO_DRAIN_BASE,
  COMBO_DRAIN_MULTIPLIERS,
  SLOW_TIME_CHARGE_TIER,
  RUSH_CHARGE_TIER,
} from './constants.js';

let meter = 0; // 0–1
let lastTier = 0;
let slowTimeCharged = false;
let rushCharged = false;
let drainPaused = false;
let onTierUp = null; // callback

export function initCombo(callbacks = {}) {
  meter = 0;
  lastTier = 0;
  slowTimeCharged = false;
  rushCharged = false;
  drainPaused = false;
  onTierUp = callbacks.onTierUp || null;
}

export function getComboMeter() { return meter; }

export function getComboTierIndex() {
  for (let i = COMBO_TIERS.length - 1; i >= 0; i--) {
    if (meter >= COMBO_TIERS[i].threshold) return i;
  }
  return 0;
}

export function getComboTier() { return COMBO_TIERS[getComboTierIndex()]; }
export function getComboMultiplier() { return getComboTier().multiplier; }

export function fillCombo(amount) {
  meter = Math.min(1, meter + amount);
  const tierIdx = getComboTierIndex();
  if (tierIdx > lastTier) {
    lastTier = tierIdx;
    if (onTierUp) onTierUp(COMBO_TIERS[tierIdx]);
    if (tierIdx >= SLOW_TIME_CHARGE_TIER && !slowTimeCharged) slowTimeCharged = true;
    if (tierIdx >= RUSH_CHARGE_TIER && !rushCharged) rushCharged = true;
  }
}

export function resetCombo() { meter = 0; lastTier = 0; }

export function updateCombo(delta) {
  if (drainPaused || meter <= 0) return;
  const tierIdx = getComboTierIndex();
  const drainRate = COMBO_DRAIN_BASE * COMBO_DRAIN_MULTIPLIERS[tierIdx];
  meter = Math.max(0, meter - drainRate * delta);
  const newTier = getComboTierIndex();
  if (newTier < lastTier) lastTier = newTier;
}

export function setDrainPaused(paused) { drainPaused = paused; }
export function isSlowTimeCharged() { return slowTimeCharged; }
export function isRushCharged() { return rushCharged; }
export function consumeSlowTimeCharge() { slowTimeCharged = false; }
export function consumeRushCharge() { rushCharged = false; }

export function cleanupCombo() {
  meter = 0; lastTier = 0; slowTimeCharged = false; rushCharged = false;
}
