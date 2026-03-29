# Phase 2: Gameplay Depth — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add combo system, power-ups, new obstacles, boss encounters, weather gameplay effects, and disco mode to the endless runner.

**Architecture:** Foundation-first. New modules (`combo.js`, `powerups.js`, `bosses.js`) expose clean interfaces wired into the existing game loop in `main.js`. Each system reads/writes shared game state through function calls, not globals.

**Tech Stack:** Vanilla JS, Three.js, Vite. No test framework — verification is visual via `npx vite`.

**Design Spec:** `docs/superpowers/specs/2026-03-29-phase2-gameplay-depth-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/combo.js` | Combo meter state machine: fill/drain/reset, tier calculation, HUD rendering (bottom-center bar) |
| `src/powerups.js` | Power-up manager: active effect tracking, path pickup spawning via collectibles, earned ability charging/activation, disco mode detection |
| `src/bosses.js` | Boss encounter framework: spawn timing, phase state machine (warning → active → defeat), 5 boss scripts, obstacle pattern generation |

### Modified Files
| File | What Changes |
|------|-------------|
| `src/constants.js` | All new tuning constants (combo, power-ups, obstacles, bosses, weather, disco) |
| `src/main.js` | Wire combo/powerup/boss updates into game loop, combo multiplier in score calc, near-miss feeds combo |
| `src/obstacles.js` | Add ice spike (rework icicles), ice wall, wind gust, crevasse, philosopher's fog; weather-gated spawn logic |
| `src/collectibles.js` | Add shield/magnet pickup types, magnet pull behavior, disco auto-collect |
| `src/hud.js` | Bottom-center combo bar, power-up icons bottom-left, earned ability button bottom-right |
| `src/controls.js` | Add `E` key and hold-detection for earned ability activation |
| `src/weather.js` | Gameplay modifier layer: drift, late reveal distance, bonus spawn rates; expose `getWeatherModifiers()` |
| `src/achievements.js` | 7 new achievements |
| `src/skins.js` | Disco penguin skin |
| `src/dread.js` | Disco mode visual override |
| `src/scene.js` | Disco strobe lighting, rainbow trail |
| `src/particles.js` | New particle configs (shield shatter, magnet vortex, boss warning, disco sparkles) |
| `src/collision.js` | Add crevasse ground-check collision type |
| `src/penguin.js` | Expose `applyDrift(dx)` for blizzard lateral drift, shield/magnet visual attachments |

---

## Task 1: Add Phase 2 Constants

**Files:**
- Modify: `src/constants.js`

This task adds all tuning constants for Phase 2 systems. Every subsequent task references these values.

- [ ] **Step 1: Add combo constants**

Add after the existing Scoring section (~line 85):

```javascript
// Combo System
export const COMBO_TIERS = [
  { name: 'Mortal', multiplier: 1.0, threshold: 0, color: '#888888' },
  { name: 'Camel', multiplier: 1.5, threshold: 0.25, color: '#cd7f32' },
  { name: 'Lion', multiplier: 2.5, threshold: 0.50, color: '#c0c0c0' },
  { name: 'Free Spirit', multiplier: 4.0, threshold: 0.75, color: '#ffd700' },
  { name: 'Übermensch', multiplier: 6.0, threshold: 1.0, color: '#ffd700' },
];
export const COMBO_FILL_NEAR_MISS = 0.15;
export const COMBO_FILL_FISH = 0.05;
export const COMBO_FILL_GOLDEN_FISH = 0.12;
export const COMBO_FILL_BOSS_SURVIVE = 0.25;
export const COMBO_FILL_NO_DAMAGE_100M = 0.03;
export const COMBO_DRAIN_BASE = 0.08; // per second
export const COMBO_DRAIN_MULTIPLIERS = [1.0, 1.0, 1.5, 2.0, 2.5]; // per tier index
```

- [ ] **Step 2: Add power-up constants**

Add after combo constants:

```javascript
// Power-ups — Path Pickups
export const SHIELD_SPAWN_CHANCE = 0.03;
export const SHIELD_COOLDOWN = 30;
export const SHIELD_MAX_DURATION = 20;
export const MAGNET_SPAWN_CHANCE = 0.025;
export const MAGNET_COOLDOWN = 35;
export const MAGNET_DURATION = 8;
export const MAGNET_PULL_SPEED = 0.5; // seconds to reach player

// Power-ups — Earned Abilities
export const SLOW_TIME_CHARGE_TIER = 2; // Lion tier index
export const SLOW_TIME_DURATION = 5;
export const SLOW_TIME_FACTOR = 0.4; // world speed multiplier
export const RUSH_CHARGE_TIER = 4; // Übermensch tier index
export const RUSH_DURATION = 4;
export const RUSH_SCORE_MULTIPLIER = 3;
export const ABILITY_HOLD_THRESHOLD = 0.5; // seconds to activate

// Disco Mode
export const DISCO_SCORE_MULTIPLIER = 10;
export const DISCO_STROBE_INTERVAL = 0.4; // seconds between color pulses
```

- [ ] **Step 3: Add obstacle constants**

Add after existing obstacle constants (~line 55):

```javascript
// New Obstacles
export const ICE_SPIKE_SPEED_MULT = 1.6;
export const ICE_SPIKE_HEIGHT = 2.0;
export const ICE_SPIKE_HALF_WIDTH = 0.6;
export const ICE_SPIKE_TELEGRAPH = 0.8; // seconds before arrival
export const ICE_WALL_HEIGHT = 2.5;
export const ICE_WALL_TELEGRAPH = 1.2;
export const ICE_WALL_MIN_DISTANCE = 500;
export const WIND_GUST_PUSH_DURATION = 0.4;
export const WIND_GUST_TELEGRAPH = 0.6;
export const WIND_GUST_MIN_DISTANCE = 800;
export const CREVASSE_MIN_DISTANCE = 300;
export const PHILOSOPHER_FOG_DEPTH = 15; // units
export const PHILOSOPHER_FOG_MIN_DISTANCE = 800;
export const MAX_COMPLEX_OBSTACLES = 2;
```

- [ ] **Step 4: Add boss constants**

```javascript
// Boss Encounters
export const BOSS_FIRST_DISTANCE = 2000;
export const BOSS_MIN_INTERVAL = 2500;
export const BOSS_MAX_INTERVAL = 3000;
export const BOSS_WARNING_DURATION = 2;
export const BOSS_DEFEAT_DURATION = 1.5;

export const BOSS_UNLOCK_DISTANCES = {
  lastMan: 2000,
  abyssSerpent: 3500,
  paleCriminal: 5000,
  iceTitan: 7000,
  eternalReturn: 10000,
};

export const BOSS_DURATIONS = {
  lastMan: 12,
  abyssSerpent: 15,
  paleCriminal: 15,
  iceTitan: 15,
  eternalReturn: 18,
};

// Chase-specific
export const SERPENT_SPEED_MULT = 1.4;
export const SERPENT_MAX_HITS = 3;
export const TITAN_STOMP_INTERVAL = 3;
export const TITAN_SPIKE_SPEED_MULT = 1.8;
export const ETERNAL_RETURN_SPEED_MULT = 1.3;
```

- [ ] **Step 5: Add weather gameplay constants**

```javascript
// Weather Gameplay Effects
export const BLIZZARD_DRIFT_SPEED = 0.3; // units/sec
export const BLIZZARD_DRIFT_CHANGE_MIN = 5; // seconds
export const BLIZZARD_DRIFT_CHANGE_MAX = 8;
export const BLIZZARD_ICE_SPIKE_SPEED_BONUS = 0.1; // +10%
export const FOG_DRAW_DISTANCE_MULT = 0.6; // 60% of normal
export const CLEAR_FISH_SPAWN_BONUS = 0.3; // +30%
export const CLEAR_GOLDEN_FISH_MULT = 2; // double chance
export const CLEAR_SCORE_BONUS = 0.1; // +10%
```

- [ ] **Step 6: Verify the game still loads**

Run: `npx vite` — open in browser, confirm start screen loads and gameplay works unchanged.

- [ ] **Step 7: Commit**

```bash
git add src/constants.js
git commit -m "feat: add Phase 2 tuning constants for combo, power-ups, obstacles, bosses, weather"
```

---

## Task 2: Combo System

**Files:**
- Create: `src/combo.js`
- Modify: `src/hud.js`
- Modify: `src/main.js`

### Combo Module

- [ ] **Step 1: Create `src/combo.js` with core state machine**

```javascript
import {
  COMBO_TIERS,
  COMBO_DRAIN_BASE,
  COMBO_DRAIN_MULTIPLIERS,
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

export function getComboMeter() {
  return meter;
}

export function getComboTierIndex() {
  for (let i = COMBO_TIERS.length - 1; i >= 0; i--) {
    if (meter >= COMBO_TIERS[i].threshold) return i;
  }
  return 0;
}

export function getComboTier() {
  return COMBO_TIERS[getComboTierIndex()];
}

export function getComboMultiplier() {
  return getComboTier().multiplier;
}

export function fillCombo(amount) {
  meter = Math.min(1, meter + amount);
  const tierIdx = getComboTierIndex();
  if (tierIdx > lastTier) {
    lastTier = tierIdx;
    if (onTierUp) onTierUp(COMBO_TIERS[tierIdx]);
    // Check earned ability charges
    if (tierIdx >= 2 && !slowTimeCharged) slowTimeCharged = true; // Lion
    if (tierIdx >= 4 && !rushCharged) rushCharged = true; // Übermensch
  }
}

export function resetCombo() {
  meter = 0;
  lastTier = 0;
}

export function updateCombo(delta) {
  if (drainPaused || meter <= 0) return;
  const tierIdx = getComboTierIndex();
  const drainRate = COMBO_DRAIN_BASE * COMBO_DRAIN_MULTIPLIERS[tierIdx];
  meter = Math.max(0, meter - drainRate * delta);
  // Update tier (may have dropped)
  const newTier = getComboTierIndex();
  if (newTier < lastTier) lastTier = newTier;
}

export function setDrainPaused(paused) {
  drainPaused = paused;
}

export function isSlowTimeCharged() {
  return slowTimeCharged;
}

export function isRushCharged() {
  return rushCharged;
}

export function consumeSlowTimeCharge() {
  slowTimeCharged = false;
}

export function consumeRushCharge() {
  rushCharged = false;
}

export function cleanupCombo() {
  meter = 0;
  lastTier = 0;
  slowTimeCharged = false;
  rushCharged = false;
}
```

