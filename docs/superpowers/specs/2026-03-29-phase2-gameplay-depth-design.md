# Phase 2: Gameplay Depth — Design Spec

## Overview

Phase 2 transforms "Thus Waddles Zarathustra" from a visual showcase into a deep, replayable endless runner. It adds power-ups, a combo system, new obstacles, boss encounters, weather gameplay effects, and a hidden disco mode — all built on a foundation-first architecture that layers shared infrastructure before specific content.

**Approach:** Foundation-first. Build combo meter → power-up manager → boss framework → weather effects layer, then plug in individual power-ups, obstacles, bosses, and achievements.

---

## 1. Combo System

### Tiers

| Tier | Name | Multiplier | Meter Range | Color |
|------|------|-----------|-------------|-------|
| 0 | Mortal | 1.0x | 0–25% | Gray |
| 1 | Camel | 1.5x | 25–50% | Bronze (#cd7f32) |
| 2 | Lion | 2.5x | 50–75% | Silver (#c0c0c0) |
| 3 | Free Spirit | 4.0x | 75–99% | Gold (#ffd700) |
| 4 | Übermensch | 6.0x | 100% | Radiant gold, pulsing glow |

Tiers 1–3 reference Nietzsche's "Three Metamorphoses" (camel, lion, child/free spirit). Übermensch is the peak.

### Meter Mechanics

- **Fill sources:** near-miss (+15%), fish pickup (+5%), golden fish (+12%), surviving a boss phase (+25%), no-damage per 100m (+3%)
- **Drain:** -8% per second when no action is contributing. Faster drain at higher tiers (×1.0 at Camel, ×1.5 at Lion, ×2.0 at Free Spirit, ×2.5 at Übermensch)
- **Reset:** any damage drops meter to 0% and tier to Mortal
- **Score:** base score × tier multiplier at all times

### HUD (bottom-center)

- Tier name + multiplier text label above a thin progress bar
- Bar color matches current tier, smooth gradient fill
- Tier-up: brief flash + toast ("LION — 2.5x!")
- At Übermensch: bar pulses gold, subtle particle shimmer

### Module

New file: `src/combo.js`

---

## 2. Power-Up System

A power-up manager tracks active effects and cooldowns. Two categories: path pickups (spawn on path) and earned abilities (charged via combo meter).

**Stacking rule:** All power-ups can coexist. Path pickups stack with each other and with earned abilities. This enables disco mode (all 4 active at once).

### Path Pickups

**Eternal Shield:**
- Spawn chance: 3% per collectible slot
- Cooldown: 30s between spawns
- Effect: absorbs one hit, then shatters
- Duration: until hit or 20s (whichever first)
- Visual: icy crystalline sphere around penguin (translucent blue, slow rotation), shatter particle burst on break
- HUD: shield icon bottom-left, filled blue when active, timer ring drains

**Fish Magnet:**
- Spawn chance: 2.5% per collectible slot
- Cooldown: 35s between spawns
- Effect: fish from adjacent lanes curve toward player over 0.5s
- Duration: 8s
- Visual: swirling blue-white vortex particles around penguin, fish visibly arc toward you
- HUD: magnet icon bottom-left, filled cyan when active, timer ring drains

### Earned Abilities

**Slow-Time ("Eternal Recurrence"):**
- Charge source: reaching Lion tier (50% meter) banks 1 charge. Max 1 charge held.
- Activation: HUD button (bottom-right) or keyboard `E` / mobile tap
- Effect: world speed ×0.4 for 5s, player moves at normal speed
- Visual: desaturation filter, ripple distortion at edges, faint clock-tick particle pulse
- HUD: button appears with hourglass icon when charged, grayed when spent

**Übermensch Rush:**
- Charge source: reaching Übermensch tier (100% meter) banks 1 charge. Max 1 charge held.
- Activation: same HUD button area. When both charged: tap cycles the selected ability icon, hold (0.5s press) activates the selected one.
- Effect: 4s invincibility + 3x score (stacks with combo multiplier) + auto-collect all fish in all lanes
- Visual: golden glow envelops penguin, intense speed lines, golden trail particles, screen edges glow warm
- HUD: button switches to lightning icon, radiant gold pulse

### Shared Rules

- Power-ups pause during boss encounters (no cheese)
- Dread mode disables path pickup spawns (dread is its own thing)
- Active effects persist through dread — if you had shield before dread, it stays

### Module

New file: `src/powerups.js`

---

## 3. Obstacles

### Existing (unchanged)
- Ice block, snowball, tombstone, book, eternal ring

### Reworked

**Ice Spike** (replaces icicles):
- Behavior: launches from ahead at 1.6× game speed (faster than snowball's 1.4×)
- Counter: slide only — too tall to jump over
- Visual: jagged ice shard, frost trail behind it
- Hitbox: half-width 0.6, height 2.0
- Telegraph: ice-crack particles on the ground 0.8s before arrival

### New

**Ice Wall:**
- Behavior: spans 2 adjacent lanes, static (moves with terrain scroll). One lane always open.
- Counter: lane-switch to the open lane
- Visual: thick ice barrier, translucent blue-white with frost veins, ~2.5 height
- Hitbox: covers 2 lane widths, height 2.5 (can't jump, can't slide)
- Telegraph: frost shimmer on ground 1.2s before reaching player
- Spawn: not before 500m. Frequency increases with difficulty.

**Wind Gust:**
- Behavior: pushes player one lane in wind direction over 0.4s. If player is mid-lane-switch, switch completes first, then push applies. Edge lane = potential forced hit.
- Counter: pre-compensate by moving opposite, or react after push
- Visual: horizontal snow particle burst, brief screen tilt (3° for 0.3s), whoosh streaks
- Telegraph: wind particles visible 0.6s before push activates
- Spawn: weather-gated — only during blizzard and fog. Higher frequency in blizzard.
- Does NOT deal damage on its own — only dangerous if it pushes into an obstacle.

**Crevasse:**
- Behavior: gap across one lane in the path. Static.
- Counter: jump only. Running/sliding through = 1 heart damage.
- Visual: dark crack in ice, blue glow from depths, jagged edges, mist rising
- Hitbox: lane-width, triggered when player Z crosses while grounded
- Spawn: not before 300m. Never 2 in a row in same lane.

**Philosopher's Fog:**
- Behavior: fog cloud in one lane, ~15 units deep (~1s travel at base speed). Hides obstacles and collectibles inside.
- Counter: avoid (safe) or enter and react (risky, potentially rewarding)
- Visual: thick swirling fog volume, purple-gray tint, faint question mark shapes
- Spawn: weather-gated — only during fog weather. Contents: 50% collectible, 30% obstacle, 20% empty.
- Does NOT deal damage — hidden obstacle inside does.

### Spawn Rules

- Distance unlock: ice spike (0m, replaces icicles), crevasse (300m), ice wall (500m), wind gust (800m, requires blizzard/fog), philosopher's fog (800m, requires fog)
- Max 2 "complex" obstacles on screen at once (ice wall, philosopher's fog)
- Ice wall never combined with crevasse at the same Z-position
- Total obstacle types: 10

---

## 4. Boss Encounters

### Framework

New file: `src/bosses.js`

**Encounter flow:**
1. **Warning** (2s): screen darkens, Nietzsche quote flashes, boss visual cue on horizon
2. **Active phase** (12–18s): scripted obstacle/hazard patterns
3. **Defeat** (1.5s): boss retreats/dissolves, combo meter +25%, particle burst, toast with boss name + "SURVIVED"

**Timing:** First boss at 2000m. Subsequent encounters every 2500–3000m (randomized). Type alternates: gauntlet → chase → gauntlet → chase. Specific boss within type chosen randomly from unlocked pool.

**Rules during boss:**
- No regular obstacle spawns — boss controls what appears
- Collectibles still spawn (reduced rate)
- Power-up pickup spawns disabled; active effects continue
- Earned abilities usable (strategic use encouraged)
- Combo meter fills/drains normally
- Damage does NOT reset combo during boss (forgiveness window). On encounter end: if player took any damage during boss, combo resets to 0% THEN the +25% survival bonus applies (so a messy fight still gives 25% to restart with). Clean fight: +25% on top of current meter.
- Weather effects pause during boss active phase

### Demon Gauntlets (obstacle barrages from ahead)

**"The Last Man"** — unlocks at 2000m
- Theme: mediocrity dragging you down
- Pattern: rapid ice blocks in wave patterns across all 3 lanes, 1-lane gaps alternating side-to-side. Speed ×1.1. Duration: 12s.
- Visual: hunched gray figure on horizon, arms raised, ice blocks materialize where it points
- Finale: triple ice wall (1 lane open)

**"The Pale Criminal"** — unlocks at 5000m
- Theme: guilt and fog
- Pattern: philosopher's fog fills 2 lanes (rotating which is clear), crevasses hidden inside, wind gusts pushing toward fog. Duration: 15s.
- Visual: cloaked figure wreathed in purple fog, drifting ahead
- Finale: fog clears, dense collectible reward cluster

**"The Eternal Return"** — unlocks at 10000m
- Theme: everything repeats, escalating
- Pattern: replays a compressed version of the last 30s of obstacles, 1.3× faster. Duration: 18s.
- Visual: circular portal ahead, afterimage/echo effect on everything
- Finale: portal collapse, screen ripple, brief time-slow effect

### Chase Sequences (threat from behind)

**"The Abyss Serpent"** — unlocks at 3500m
- Theme: "if you gaze long into an abyss..."
- Mechanic: game speed ×1.4, higher obstacle density. Serpent gains on you over 15s. Getting hit slows you, serpent closes gap. 3 hits = caught = instant death.
- Visual: enormous dark shape behind camera, red eyes, growing ground shadow, darkening screen edges
- Victory: serpent submerges, speed normalizes

**"The Ice Titan"** — unlocks at 7000m
- Theme: overwhelming frozen force
- Mechanic: stomps every 3s creating full-width crevasse (must jump). Between stomps, ice spikes fire at ×1.8 speed. Duration: 15s.
- Visual: colossal ice figure behind camera, ground shakes on stomp, frost creeps from screen edges
- Victory: titan freezes solid, crumbles, ice particle shower

### Boss Unlock Schedule

| Distance | Boss | Type |
|----------|------|------|
| 2000m | The Last Man | Gauntlet |
| 3500m | The Abyss Serpent | Chase |
| 5000m | The Pale Criminal | Gauntlet |
| 7000m | The Ice Titan | Chase |
| 10000m | The Eternal Return | Gauntlet |

---

## 5. Weather Gameplay Effects

Extends existing weather system (`src/weather.js`). Weather still cycles every 60–90s with 5s crossfade. Each type now carries gameplay modifiers.

**Light Snow** (baseline):
- No gameplay modifiers
- Existing visuals unchanged

**Blizzard** (hazardous):
- Lateral drift: player slides 0.3 units/sec in random direction (changes every 5–8s). Player input counteracts.
- Wind gust obstacle spawns enabled
- Ice spike speed +10%
- Existing reduced visibility (fog 10/80)

**Fog** (deceptive):
- Obstacles render at 60% normal draw distance (less reaction time)
- Philosopher's fog obstacle spawns enabled
- Collectibles also render late
- No movement modifiers

**Clear / Aurora** (reward):
- Fish spawn rate +30%
- Golden fish chance doubles (5% → 10%)
- +10% base score multiplier (stacks with combo)
- Full aurora brightness, maximum visibility

**Transition rules:**
- Effects ramp during 5s crossfade (drift fades in/out, draw distance shifts)
- Dread mode overrides to blizzard visuals but uses own gameplay rules (no drift)
- Boss encounters: weather effects pause during active phase

---

## 6. Disco Mode

### Trigger

All 4 power-ups active simultaneously: shield + magnet + slow-time + übermensch rush.

### Duration

Lasts as long as all 4 remain active. Max overlap window is ~4s (übermensch rush is 4s, slow-time is 5s). Shield breaking, magnet expiring, or any effect ending kills disco.

### Effects

- **Rainbow aurora:** ribbons cycle full RGB spectrum rapidly
- **Strobe lighting:** directional light pulses between bright colors every 0.4s
- **Rainbow trail:** penguin leaves a rainbow ribbon trail
- **Path glow:** ground tiles cycle neon colors
- **Disco score:** 10x multiplier (replaces all other multipliers)
- **All fish auto-collect:** every fish on screen flies to player (beyond magnet range)
- **Invincibility:** fully invincible (shield can't break during disco)
- **Audio callback:** `onDiscoStart`/`onDiscoEnd` hooks for Phase 3 eurodance music

### Visual Priority

Disco is the highest-priority visual state, overriding dread, weather, and everything else.

---

## 7. Achievements & Skins

### New Achievements

| ID | Name | Condition | Reference |
|----|------|-----------|-----------|
| longWalk70k | 70,000 Meters From Home | 70,000m in a single run | March of the Penguins documentary |
| discoMode | Dance of Eternity | Trigger disco mode | All 4 power-ups at once |
| bossSlayer | Beyond All Monsters | Defeat all 5 boss types | — |
| comboMax | The Übermensch Cometh | Reach Übermensch combo tier | — |
| weatherSurvivor | Amor Fati | Survive 3 blizzards in one run | "Love of fate" |
| shieldBreaker | Glass Philosophy | Break 10 shields in one run | — |
| noHitBoss | Untouchable | Defeat any boss without taking damage | — |

### New Skin

| ID | Name | Unlock | Visual |
|----|------|--------|--------|
| disco | Disco Penguin | Trigger disco mode 3 times | Glittery rainbow sheen, tiny disco ball above head |

---

## 8. State Priority

Highest visual/gameplay priority wins:

1. **Disco mode** (all 4 power-ups active)
2. **Boss encounter** (active phase)
3. **Dread mode** (abyss orb)
4. **Weather effects** (blizzard/fog/clear/light snow)
5. **Normal gameplay**

---

## 9. Architecture

### New Modules

| File | Responsibility |
|------|---------------|
| `src/combo.js` | Combo meter state, tier thresholds, drain/fill logic, HUD rendering |
| `src/powerups.js` | Power-up manager: spawning, active effects, earned ability charging, activation, disco detection |
| `src/bosses.js` | Boss encounter framework: timing, phase scripting, 5 boss definitions, warning/active/defeat states |

### Modified Modules

| File | Changes |
|------|---------|
| `src/main.js` | Wire combo/powerup/boss updates into game loop, pass combo multiplier to score calc |
| `src/obstacles.js` | 4 new types (ice wall, wind gust, crevasse, philosopher's fog), rework icicles → ice spike, new spawn rules |
| `src/collectibles.js` | Shield/magnet pickup types, magnet pull logic, disco auto-collect |
| `src/weather.js` | Gameplay modifier layer (drift, late reveal, bonus spawns), weather-gated obstacle flags |
| `src/hud.js` | Bottom-center combo bar, power-up icons bottom-left, earned ability button bottom-right |
| `src/controls.js` | Earned ability activation key (E / mobile button tap) |
| `src/achievements.js` | 7 new achievements |
| `src/skins.js` | Disco penguin skin |
| `src/constants.js` | All new tuning constants |
| `src/dread.js` | Disco mode overrides dread visuals |
| `src/scene.js` | Disco strobe lighting, rainbow trail rendering |
| `src/particles.js` | New effects (shield shatter, magnet vortex, boss warning, disco sparkles) |

### Implementation Order (foundation-first)

1. Combo system (`combo.js` + HUD integration)
2. Power-up manager framework (`powerups.js` + controls + HUD)
3. Individual power-ups (shield, magnet, slow-time, übermensch rush)
4. Disco mode detection + visuals
5. New obstacle types (ice spike rework, ice wall, crevasse, wind gust, philosopher's fog)
6. Weather gameplay effects
7. Boss encounter framework (`bosses.js`)
8. Individual bosses (Last Man, Abyss Serpent, Pale Criminal, Ice Titan, Eternal Return)
9. Achievements + disco skin