- [ ] **Step 2: Add combo HUD elements to `src/hud.js`**

Add after the existing `createHUD` function's dread timer bar creation. Add new DOM elements for the combo bar:

In `createHUD(onPause)`, after the dread timer bar HTML, add:

```javascript
// Combo bar (bottom-center)
const comboContainer = document.createElement('div');
comboContainer.id = 'combo-container';
comboContainer.innerHTML = `
  <div id="combo-label">MORTAL — 1.0x</div>
  <div id="combo-bar">
    <div id="combo-fill"></div>
  </div>
`;
document.body.appendChild(comboContainer);
```

Add new export functions:

```javascript
export function updateComboBar(meter, tier) {
  const label = document.getElementById('combo-label');
  const fill = document.getElementById('combo-fill');
  const container = document.getElementById('combo-container');
  if (!label || !fill || !container) return;

  label.textContent = `${tier.name} — ${tier.multiplier}x`;
  label.style.color = tier.color;
  fill.style.width = `${meter * 100}%`;
  fill.style.background = `linear-gradient(90deg, ${tier.color}88, ${tier.color})`;

  // Pulse at Übermensch
  container.classList.toggle('combo-pulse', tier.name === 'Übermensch');
}

export function flashComboTierUp(tier) {
  showToast(`${tier.name.toUpperCase()} — ${tier.multiplier}x!`, 1500);
}
```

- [ ] **Step 3: Add combo bar CSS to `index.html`**

Add to the existing `<style>` block:

```css
#combo-container {
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  text-align: center;
  z-index: 100;
  pointer-events: none;
}
#combo-label {
  font-size: 11px;
  font-weight: bold;
  margin-bottom: 3px;
  color: #888;
  text-shadow: 0 1px 3px rgba(0,0,0,0.8);
}
#combo-bar {
  height: 6px;
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
  overflow: hidden;
}
#combo-fill {
  height: 100%;
  width: 0%;
  border-radius: 3px;
  transition: width 0.15s ease-out;
}
@keyframes combo-glow {
  0%, 100% { box-shadow: 0 0 8px rgba(255,215,0,0.4); }
  50% { box-shadow: 0 0 16px rgba(255,215,0,0.8); }
}
.combo-pulse #combo-bar {
  animation: combo-glow 1.5s infinite;
}
```

- [ ] **Step 4: Wire combo into game loop in `src/main.js`**

Add imports at top of main.js:

```javascript
import {
  initCombo, updateCombo, fillCombo, resetCombo, getComboMeter,
  getComboTier, getComboMultiplier, cleanupCombo,
} from './combo.js';
import { updateComboBar, flashComboTierUp } from './hud.js';
import {
  COMBO_FILL_NEAR_MISS, COMBO_FILL_FISH, COMBO_FILL_GOLDEN_FISH,
  COMBO_FILL_NO_DAMAGE_100M,
} from './constants.js';
```

In `startGame()`, after existing resets:

```javascript
initCombo({ onTierUp: flashComboTierUp });
```

In the game loop, after updating dread (~line 287), add:

```javascript
// Update combo meter
updateCombo(delta);
updateComboBar(getComboMeter(), getComboTier());
```

Replace the score calculation (~line 279) to use combo multiplier:

```javascript
const comboMult = getComboMultiplier();
const dreadScoreMult = isDreadActive() ? DREAD_MULTIPLIER : 1;
score += speed * delta * POINTS_PER_METER * comboMult * dreadScoreMult;
```

In the collision/damage handler (~line 302-326), after applying damage:

```javascript
resetCombo();
```

In the near-miss detection section, after showing "CLOSE!" toast:

```javascript
fillCombo(COMBO_FILL_NEAR_MISS);
```

In the fish pickup handler (~line 355):

```javascript
fillCombo(COMBO_FILL_FISH);
```

In the golden fish pickup handler (~line 366):

```javascript
fillCombo(COMBO_FILL_GOLDEN_FISH);
```

Add a no-damage distance tracker. In state variables:

```javascript
let lastDamageDistanceForCombo = 0;
```

Reset it in `startGame()` and on damage. In the game loop:

```javascript
if (distance - lastDamageDistanceForCombo >= 100) {
  fillCombo(COMBO_FILL_NO_DAMAGE_100M);
  lastDamageDistanceForCombo = distance - (distance - lastDamageDistanceForCombo) % 100;
}
```

On damage:

```javascript
lastDamageDistanceForCombo = distance;
```

In `gameOver()`:

```javascript
cleanupCombo();
```

- [ ] **Step 5: Verify combo system visually**

Run: `npx vite` — play the game. Verify:
- Combo bar appears at bottom-center
- Picking up fish fills the meter slightly
- Near-misses fill the meter significantly
- Meter drains when idle
- Getting hit resets meter to 0
- Tier-up toasts appear ("CAMEL — 1.5x!", "LION — 2.5x!", etc.)
- Score increases faster at higher tiers

- [ ] **Step 6: Commit**

```bash
git add src/combo.js src/hud.js src/main.js index.html
git commit -m "feat: add combo system with Nietzsche-themed tiers and HUD bar"
```

---

## Task 3: Power-Up Manager Framework

**Files:**
- Create: `src/powerups.js`
- Modify: `src/hud.js`
- Modify: `src/controls.js`
- Modify: `src/main.js`

### Power-Up Manager

- [ ] **Step 1: Create `src/powerups.js` with framework**

```javascript
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
```

- [ ] **Step 2: Add power-up HUD elements to `src/hud.js`**

Add new DOM elements for power-up icons (bottom-left) and earned ability button (bottom-right).

In `createHUD(onPause)`:

```javascript
// Power-up icons (bottom-left)
const powerupIcons = document.createElement('div');
powerupIcons.id = 'powerup-icons';
powerupIcons.innerHTML = `
  <div class="powerup-icon" id="pu-shield" style="display:none">
    <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="currentColor"/></svg>
    <svg class="pu-ring" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="100" stroke-dashoffset="0"/></svg>
  </div>
  <div class="powerup-icon" id="pu-magnet" style="display:none">
    <svg viewBox="0 0 24 24" width="20" height="20"><path d="M3 7v6a9 9 0 0018 0V7h-4v6a5 5 0 01-10 0V7H3z" fill="currentColor"/></svg>
    <svg class="pu-ring" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="100" stroke-dashoffset="0"/></svg>
  </div>
`;
document.body.appendChild(powerupIcons);

// Earned ability button (bottom-right)
const abilityBtn = document.createElement('button');
abilityBtn.id = 'ability-btn';
abilityBtn.style.display = 'none';
abilityBtn.textContent = '⏳';
document.body.appendChild(abilityBtn);
```

Add update functions:

```javascript
export function updatePowerupIcons(effects) {
  const shield = document.getElementById('pu-shield');
  const magnet = document.getElementById('pu-magnet');
  if (shield) {
    shield.style.display = effects.shield ? 'flex' : 'none';
    if (effects.shield) {
      const ring = shield.querySelector('.pu-ring circle');
      if (ring) ring.style.strokeDashoffset = (1 - effects.shieldTimer / 20) * 100;
    }
  }
  if (magnet) {
    magnet.style.display = effects.magnet ? 'flex' : 'none';
    if (effects.magnet) {
      const ring = magnet.querySelector('.pu-ring circle');
      if (ring) ring.style.strokeDashoffset = (1 - effects.magnetTimer / 8) * 100;
    }
  }
}

export function updateAbilityButton(slowTimeCharged, rushCharged, selected) {
  const btn = document.getElementById('ability-btn');
  if (!btn) return;
  const hasAny = slowTimeCharged || rushCharged;
  btn.style.display = hasAny ? 'flex' : 'none';
  if (!hasAny) return;

  if (slowTimeCharged && rushCharged) {
    btn.textContent = selected === 'slowTime' ? '⏳' : '⚡';
    btn.className = 'ability-dual';
  } else if (rushCharged) {
    btn.textContent = '⚡';
    btn.className = 'ability-rush';
  } else {
    btn.textContent = '⏳';
    btn.className = 'ability-slow';
  }
}
```

- [ ] **Step 3: Add power-up HUD CSS to `index.html`**

```css
#powerup-icons {
  position: fixed;
  bottom: 44px;
  left: 12px;
  display: flex;
  gap: 6px;
  z-index: 100;
  pointer-events: none;
}
.powerup-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid currentColor;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
#pu-shield { color: #64c8ff; background: rgba(100,200,255,0.2); }
#pu-magnet { color: #00e5ff; background: rgba(0,229,255,0.2); }
.pu-ring {
  position: absolute;
  top: -3px; left: -3px;
  width: 38px; height: 38px;
  transform: rotate(-90deg);
}
.pu-ring circle { transition: stroke-dashoffset 0.2s linear; }

#ability-btn {
  position: fixed;
  bottom: 40px;
  right: 12px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid #fff;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  background: radial-gradient(circle, #555, #333);
  color: #fff;
  touch-action: manipulation;
}
.ability-slow { background: radial-gradient(circle, #6a5acd, #483d8b) !important; }
.ability-rush { background: radial-gradient(circle, #ffd700, #ff8c00) !important; box-shadow: 0 0 12px rgba(255,215,0,0.6); }
.ability-dual { background: radial-gradient(circle, #ffd700, #ff8c00) !important; box-shadow: 0 0 16px rgba(255,215,0,0.8); }
```

- [ ] **Step 4: Add ability activation to `src/controls.js`**

Add `KeyE` to the keyboard handler alongside the existing key bindings (~line 42):

```javascript
case 'KeyE':
  callbacks.onAbility?.();
  break;
```

Add ability button touch event. After `initControls` sets up keyboard and swipe handlers, add:

```javascript
// Earned ability button
const abilityBtn = document.getElementById('ability-btn');
if (abilityBtn) {
  let holdTimer = null;
  let held = false;
  abilityBtn.addEventListener('pointerdown', () => {
    held = false;
    holdTimer = setTimeout(() => { held = true; callbacks.onAbilityHold?.(); }, 500);
  });
  abilityBtn.addEventListener('pointerup', () => {
    clearTimeout(holdTimer);
    if (!held) callbacks.onAbility?.();
  });
  abilityBtn.addEventListener('pointerleave', () => clearTimeout(holdTimer));
}
```

- [ ] **Step 5: Wire power-up manager into `src/main.js`**

Add imports:

```javascript
import {
  initPowerups, updatePowerups, getActiveEffects, getSpeedMultiplier,
  getScoreMultiplier, isShieldActive, hitShield, isInvincibleFromPowerup,
  isMagnetActive, isDiscoActive, activateSlowTime, activateRush,
  cycleAbility, getSelectedAbility, cleanupPowerups,
} from './powerups.js';
import {
  isSlowTimeCharged, isRushCharged, consumeSlowTimeCharge, consumeRushCharge,
} from './combo.js';
import { updatePowerupIcons, updateAbilityButton } from './hud.js';
```

In `startGame()`:

```javascript
initPowerups({
  onShieldBreak: () => { /* will add particles in Task 4 */ },
  onDiscoStart: () => { /* will add disco visuals in Task 5 */ },
  onDiscoEnd: () => { /* will add disco cleanup in Task 5 */ },
  onEffectStart: (key) => { /* will add visuals per power-up in Task 4 */ },
  onEffectEnd: (key) => { /* will add cleanup per power-up in Task 4 */ },
});
```

In the game loop, after combo update:

```javascript
// Update power-ups
updatePowerups(delta);
const effects = getActiveEffects();
updatePowerupIcons(effects);
updateAbilityButton(isSlowTimeCharged(), isRushCharged(), getSelectedAbility());
```

Update speed calculation to include power-up slow-time:

```javascript
const powerupSpeedMult = getSpeedMultiplier();
const currentSpeed = speed * dreadMul * powerupSpeedMult;
```

Update score calculation to include power-up multiplier:

```javascript
const powerupScoreMult = getScoreMultiplier();
score += speed * delta * POINTS_PER_METER * comboMult * dreadScoreMult * powerupScoreMult;
```

In collision/damage handler, before applying damage, check shield:

```javascript
if (isShieldActive()) {
  if (hitShield()) continue; // shield absorbed the hit
}
if (isInvincibleFromPowerup()) continue; // rush/disco invincibility
```

Add ability activation callbacks to `initControls`:

```javascript
onAbility: () => {
  if (gameState !== 'playing') return;
  const sel = getSelectedAbility();
  if (sel === 'slowTime' && isSlowTimeCharged() && !effects.slowTime) {
    consumeSlowTimeCharge();
    activateSlowTime();
  } else if (sel === 'rush' && isRushCharged() && !effects.rush) {
    consumeRushCharge();
    activateRush();
  }
},
onAbilityHold: () => {
  // Same as onAbility — hold confirms the selected ability
  // (tap cycles in the HUD update, hold activates)
},
```

Wait — looking at the design spec again, tap cycles and hold activates. Let me adjust:

```javascript
onAbility: () => {
  // Tap cycles selected ability when both charged
  if (gameState !== 'playing') return;
  if (isSlowTimeCharged() && isRushCharged()) {
    cycleAbility();
  } else {
    // Only one charged — activate it
    activateSelectedAbility();
  }
},
onAbilityHold: () => {
  if (gameState !== 'playing') return;
  activateSelectedAbility();
},
```

Add helper in main.js:

```javascript
function activateSelectedAbility() {
  const sel = getSelectedAbility();
  const effects = getActiveEffects();
  if (sel === 'slowTime' && isSlowTimeCharged() && !effects.slowTime) {
    consumeSlowTimeCharge();
    activateSlowTime();
  } else if (sel === 'rush' && isRushCharged() && !effects.rush) {
    consumeRushCharge();
    activateRush();
  }
}
```

In `gameOver()`:

```javascript
cleanupPowerups();
```

- [ ] **Step 6: Verify power-up framework visually**

Run: `npx vite` — play the game. Verify:
- Power-up icons area exists but is hidden (no pickups yet)
- Ability button appears when combo reaches Lion tier (slow-time charges)
- Pressing E activates slow-time (world slows for 5s)
- Reaching Übermensch tier charges rush
- Score multipliers apply correctly
- Game still functions normally with all the new wiring

- [ ] **Step 7: Commit**

```bash
git add src/powerups.js src/hud.js src/controls.js src/main.js index.html
git commit -m "feat: add power-up manager framework with earned abilities and HUD"
```

---

## Task 4: Individual Power-Up Visuals & Collectible Pickups

**Files:**
- Modify: `src/collectibles.js`
- Modify: `src/powerups.js`
- Modify: `src/particles.js`
- Modify: `src/penguin.js`
- Modify: `src/main.js`
- Modify: `src/constants.js`

- [ ] **Step 1: Add shield and magnet collectible types to `src/collectibles.js`**

Add to the spawn logic, after the existing orb/quote/golden/fish chance checks. Shield and magnet should roll before regular fish:

```javascript
// In spawnCollectibles, after orb check, before quote check:
if (shieldCooldownTimer <= 0 && Math.random() < SHIELD_SPAWN_CHANCE) {
  spawnShieldPickup(scene, baseZ, availableLane);
  shieldCooldownTimer = SHIELD_COOLDOWN;
  return;
}
if (magnetCooldownTimer <= 0 && Math.random() < MAGNET_SPAWN_CHANCE) {
  spawnMagnetPickup(scene, baseZ, availableLane);
  magnetCooldownTimer = MAGNET_COOLDOWN;
  return;
}
```

Add module-level cooldown timers:

```javascript
let shieldCooldownTimer = 0;
let magnetCooldownTimer = 0;
```

Decrement them in `updateCollectibles(delta)`:

```javascript
if (shieldCooldownTimer > 0) shieldCooldownTimer -= delta;
if (magnetCooldownTimer > 0) magnetCooldownTimer -= delta;
```

Add mesh creation functions:

```javascript
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
  const mesh = createShieldPickupMesh();
  mesh.position.set(LANE_POSITIONS[lane], TERRAIN_Y + FISH_FLOAT_HEIGHT, baseZ);
  scene.add(mesh);
  activeCollectibles.push({ mesh, type: 'shield', lane, collected: false, collectTime: 0 });
}

function spawnMagnetPickup(scene, baseZ, lane) {
  const mesh = createMagnetPickupMesh();
  mesh.position.set(LANE_POSITIONS[lane], TERRAIN_Y + FISH_FLOAT_HEIGHT, baseZ);
  scene.add(mesh);
  activeCollectibles.push({ mesh, type: 'magnet', lane, collected: false, collectTime: 0 });
}
```

Add shield/magnet to `checkCollectiblePickup` return handling — they already return as `{ type: 'shield' }` or `{ type: 'magnet' }` since they use the same `activeCollectibles` array and pickup detection logic.

Reset cooldowns in `clearCollectibles`:

```javascript
shieldCooldownTimer = 0;
magnetCooldownTimer = 0;
```

- [ ] **Step 2: Add magnet pull behavior to `src/collectibles.js`**

Export a new function for magnet pull:

```javascript
export function applyMagnetPull(playerLane, delta) {
  const playerX = LANE_POSITIONS[playerLane];
  for (const c of activeCollectibles) {
    if (c.collected || (c.type !== 'fish' && c.type !== 'goldenFish')) continue;
    // Pull fish from adjacent lanes
    const dx = Math.abs(c.mesh.position.x - playerX);
    if (dx > 0.5 && dx < LANE_WIDTH * 2) {
      const dir = playerX > c.mesh.position.x ? 1 : -1;
      c.mesh.position.x += dir * (LANE_WIDTH / MAGNET_PULL_SPEED) * delta;
    }
  }
}
```

Export a function for disco auto-collect:

```javascript
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
```

- [ ] **Step 3: Add shield visual attachment to `src/penguin.js`**

Add a shield sphere that can be shown/hidden:

```javascript
let shieldMesh = null;

export function showShieldVisual(penguinGroup) {
  if (shieldMesh) return;
  const geo = new THREE.SphereGeometry(1.0, 16, 12);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x64c8ff, transparent: true, opacity: 0.2,
    emissive: 0x64c8ff, emissiveIntensity: 0.2,
    side: THREE.DoubleSide,
  });
  shieldMesh = new THREE.Mesh(geo, mat);
  shieldMesh.position.y = 0.6;
  penguinGroup.add(shieldMesh);
}

export function hideShieldVisual(penguinGroup) {
  if (!shieldMesh) return;
  penguinGroup.remove(shieldMesh);
  shieldMesh.geometry.dispose();
  shieldMesh.material.dispose();
  shieldMesh = null;
}

export function updateShieldVisual(delta) {
  if (!shieldMesh) return;
  shieldMesh.rotation.y += delta * 0.5;
}
```

Add a drift function for blizzard weather (used in Task 7):

```javascript
export function applyDrift(dx) {
  if (!penguinGroup) return;
  penguinGroup.position.x += dx;
  // Clamp to lane boundaries
  const minX = LANE_POSITIONS[0] - LANE_WIDTH * 0.4;
  const maxX = LANE_POSITIONS[2] + LANE_WIDTH * 0.4;
  penguinGroup.position.x = Math.max(minX, Math.min(maxX, penguinGroup.position.x));
}
```

- [ ] **Step 4: Add shield shatter and magnet vortex particle configs to `src/constants.js`**

```javascript
// Power-up Particles
export const SHIELD_SHATTER_PARTICLES = { count: 16, color: 0x64c8ff, duration: 0.4, speed: 4, type: 'burst' };
export const MAGNET_VORTEX_PARTICLES = { count: 8, color: 0x00e5ff, duration: 0.3, speed: 2, type: 'spiral' };
export const RUSH_ACTIVATE_PARTICLES = { count: 20, color: 0xffd700, duration: 0.5, speed: 5, type: 'burst' };
export const SLOW_TIME_PARTICLES = { count: 12, color: 0x6a5acd, duration: 0.4, speed: 3, type: 'spiral' };
```

- [ ] **Step 5: Wire power-up pickups into `src/main.js`**

In the collectible pickup handler (the `for (const pickup of pickups)` loop), add cases:

```javascript
if (pickup.type === 'shield') {
  activateShield();
  showShieldVisual(getPenguinGroup());
  emitParticles({ ...SHIELD_SHATTER_PARTICLES, position: penguinPos.clone() });
  showToast('ETERNAL SHIELD', 1500);
}
if (pickup.type === 'magnet') {
  activateMagnet();
  emitParticles({ ...MAGNET_VORTEX_PARTICLES, position: penguinPos.clone() });
  showToast('FISH MAGNET', 1500);
}
```

In the game loop, when magnet is active:

```javascript
if (isMagnetActive()) {
  applyMagnetPull(getCurrentLane(), delta);
}
```

Update the shield break callback in `initPowerups`:

```javascript
onShieldBreak: () => {
  hideShieldVisual(getPenguinGroup());
  emitParticles({ ...SHIELD_SHATTER_PARTICLES, position: getPenguinGroup().position.clone() });
  showToast('SHIELD SHATTERED', 1000);
},
onEffectEnd: (key) => {
  if (key === 'shield') hideShieldVisual(getPenguinGroup());
},
```

Add slow-time and rush activation particle effects in the `activateSelectedAbility` function:

```javascript
if (sel === 'slowTime' && ...) {
  consumeSlowTimeCharge();
  activateSlowTime();
  emitParticles({ ...SLOW_TIME_PARTICLES, position: getPenguinGroup().position.clone() });
  showToast('ETERNAL RECURRENCE', 1500);
} else if (sel === 'rush' && ...) {
  consumeRushCharge();
  activateRush();
  emitParticles({ ...RUSH_ACTIVATE_PARTICLES, position: getPenguinGroup().position.clone() });
  showToast('ÜBERMENSCH RUSH!', 1500);
}
```

- [ ] **Step 6: Add slow-time visual filter**

In `src/scene.js`, add a desaturation overlay:

```javascript
let slowTimeOverlay = null;

export function showSlowTimeFilter() {
  if (slowTimeOverlay) return;
  slowTimeOverlay = document.createElement('div');
  slowTimeOverlay.id = 'slow-time-overlay';
  slowTimeOverlay.style.cssText = `
    position:fixed;inset:0;z-index:50;pointer-events:none;
    background:rgba(106,90,205,0.15);
    mix-blend-mode:color;
    transition:opacity 0.3s;
  `;
  document.body.appendChild(slowTimeOverlay);
}

export function hideSlowTimeFilter() {
  if (!slowTimeOverlay) return;
  slowTimeOverlay.remove();
  slowTimeOverlay = null;
}
```

Wire into powerup callbacks:

```javascript
onEffectStart: (key) => {
  if (key === 'slowTime') showSlowTimeFilter();
  if (key === 'shield') showShieldVisual(getPenguinGroup());
},
onEffectEnd: (key) => {
  if (key === 'slowTime') hideSlowTimeFilter();
  if (key === 'shield') hideShieldVisual(getPenguinGroup());
},
```

- [ ] **Step 7: Verify all power-ups visually**

Run: `npx vite`. Verify:
- Shield pickups appear on path (icy icosahedron), collecting one shows shield sphere around penguin
- Getting hit with shield active shatters it (particles) and absorbs damage
- Magnet pickups appear (torus), collecting one pulls fish from adjacent lanes
- Reaching Lion tier charges slow-time — button appears, pressing E activates, world slows
- Reaching Übermensch charges rush — golden button, activating gives golden glow + invincibility
- Score multipliers stack correctly

- [ ] **Step 8: Commit**

```bash
git add src/collectibles.js src/powerups.js src/penguin.js src/particles.js src/scene.js src/constants.js src/main.js
git commit -m "feat: add shield, magnet, slow-time, and übermensch rush power-ups"
```

---

## Task 5: Disco Mode Detection & Visuals

**Files:**
- Modify: `src/powerups.js` (detection already in place)
- Modify: `src/scene.js`
- Modify: `src/aurora.js`
- Modify: `src/main.js`
- Modify: `src/dread.js`

- [ ] **Step 1: Add disco visual effects to `src/scene.js`**

```javascript
let discoStrobeTimer = 0;
let discoStrobeColors = [0xff0040, 0x00ff80, 0x4080ff, 0xffff00, 0xff00ff, 0x00ffff];
let discoColorIndex = 0;
let discoTrailPoints = [];
let discoTrailMesh = null;

export function startDiscoVisuals(scene) {
  discoStrobeTimer = 0;
  discoColorIndex = 0;

  // Path glow overlay
  const overlay = document.createElement('div');
  overlay.id = 'disco-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:45;pointer-events:none;opacity:0;
    transition:opacity 0.3s;
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.style.opacity = '1');
}

export function updateDiscoVisuals(delta, scene, directionalLight) {
  discoStrobeTimer += delta;
  if (discoStrobeTimer >= DISCO_STROBE_INTERVAL) {
    discoStrobeTimer = 0;
    discoColorIndex = (discoColorIndex + 1) % discoStrobeColors.length;
    const color = discoStrobeColors[discoColorIndex];
    directionalLight.color.setHex(color);
    directionalLight.intensity = 1.2;

    const overlay = document.getElementById('disco-overlay');
    if (overlay) {
      overlay.style.background = `radial-gradient(circle, ${new THREE.Color(color).getStyle()}22, transparent 70%)`;
    }
  }
}

export function stopDiscoVisuals(scene, directionalLight) {
  directionalLight.color.setHex(0xffffff);
  directionalLight.intensity = 0.6;
  const overlay = document.getElementById('disco-overlay');
  if (overlay) overlay.remove();
  if (discoTrailMesh) {
    scene.remove(discoTrailMesh);
    discoTrailMesh.geometry.dispose();
    discoTrailMesh.material.dispose();
    discoTrailMesh = null;
  }
}
```

Import `DISCO_STROBE_INTERVAL` from constants.

- [ ] **Step 2: Add rainbow aurora override to `src/aurora.js`**

Add a disco mode flag and rainbow cycling:

```javascript
let discoMode = false;

export function setAuroraDiscoMode(active) {
  discoMode = active;
}
```

In the existing `updateAurora(delta)`, add at the top:

```javascript
if (discoMode) {
  // Rapid rainbow hue cycling
  const hue = (performance.now() * 0.001) % 1;
  for (const ribbon of ribbons) {
    ribbon.material.uniforms.uColor1.value.setHSL(hue, 1, 0.5);
    ribbon.material.uniforms.uColor2.value.setHSL((hue + 0.33) % 1, 1, 0.5);
    ribbon.material.uniforms.uColor3.value.setHSL((hue + 0.66) % 1, 1, 0.5);
    ribbon.material.opacity = 1.0;
  }
  return; // Skip normal aurora update
}
```

- [ ] **Step 3: Wire disco callbacks in `src/main.js`**

Update the `initPowerups` callbacks:

```javascript
onDiscoStart: () => {
  startDiscoVisuals(scene);
  setAuroraDiscoMode(true);
  showToast('🪩 DISCO MODE! 🪩', 3000);
  // Track for achievements
  discoTriggeredThisRun = true;
},
onDiscoEnd: () => {
  stopDiscoVisuals(scene, directionalLight);
  setAuroraDiscoMode(false);
},
```

Add `let discoTriggeredThisRun = false;` to state variables, reset in `startGame()`.

In the game loop, when disco is active, auto-collect all fish:

```javascript
if (isDiscoActive()) {
  const discoPickups = autoCollectAllFish(penguinPos, scene);
  for (const p of discoPickups) {
    if (p.type === 'fish') { fishCount++; score += FISH_POINTS * DISCO_SCORE_MULTIPLIER; }
    if (p.type === 'goldenFish') { goldenFishCount++; score += GOLDEN_FISH_POINTS * DISCO_SCORE_MULTIPLIER; }
  }
  updateDiscoVisuals(delta, scene, directionalLight);
}
```

- [ ] **Step 4: Add disco override to `src/dread.js`**

In `updateDread`, check if disco is active and skip dread visuals:

```javascript
import { isDiscoActive } from './powerups.js';

// At top of updateDread():
if (isDiscoActive()) return; // Disco overrides everything
```

- [ ] **Step 5: Verify disco mode**

This is hard to trigger naturally. For testing, temporarily lower the combo thresholds and power-up cooldowns in constants.js, or add a debug key that activates all 4 power-ups. Verify:
- All 4 active → rainbow aurora, strobe lights, "DISCO MODE!" toast
- Score shows 10x multiplier
- All fish on screen auto-collect
- Penguin is invincible
- Effect ends when any power-up expires
- Normal visuals restore cleanly

Remove any debug shortcuts after testing.

- [ ] **Step 6: Commit**

```bash
git add src/scene.js src/aurora.js src/powerups.js src/dread.js src/main.js
git commit -m "feat: add disco mode with rainbow aurora and strobe visuals"
```

---

## Task 6: New Obstacle Types

**Files:**
- Modify: `src/obstacles.js`
- Modify: `src/collision.js`
- Modify: `src/constants.js` (already done in Task 1)
- Modify: `src/main.js`

This is the largest single task. Break into sub-steps per obstacle type.

- [ ] **Step 1: Rework icicles → ice spike in `src/obstacles.js`**

Replace the icicle mesh creation with ice spike. In `createObstacleMesh`, replace the `icicles` case:

```javascript
case 'iceSpike': {
  const group = new THREE.Group();
  // Main spike body — tall jagged cone
  const spikeGeo = new THREE.ConeGeometry(0.5, ICE_SPIKE_HEIGHT, 6);
  const spikeMat = new THREE.MeshStandardMaterial({
    color: 0x88ccee, transparent: true, opacity: 0.85,
    emissive: 0x225588, emissiveIntensity: 0.2,
  });
  const spike = new THREE.Mesh(spikeGeo, spikeMat);
  spike.position.y = ICE_SPIKE_HEIGHT / 2;
  group.add(spike);
  // Frost trail (small flat plane behind)
  const trailGeo = new THREE.PlaneGeometry(0.3, 2);
  const trailMat = new THREE.MeshStandardMaterial({
    color: 0xaaddff, transparent: true, opacity: 0.3, side: THREE.DoubleSide,
  });
  const trail = new THREE.Mesh(trailGeo, trailMat);
  trail.rotation.x = -Math.PI / 2;
  trail.position.y = 0.05;
  trail.position.z = 1.5;
  group.add(trail);
  return { mesh: group, height: ICE_SPIKE_HEIGHT, type: 'ground', typeName: 'iceSpike' };
}
```

Update the `obstacleTypes` array: replace `'icicles'` with `'iceSpike'`.

In `updateObstacles`, add ice spike speed multiplier (similar to snowball):

```javascript
if (obs.typeName === 'iceSpike') {
  obs.mesh.position.z += speed * ICE_SPIKE_SPEED_MULT * delta;
} else if (obs.typeName === 'snowball') {
  obs.mesh.position.z += speed * SNOWBALL_SPEED_MULT * delta;
}
```

- [ ] **Step 2: Add ice wall obstacle**

In `createObstacleMesh`, add:

```javascript
case 'iceWall': {
  const group = new THREE.Group();
  // Wall spans 2 lanes — width = LANE_WIDTH * 2 + gap
  const wallGeo = new THREE.BoxGeometry(LANE_WIDTH * 2.2, ICE_WALL_HEIGHT, 0.5);
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x99ccdd, transparent: true, opacity: 0.7,
    emissive: 0x446688, emissiveIntensity: 0.15,
  });
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.y = ICE_WALL_HEIGHT / 2;
  group.add(wall);
  // Frost vein decorations
  const veinGeo = new THREE.BoxGeometry(LANE_WIDTH * 2, 0.05, 0.52);
  const veinMat = new THREE.MeshStandardMaterial({ color: 0xbbddee, emissive: 0xbbddee, emissiveIntensity: 0.3 });
  for (let i = 0; i < 3; i++) {
    const vein = new THREE.Mesh(veinGeo, veinMat);
    vein.position.y = 0.5 + i * 0.8;
    vein.rotation.z = (Math.random() - 0.5) * 0.1;
    group.add(vein);
  }
  return { mesh: group, height: ICE_WALL_HEIGHT, type: 'ground', typeName: 'iceWall' };
}
```

Add a custom spawn function for ice wall since it spans 2 lanes:

```javascript
function spawnIceWall(scene, worldZ) {
  // Pick which lane is open (0, 1, or 2)
  const openLane = Math.floor(Math.random() * 3);
  const { mesh, height, type, typeName } = createObstacleMesh('iceWall');
  // Center the wall between the two blocked lanes
  const blockedLanes = [0, 1, 2].filter(l => l !== openLane);
  const centerX = (LANE_POSITIONS[blockedLanes[0]] + LANE_POSITIONS[blockedLanes[1]]) / 2;
  mesh.position.set(centerX, TERRAIN_Y, worldZ);
  scene.add(mesh);
  activeObstacles.push({ mesh, height, type, typeName, lane: -1, openLane });
}
```

Update collision for ice wall in `src/collision.js` — ice wall uses wider hitbox:

```javascript
// In checkCollision, add special case for iceWall:
if (obstacle.typeName === 'iceWall') {
  // Wall blocks 2 lanes. Player is safe only in openLane.
  const playerLaneX = penguinPos.x;
  const openX = LANE_POSITIONS[obstacle.openLane];
  if (Math.abs(playerLaneX - openX) < LANE_WIDTH * 0.45) return false; // in open lane
  // Otherwise check Z overlap
  const dz = Math.abs(penguinPos.z - obstacle.mesh.position.z);
  return dz < 1.0;
}
```

- [ ] **Step 3: Add crevasse obstacle**

In `createObstacleMesh`:

```javascript
case 'crevasse': {
  const group = new THREE.Group();
  // Dark crack in the ground
  const crackGeo = new THREE.PlaneGeometry(LANE_WIDTH * 0.9, 2);
  const crackMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a2e, emissive: 0x1a1a4e, emissiveIntensity: 0.4,
    side: THREE.DoubleSide,
  });
  const crack = new THREE.Mesh(crackGeo, crackMat);
  crack.rotation.x = -Math.PI / 2;
  crack.position.y = 0.02; // just above ground
  group.add(crack);
  // Blue glow from below
  const glowGeo = new THREE.PlaneGeometry(LANE_WIDTH * 0.6, 1.5);
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x4488ff, emissive: 0x4488ff, emissiveIntensity: 0.6,
    transparent: true, opacity: 0.4, side: THREE.DoubleSide,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -0.1;
  group.add(glow);
  return { mesh: group, height: 0, type: 'ground', typeName: 'crevasse' };
}
```

Add crevasse collision in `src/collision.js`:

```javascript
if (obstacle.typeName === 'crevasse') {
  // Only damages if player is grounded (not jumping)
  if (penguinJumping) return false;
  const dz = Math.abs(penguinPos.z - obstacle.mesh.position.z);
  const dx = Math.abs(penguinPos.x - obstacle.mesh.position.x);
  return dz < 1.0 && dx < LANE_WIDTH * 0.45;
}
```

- [ ] **Step 4: Add wind gust obstacle**

Wind gust is different — it's not a physical mesh you collide with, it's an event that pushes the player. Add as a special obstacle type:

```javascript
case 'windGust': {
  const group = new THREE.Group();
  // Visual: horizontal snow streak particles (static mesh as placeholder)
  for (let i = 0; i < 5; i++) {
    const streakGeo = new THREE.PlaneGeometry(3, 0.08);
    const streakMat = new THREE.MeshStandardMaterial({
      color: 0xddeeff, transparent: true, opacity: 0.4 + Math.random() * 0.3,
      side: THREE.DoubleSide,
    });
    const streak = new THREE.Mesh(streakGeo, streakMat);
    streak.position.set(
      (Math.random() - 0.5) * 2,
      0.5 + Math.random() * 1.5,
      (Math.random() - 0.5) * 2
    );
    group.add(streak);
  }
  return { mesh: group, height: 0, type: 'ground', typeName: 'windGust' };
}
```

Wind gust doesn't use standard collision. In `src/main.js`, add wind gust trigger check:

```javascript
// After normal collision loop, check for wind gusts
for (const obs of getActiveObstacles()) {
  if (obs.typeName !== 'windGust' || obs.triggered) continue;
  const dz = penguinPos.z - obs.mesh.position.z;
  if (dz > -2 && dz < 2) {
    obs.triggered = true;
    // Push player one lane in wind direction
    const pushDir = obs.windDirection; // -1 or 1
    const currentLane = getCurrentLane();
    const targetLane = Math.max(0, Math.min(2, currentLane + pushDir));
    if (targetLane !== currentLane) {
      switchLane(pushDir);
      triggerScreenShake(SCREEN_SHAKE_INTENSITY_LIGHT);
    }
  }
}
```

In the spawn function, assign `windDirection`:

```javascript
function spawnWindGust(scene, worldZ) {
  const { mesh } = createObstacleMesh('windGust');
  const lane = 1; // center lane (affects all)
  mesh.position.set(LANE_POSITIONS[lane], TERRAIN_Y, worldZ);
  const windDir = Math.random() < 0.5 ? -1 : 1;
  // Rotate streaks to show wind direction
  mesh.rotation.y = windDir > 0 ? 0 : Math.PI;
  scene.add(mesh);
  activeObstacles.push({ mesh, height: 0, type: 'ground', typeName: 'windGust', lane, windDirection: windDir, triggered: false });
}
```

- [ ] **Step 5: Add philosopher's fog obstacle**

```javascript
case 'philosopherFog': {
  const group = new THREE.Group();
  // Fog volume — multiple overlapping translucent spheres
  for (let i = 0; i < 6; i++) {
    const fogGeo = new THREE.SphereGeometry(1.2 + Math.random() * 0.5, 8, 6);
    const fogMat = new THREE.MeshStandardMaterial({
      color: 0x8866aa, transparent: true, opacity: 0.15 + Math.random() * 0.1,
      emissive: 0x443366, emissiveIntensity: 0.1,
    });
    const fogBall = new THREE.Mesh(fogGeo, fogMat);
    fogBall.position.set(
      (Math.random() - 0.5) * 1.5,
      0.8 + Math.random() * 1.0,
      (Math.random() - 0.5) * PHILOSOPHER_FOG_DEPTH * 0.6
    );
    group.add(fogBall);
  }
  return { mesh: group, height: 2.5, type: 'ground', typeName: 'philosopherFog' };
}
```

Philosopher's fog doesn't directly damage — it hides whatever is inside. The spawn function should optionally place a hidden obstacle or collectible inside:

```javascript
function spawnPhilosopherFog(scene, worldZ, lane) {
  const { mesh } = createObstacleMesh('philosopherFog');
  mesh.position.set(LANE_POSITIONS[lane], TERRAIN_Y, worldZ);
  scene.add(mesh);
  activeObstacles.push({ mesh, height: 2.5, type: 'ground', typeName: 'philosopherFog', lane });

  // Roll contents: 50% collectible, 30% obstacle, 20% empty
  const roll = Math.random();
  if (roll < 0.5) {
    // Spawn a fish inside the fog
    spawnFishAt(scene, worldZ - PHILOSOPHER_FOG_DEPTH * 0.3, lane);
  } else if (roll < 0.8) {
    // Spawn an ice block inside the fog
    spawnObstacleAt(scene, worldZ - PHILOSOPHER_FOG_DEPTH * 0.3, lane, 'iceBlock');
  }
  // else: empty
}
```

Add helper `spawnObstacleAt(scene, z, lane, typeName)` and `spawnFishAt(scene, z, lane)` — similar to existing spawn functions but at specific positions.

Philosopher's fog collision: the fog itself doesn't damage. The hidden obstacle inside uses normal collision. No special collision logic needed for the fog mesh itself — skip it in the collision check:

```javascript
// In collision loop in main.js:
if (obs.typeName === 'philosopherFog' || obs.typeName === 'windGust') continue;
```

- [ ] **Step 6: Update spawn logic with distance gates and weather gates**

In `spawnObstacle`, update the type selection to respect distance gates:

```javascript
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
```

Add complex obstacle count tracking:

```javascript
function countComplexObstacles() {
  return activeObstacles.filter(o =>
    o.typeName === 'iceWall' || o.typeName === 'philosopherFog'
  ).length;
}
```

In spawn logic, skip complex types if at cap:

```javascript
let types = getAvailableObstacleTypes(distance, getCurrentWeather());
if (countComplexObstacles() >= MAX_COMPLEX_OBSTACLES) {
  types = types.filter(t => t !== 'iceWall' && t !== 'philosopherFog');
}
```

- [ ] **Step 7: Verify all new obstacles**

Run: `npx vite`. Verify each obstacle type:
- Ice spike: fast-moving, requires slide
- Ice wall: blocks 2 lanes, must find the open lane
- Crevasse: gap in path, must jump over
- Wind gust: pushes player sideways (only in blizzard/fog weather)
- Philosopher's fog: fog cloud, sometimes hides obstacles/fish inside

For testing weather-gated obstacles, temporarily force weather to blizzard or fog.

- [ ] **Step 8: Commit**

```bash
git add src/obstacles.js src/collision.js src/main.js src/collectibles.js
git commit -m "feat: add ice spike, ice wall, crevasse, wind gust, and philosopher's fog obstacles"
```

---

## Task 7: Weather Gameplay Effects

**Files:**
- Modify: `src/weather.js`
- Modify: `src/main.js`
- Modify: `src/penguin.js` (drift already added in Task 4)
- Modify: `src/obstacles.js`

- [ ] **Step 1: Add weather modifier system to `src/weather.js`**

Add a `getWeatherModifiers()` export that returns gameplay modifiers for the current weather:

```javascript
import {
  BLIZZARD_DRIFT_SPEED, BLIZZARD_DRIFT_CHANGE_MIN, BLIZZARD_DRIFT_CHANGE_MAX,
  BLIZZARD_ICE_SPIKE_SPEED_BONUS, FOG_DRAW_DISTANCE_MULT,
  CLEAR_FISH_SPAWN_BONUS, CLEAR_GOLDEN_FISH_MULT, CLEAR_SCORE_BONUS,
} from './constants.js';

let driftDirection = 0; // -1, 0, or 1
let driftChangeTimer = 0;

const WEATHER_MODIFIERS = {
  lightSnow: { drift: 0, drawDistanceMult: 1, fishSpawnBonus: 0, goldenFishMult: 1, scoreBonus: 0, iceSpikeSpeedBonus: 0 },
  blizzard: { drift: BLIZZARD_DRIFT_SPEED, drawDistanceMult: 1, fishSpawnBonus: 0, goldenFishMult: 1, scoreBonus: 0, iceSpikeSpeedBonus: BLIZZARD_ICE_SPIKE_SPEED_BONUS },
  clearAurora: { drift: 0, drawDistanceMult: 1, fishSpawnBonus: CLEAR_FISH_SPAWN_BONUS, goldenFishMult: CLEAR_GOLDEN_FISH_MULT, scoreBonus: CLEAR_SCORE_BONUS, iceSpikeSpeedBonus: 0 },
  fog: { drift: 0, drawDistanceMult: FOG_DRAW_DISTANCE_MULT, fishSpawnBonus: 0, goldenFishMult: 1, scoreBonus: 0, iceSpikeSpeedBonus: 0 },
};

export function getWeatherModifiers() {
  const weather = getCurrentWeather();
  const mods = { ...WEATHER_MODIFIERS[weather] || WEATHER_MODIFIERS.lightSnow };

  // Drift direction management (for blizzard)
  if (mods.drift > 0) {
    mods.driftDirection = driftDirection;
  } else {
    mods.driftDirection = 0;
  }
  return mods;
}

export function updateWeatherGameplay(delta) {
  const weather = getCurrentWeather();
  if (weather === 'blizzard') {
    driftChangeTimer -= delta;
    if (driftChangeTimer <= 0) {
      driftDirection = Math.random() < 0.5 ? -1 : 1;
      driftChangeTimer = BLIZZARD_DRIFT_CHANGE_MIN +
        Math.random() * (BLIZZARD_DRIFT_CHANGE_MAX - BLIZZARD_DRIFT_CHANGE_MIN);
    }
  }
}
```

- [ ] **Step 2: Wire weather modifiers into `src/main.js`**

In the game loop, after updating weather:

```javascript
import { getWeatherModifiers, updateWeatherGameplay } from './weather.js';
import { applyDrift } from './penguin.js';

// In game loop:
updateWeatherGameplay(delta);
const weatherMods = getWeatherModifiers();

// Apply blizzard drift
if (weatherMods.drift > 0 && weatherMods.driftDirection !== 0) {
  applyDrift(weatherMods.driftDirection * weatherMods.drift * delta);
}

// Apply weather score bonus
const weatherScoreBonus = 1 + weatherMods.scoreBonus;
// Update score line to include it:
score += speed * delta * POINTS_PER_METER * comboMult * dreadScoreMult * powerupScoreMult * weatherScoreBonus;
```

- [ ] **Step 3: Apply fog draw distance to obstacle visibility in `src/obstacles.js`**

Add a draw distance modifier that affects when obstacles become visible. Export a setter:

```javascript
let drawDistanceMult = 1;

export function setObstacleDrawDistance(mult) {
  drawDistanceMult = mult;
}
```

In `updateObstacles`, apply visibility:

```javascript
// For each obstacle, hide if beyond draw distance
const visibleDistance = OBSTACLE_SPAWN_DISTANCE * drawDistanceMult;
obs.mesh.visible = (playerZ - obs.mesh.position.z) < visibleDistance;
```

Wire in main.js:

```javascript
setObstacleDrawDistance(weatherMods.drawDistanceMult);
```

- [ ] **Step 4: Apply weather fish spawn bonuses to `src/collectibles.js`**

Export a weather modifier setter:

```javascript
let fishSpawnBonus = 0;
let goldenFishMult = 1;

export function setWeatherCollectibleModifiers(bonus, goldMult) {
  fishSpawnBonus = bonus;
  goldenFishMult = goldMult;
}
```

In the spawn chance logic:

```javascript
// Replace fixed FISH_SPAWN_CHANCE with:
const effectiveFishChance = FISH_SPAWN_CHANCE * (1 + fishSpawnBonus);
const effectiveGoldenChance = GOLDEN_FISH_CHANCE * goldenFishMult;
```

Wire in main.js:

```javascript
setWeatherCollectibleModifiers(weatherMods.fishSpawnBonus, weatherMods.goldenFishMult);
```

- [ ] **Step 5: Ensure dread mode skips weather gameplay effects**

In main.js, skip weather gameplay when dread is active:

```javascript
if (!isDreadActive()) {
  updateWeatherGameplay(delta);
  const weatherMods = getWeatherModifiers();
  if (weatherMods.drift > 0 && weatherMods.driftDirection !== 0) {
    applyDrift(weatherMods.driftDirection * weatherMods.drift * delta);
  }
  setObstacleDrawDistance(weatherMods.drawDistanceMult);
  setWeatherCollectibleModifiers(weatherMods.fishSpawnBonus, weatherMods.goldenFishMult);
} else {
  setObstacleDrawDistance(1);
  setWeatherCollectibleModifiers(0, 1);
}
```

- [ ] **Step 6: Verify weather effects**

Run: `npx vite`. Force each weather type and verify:
- **Blizzard:** penguin drifts sideways, wind gusts appear, ice spikes slightly faster
- **Fog:** obstacles appear later (closer), philosopher's fog spawns, collectibles also late
- **Clear/Aurora:** more fish, more golden fish, slight score bonus
- **Light snow:** no modifiers
- **Dread mode:** no weather gameplay effects applied

- [ ] **Step 7: Commit**

```bash
git add src/weather.js src/main.js src/obstacles.js src/collectibles.js src/penguin.js
git commit -m "feat: add weather gameplay effects — drift, late reveal, bonus spawns"
```

---

## Task 8: Boss Encounter Framework

**Files:**
- Create: `src/bosses.js`
- Modify: `src/main.js`
- Modify: `src/hud.js`

- [ ] **Step 1: Create `src/bosses.js` with encounter state machine**

```javascript
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
      // Boss-specific update logic
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
  // Alternate gauntlet/chase
  const nextType = lastBossType === 'gauntlet' ? 'chase' : 'gauntlet';
  const pool = nextType === 'gauntlet' ? GAUNTLET_BOSSES : CHASE_BOSSES;
  const available = pool.filter(b => distance >= b.unlockDist);

  if (available.length === 0) {
    // No bosses available yet for this type — try the other type
    const altPool = nextType === 'gauntlet' ? CHASE_BOSSES : GAUNTLET_BOSSES;
    const altAvailable = altPool.filter(b => distance >= b.unlockDist);
    if (altAvailable.length === 0) return; // No bosses at all
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
  // Set next boss distance
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
```

- [ ] **Step 2: Add boss HUD elements to `src/hud.js`**

```javascript
export function showBossWarning(boss) {
  const warning = document.createElement('div');
  warning.id = 'boss-warning';
  warning.innerHTML = `
    <div class="boss-quote">${boss.quote}</div>
    <div class="boss-name">${boss.name}</div>
  `;
  warning.style.cssText = `
    position:fixed;inset:0;display:flex;flex-direction:column;
    align-items:center;justify-content:center;z-index:200;
    background:rgba(0,0,0,0.6);pointer-events:none;
    animation:boss-fade-in 0.5s ease-out;
  `;
  document.body.appendChild(warning);
}

export function hideBossWarning() {
  const w = document.getElementById('boss-warning');
  if (w) w.remove();
}

export function showBossHealthBar(boss) {
  const bar = document.createElement('div');
  bar.id = 'boss-bar';
  bar.innerHTML = `
    <div id="boss-bar-name">${boss.name}</div>
    <div id="boss-bar-track"><div id="boss-bar-fill"></div></div>
  `;
  document.body.appendChild(bar);
}

export function updateBossBar(progress) {
  const fill = document.getElementById('boss-bar-fill');
  if (fill) fill.style.width = `${progress * 100}%`;
}

export function hideBossBar() {
  const b = document.getElementById('boss-bar');
  if (b) b.remove();
}
```

Add boss HUD CSS:

```css
.boss-quote {
  color: #c0c0c0;
  font-size: 14px;
  font-style: italic;
  margin-bottom: 12px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.8);
}
.boss-name {
  color: #ff4444;
  font-size: 28px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 4px;
  text-shadow: 0 0 20px rgba(255,68,68,0.6);
}
@keyframes boss-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
#boss-bar {
  position: fixed;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  text-align: center;
  z-index: 150;
}
#boss-bar-name {
  color: #ff6666;
  font-size: 11px;
  font-weight: bold;
  margin-bottom: 4px;
  text-shadow: 0 1px 4px rgba(0,0,0,0.8);
}
#boss-bar-track {
  height: 4px;
  background: rgba(255,255,255,0.15);
  border-radius: 2px;
  overflow: hidden;
}
#boss-bar-fill {
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, #ff4444, #ff8844);
  border-radius: 2px;
  transition: width 0.3s linear;
}
```

- [ ] **Step 3: Wire boss framework into `src/main.js`**

Add imports and initialize in `startGame()`:

```javascript
import {
  initBosses, updateBosses, isBossActive, isBossEncounter,
  getBossState, getCurrentBoss, getBossTimer, notifyBossHit,
  cleanupBosses,
} from './bosses.js';
import {
  showBossWarning, hideBossWarning, showBossHealthBar,
  updateBossBar, hideBossBar,
} from './hud.js';
import { COMBO_FILL_BOSS_SURVIVE } from './constants.js';
```

In `startGame()`:

```javascript
initBosses(scene, {
  onBossWarning: (boss) => {
    showBossWarning(boss);
    // Pause weather effects (handled in game loop check)
  },
  onBossActive: (boss) => {
    hideBossWarning();
    showBossHealthBar(boss);
  },
  onBossDefeat: (boss, wasHit) => {
    hideBossBar();
    showToast(`${boss.name} — SURVIVED!`, 2500);
    // Combo: if hit, reset then add 25%. If clean, add 25%.
    if (wasHit) resetCombo();
    fillCombo(COMBO_FILL_BOSS_SURVIVE);
  },
});
```

In the game loop:

```javascript
// Update bosses
updateBosses(delta, distance, playerZ);
if (isBossActive()) {
  const boss = getCurrentBoss();
  const progress = getBossTimer() / boss.duration;
  updateBossBar(progress);
}
```

In the collision handler, during boss encounters:

```javascript
if (isBossActive()) notifyBossHit();
```

Skip regular obstacle spawning during boss:

```javascript
if (!isBossEncounter()) {
  // existing obstacle spawn logic
}
```

Skip weather gameplay during boss:

```javascript
if (!isBossEncounter() && !isDreadActive()) {
  // weather gameplay logic
}
```

In `gameOver()`:

```javascript
cleanupBosses();
hideBossWarning();
hideBossBar();
```

- [ ] **Step 4: Verify boss framework**

Run: `npx vite`. Temporarily set `BOSS_FIRST_DISTANCE = 100` in constants to test quickly. Verify:
- Warning screen appears with quote and boss name (2s)
- Boss bar appears during active phase
- Bar drains as timer counts down
- "SURVIVED!" toast on defeat
- Combo bonus applies after defeat
- Regular obstacles stop spawning during boss
- Weather effects pause during boss

Restore `BOSS_FIRST_DISTANCE = 2000` after testing.

- [ ] **Step 5: Commit**

```bash
git add src/bosses.js src/hud.js src/main.js index.html
git commit -m "feat: add boss encounter framework with warning, active, and defeat phases"
```

---

## Task 9: Individual Boss Scripts

**Files:**
- Modify: `src/bosses.js`
- Modify: `src/obstacles.js`
- Modify: `src/scene.js`
- Modify: `src/main.js`

Each boss needs a visual presence and a scripted obstacle pattern. Add `updateFn` to each boss definition and visual spawn/cleanup.

- [ ] **Step 1: Implement "The Last Man" gauntlet**

Add to bosses.js, in the `GAUNTLET_BOSSES` entry for lastMan:

```javascript
{
  id: 'lastMan',
  // ... existing fields ...
  updateFn: updateLastMan,
  spawnVisuals: spawnLastManVisuals,
  cleanupVisuals: cleanupLastManVisuals,
}
```

```javascript
let lastManTimer = 0;
let lastManMesh = null;

function spawnLastManVisuals(scene) {
  const group = new THREE.Group();
  // Hunched gray figure
  const bodyGeo = new THREE.CylinderGeometry(0.8, 1.2, 3, 8);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x555555, emissive: 0x222222 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 1.5;
  group.add(body);
  // Head
  const headGeo = new THREE.SphereGeometry(0.5, 8, 6);
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.position.y = 3.3;
  group.add(head);
  group.position.set(0, TERRAIN_Y, -120);
  scene.add(group);
  lastManMesh = group;
}

function cleanupLastManVisuals(scene) {
  if (lastManMesh) {
    scene.remove(lastManMesh);
    lastManMesh = null;
  }
}

function updateLastMan(delta, playerZ) {
  lastManTimer += delta;
  // Spawn ice blocks in wave patterns every 0.8s
  if (lastManTimer >= 0.8) {
    lastManTimer -= 0.8;
    // Wave: one lane is open, shifts each wave
    const openLane = Math.floor((performance.now() / 800) % 3);
    for (let lane = 0; lane < 3; lane++) {
      if (lane === openLane) continue;
      spawnBossObstacle(bossScene, playerZ - 60, lane, 'iceBlock');
    }
  }
}
```

Add `spawnBossObstacle` helper in obstacles.js and export it. In bosses.js, import it:

```javascript
import { spawnBossObstacle, getObstacleHistory } from './obstacles.js';
```

In obstacles.js:

```javascript
export function spawnBossObstacle(scene, worldZ, lane, typeName) {
  const { mesh, height, type } = createObstacleMesh(typeName);
  mesh.position.set(LANE_POSITIONS[lane], TERRAIN_Y, worldZ);
  scene.add(mesh);
  activeObstacles.push({ mesh, height, type, typeName, lane });
}
```

- [ ] **Step 2: Implement "The Abyss Serpent" chase**

```javascript
let serpentMesh = null;
let serpentDistance = 30; // distance behind player
let serpentHits = 0;

function spawnSerpentVisuals(scene) {
  const group = new THREE.Group();
  // Massive dark shape
  const bodyGeo = new THREE.SphereGeometry(4, 12, 8);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a1e, emissive: 0x1a0a2e, emissiveIntensity: 0.3,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.scale.set(1.5, 1, 2);
  group.add(body);
  // Red eyes
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
  serpentDistance = 30;
  serpentHits = 0;
}

function updateSerpent(delta, playerZ) {
  if (!serpentMesh) return;
  // Serpent gains on player
  serpentDistance -= delta * 0.8;
  serpentMesh.position.set(0, TERRAIN_Y + 2, playerZ + serpentDistance);
  // Eyes pulse
  serpentMesh.children[1].material.emissiveIntensity = 0.6 + Math.sin(performance.now() * 0.005) * 0.4;
  serpentMesh.children[2].material.emissiveIntensity = 0.6 + Math.sin(performance.now() * 0.005) * 0.4;
}

function cleanupSerpentVisuals(scene) {
  if (serpentMesh) {
    scene.remove(serpentMesh);
    serpentMesh = null;
  }
}
```

Wire serpent hit tracking — when player takes damage during serpent chase, serpent closes gap faster. If 3 hits, instant game over. This requires a check in main.js collision handler:

```javascript
if (isBossActive() && getCurrentBoss().id === 'abyssSerpent') {
  serpentHits++;
  serpentDistance -= 5; // serpent lurches closer
  if (serpentHits >= SERPENT_MAX_HITS) {
    // Caught! Instant game over
    gameOver();
    return;
  }
}
```

Export `serpentHits` or handle via boss callback.

- [ ] **Step 3: Implement "The Pale Criminal" gauntlet**

Pattern: philosopher's fog fills 2 lanes (rotating), crevasses hidden inside, wind gusts.

```javascript
let paleCriminalTimer = 0;
let paleCriminalLane = 0; // the clear lane rotates

function updatePaleCriminal(delta, playerZ) {
  paleCriminalTimer += delta;
  // Rotate clear lane every 4s
  if (paleCriminalTimer >= 4) {
    paleCriminalTimer -= 4;
    paleCriminalLane = (paleCriminalLane + 1) % 3;
  }
  // Spawn fog + hidden crevasses in the 2 blocked lanes every 2s
  if (Math.floor(paleCriminalTimer * 10) % 20 === 0) {
    for (let lane = 0; lane < 3; lane++) {
      if (lane === paleCriminalLane) continue;
      spawnBossObstacle(bossScene, playerZ - 50, lane, 'philosopherFog');
    }
    // Wind gust toward fog
    spawnBossObstacle(bossScene, playerZ - 40, 1, 'windGust');
  }
}
```

- [ ] **Step 4: Implement "The Ice Titan" chase**

Pattern: stomps every 3s (full-width crevasse), ice spikes between stomps.

```javascript
let titanStompTimer = 0;
let titanSpikeTimer = 0;

function updateIceTitan(delta, playerZ) {
  titanStompTimer += delta;
  titanSpikeTimer += delta;

  // Stomp every 3s — full-width crevasse
  if (titanStompTimer >= TITAN_STOMP_INTERVAL) {
    titanStompTimer -= TITAN_STOMP_INTERVAL;
    for (let lane = 0; lane < 3; lane++) {
      spawnBossObstacle(bossScene, playerZ - 15, lane, 'crevasse');
    }
    triggerScreenShake(SCREEN_SHAKE_INTENSITY_HEAVY);
  }

  // Ice spikes between stomps — every 1s, random lane
  if (titanSpikeTimer >= 1.0) {
    titanSpikeTimer -= 1.0;
    const lane = Math.floor(Math.random() * 3);
    spawnBossObstacle(bossScene, playerZ - 60, lane, 'iceSpike');
  }
}
```

- [ ] **Step 5: Implement "The Eternal Return" gauntlet**

This replays recent obstacles. Add an obstacle history buffer to obstacles.js:

```javascript
const obstacleHistory = []; // { typeName, lane, relativeZ }
const MAX_HISTORY = 50;

// In spawnObstacle, after creating each obstacle:
obstacleHistory.push({ typeName, lane, relativeZ: worldZ });
if (obstacleHistory.length > MAX_HISTORY) obstacleHistory.shift();

export function getObstacleHistory() {
  return obstacleHistory;
}
```

In bosses.js:

```javascript
let eternalReturnQueue = [];
let eternalReturnTimer = 0;

function startEternalReturn(playerZ) {
  const history = getObstacleHistory();
  // Compress: replay last 30 items at 1.3x speed (shorter intervals)
  eternalReturnQueue = history.slice(-30).map((h, i) => ({
    ...h,
    delay: i * 0.5, // one every 0.5s (compressed from ~1.5s normal)
  }));
  eternalReturnTimer = 0;
}

function updateEternalReturn(delta, playerZ) {
  eternalReturnTimer += delta;
  while (eternalReturnQueue.length > 0 && eternalReturnTimer >= eternalReturnQueue[0].delay) {
    const item = eternalReturnQueue.shift();
    spawnBossObstacle(bossScene, playerZ - 60, item.lane, item.typeName);
  }
}
```

- [ ] **Step 6: Wire boss visual spawning/cleanup into encounter flow**

In `startBossEncounter`, after selecting the boss:

```javascript
if (currentBoss.spawnVisuals) currentBoss.spawnVisuals(bossScene);
```

In `endBossEncounter`:

```javascript
if (currentBoss && currentBoss.cleanupVisuals) currentBoss.cleanupVisuals(bossScene);
```

Set `currentBoss.updateFn` references in the boss definition objects.

- [ ] **Step 7: Verify all 5 bosses**

Run: `npx vite`. Test each boss by temporarily adjusting unlock distances. Verify:
- **The Last Man:** ice block waves with shifting gap
- **The Abyss Serpent:** chase from behind, hits close gap, 3 hits = death
- **The Pale Criminal:** fog + crevasses + wind gusts
- **The Ice Titan:** rhythmic stomps + ice spikes
- **The Eternal Return:** replay of recent obstacles, faster

Restore original distances after testing.

- [ ] **Step 8: Commit**

```bash
git add src/bosses.js src/obstacles.js src/scene.js src/main.js
git commit -m "feat: add 5 boss encounters — Last Man, Abyss Serpent, Pale Criminal, Ice Titan, Eternal Return"
```

---

## Task 10: Achievements & Disco Skin

**Files:**
- Modify: `src/achievements.js`
- Modify: `src/skins.js`
- Modify: `src/main.js`

- [ ] **Step 1: Add 7 new achievements to `src/achievements.js`**

Add to the `MILESTONE_ACHIEVEMENTS` array:

```javascript
{
  id: 'longWalk70k', name: '70,000 Meters From Home',
  description: 'Travel 70,000m in a single run',
  flavor: 'The march continues...',
  check: (stats) => stats.distance >= 70000,
},
{
  id: 'discoMode', name: 'Dance of Eternity',
  description: 'Trigger disco mode',
  flavor: 'All four at once!',
  check: (stats) => stats.discoTriggered,
},
{
  id: 'bossSlayer', name: 'Beyond All Monsters',
  description: 'Defeat all 5 boss types',
  flavor: 'What does not kill you...',
  check: (stats) => stats.uniqueBossesDefeated >= 5,
},
{
  id: 'comboMax', name: 'The Übermensch Cometh',
  description: 'Reach Übermensch combo tier',
  flavor: 'Man is something to be surpassed.',
  check: (stats) => stats.reachedUbermensch,
},
{
  id: 'weatherSurvivor', name: 'Amor Fati',
  description: 'Survive 3 blizzards in one run',
  flavor: 'Love of fate.',
  check: (stats) => stats.blizzardsSurvived >= 3,
},
{
  id: 'shieldBreaker', name: 'Glass Philosophy',
  description: 'Break 10 shields in one run',
  flavor: 'Fragile truths.',
  check: (stats) => stats.shieldsBroken >= 10,
},
{
  id: 'noHitBoss', name: 'Untouchable',
  description: 'Defeat any boss without taking damage',
  flavor: 'Perfection in adversity.',
  check: (stats) => stats.cleanBossDefeat,
},
```

- [ ] **Step 2: Track new stats in `src/main.js`**

Add to the run state variables:

```javascript
let discoTriggeredThisRun = false;
let reachedUbermenschThisRun = false;
let blizzardsSurvivedThisRun = 0;
let shieldsBrokenThisRun = 0;
let cleanBossDefeatThisRun = false;
```

Reset all in `startGame()`.

Update the combo tier-up callback to track Übermensch:

```javascript
onTierUp: (tier) => {
  flashComboTierUp(tier);
  if (tier.name === 'Übermensch') reachedUbermenschThisRun = true;
},
```

Track shield breaks in the shield break callback:

```javascript
onShieldBreak: () => {
  shieldsBrokenThisRun++;
  // ... existing particles/visual code
},
```

Track clean boss defeats:

```javascript
onBossDefeat: (boss, wasHit) => {
  if (!wasHit) cleanBossDefeatThisRun = true;
  // ... existing combo code
},
```

Track blizzard survival. Add a weather change callback to `src/weather.js`:

```javascript
let onWeatherChange = null;

export function setWeatherChangeCallback(cb) {
  onWeatherChange = cb;
}
```

Call it when weather transitions complete (in `updateWeather`, when crossfade finishes):

```javascript
if (onWeatherChange) onWeatherChange(previousType, newType);
```

Wire in `startGame()` in main.js:

```javascript
setWeatherChangeCallback((prev, next) => {
  if (prev === 'blizzard') blizzardsSurvivedThisRun++;
});
```

Pass all new stats to `checkAchievements` in `gameOver()`:

```javascript
const runStats = {
  // ... existing stats ...
  discoTriggered: discoTriggeredThisRun,
  uniqueBossesDefeated: getAllBossesDefeated().size,
  reachedUbermensch: reachedUbermenschThisRun,
  blizzardsSurvived: blizzardsSurvivedThisRun,
  shieldsBroken: shieldsBrokenThisRun,
  cleanBossDefeat: cleanBossDefeatThisRun,
};
```

- [ ] **Step 3: Add disco penguin skin to `src/skins.js`**

Add to the `SKINS` array:

```javascript
{
  id: 'disco',
  name: 'Disco Penguin',
  desc: 'Trigger disco mode 3 times',
  colors: {
    body: 0xff00ff,
    belly: 0xffff00,
    head: 0x00ffff,
    beak: 0xff8800,
    feet: 0xff0088,
    wings: 0x8800ff,
  },
  unlock: { stat: 'totalDiscoTriggers', value: 3, label: '3 disco modes' },
  discoBall: true, // custom mesh flag
},
```

In `src/penguin.js`, add disco ball mesh for this skin in `applySkin`:

```javascript
if (skin.discoBall) {
  const ballGeo = new THREE.IcosahedronGeometry(0.15, 1);
  const ballMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc, metalness: 0.9, roughness: 0.1,
    emissive: 0xffffff, emissiveIntensity: 0.2,
  });
  const ball = new THREE.Mesh(ballGeo, ballMat);
  ball.position.y = PENGUIN_HEIGHT + 0.4;
  ball.name = 'discoBall';
  penguinGroup.add(ball);
}
```

In `updatePenguin`, rotate the disco ball if present:

```javascript
const discoBall = penguinGroup.getObjectByName('discoBall');
if (discoBall) discoBall.rotation.y += delta * 3;
```

Track `totalDiscoTriggers` in persistent stats. In `achievements.js`, add to `incrementPersistentStats`:

```javascript
if (runStats.discoTriggered) stats.totalDiscoTriggers = (stats.totalDiscoTriggers || 0) + 1;
```

- [ ] **Step 4: Verify achievements and skin unlock**

Run: `npx vite`. Use debug shortcuts to trigger specific conditions:
- Reach 70km (adjust for testing)
- Trigger disco mode → "Dance of Eternity" achievement
- Defeat all boss types → "Beyond All Monsters"
- Reach Übermensch tier → "The Übermensch Cometh"
- Check disco skin appears in gallery after 3 disco triggers

- [ ] **Step 5: Commit**

```bash
git add src/achievements.js src/skins.js src/main.js
git commit -m "feat: add 7 Phase 2 achievements and disco penguin skin"
```

---

## Final Verification

After all tasks are complete:

- [ ] **Full playthrough test** — play from start, verify all systems interact correctly:
  - Combo meter fills, drains, resets on damage
  - Shield/magnet pickups appear and work
  - Earned abilities charge and activate
  - New obstacles appear at correct distance gates
  - Weather modifiers apply (drift in blizzard, late reveal in fog, bonuses in clear)
  - Boss encounters trigger, play through, and resolve
  - Achievements unlock
  - Disco mode triggers when all 4 power-ups active (test with debug)

- [ ] **Mobile test** — verify touch controls work for ability button

- [ ] **Performance check** — ensure no frame drops with all new particle effects and obstacles
