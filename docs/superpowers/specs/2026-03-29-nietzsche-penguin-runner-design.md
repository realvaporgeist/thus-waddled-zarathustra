# Nietzsche Penguin Endless Runner — Game Design Spec

## Overview

A third-person endless runner (Temple Run style) where a penguin runs toward distant mountains through an arctic landscape. The game blends arctic-themed obstacles with Nietzsche philosophy humor. Built with Three.js + Vite, mobile-friendly with swipe controls.

The aesthetic is meme-faithful: crude, simple, funny. The MVP uses procedural geometry for all models, with the architecture designed to swap in proper GLTF assets later.

## Core Gameplay

### Perspective & World
- Camera behind and above the penguin, looking forward down an icy path
- Mountains always visible on the horizon — they never get closer (very Nietzsche)
- Three lanes on the ice path, arctic terrain on either side (snow, distant ice formations)
- Procedurally generated terrain chunks that spawn ahead and despawn behind the camera
- Speed gradually increases over time

### Controls
- **3-lane system**: swipe left/right or arrow keys to switch lanes
- **Jump**: swipe up or spacebar — clears ground obstacles
- **Slide/duck**: swipe down or shift key — goes under overhead obstacles
- Touch swipe detection for mobile, keyboard for desktop
- Lane switching is snappy with a quick lerp animation

### Player Character
- Penguin rendered with basic Three.js geometry for MVP (spheres, cones, cylinders)
- Waddle animation via simple oscillation on the geometry
- Designed as a replaceable module — swap to GLTF model later without changing game logic
- Brief invincibility flash (blinking) after taking a hit

## Obstacles

### Arctic Obstacles
- **Ice blocks** (ground level) — jump over
- **Icicle formations** (overhead) — slide under
- **Crevasses** (gaps in the path) — jump over
- **Rolling snowballs** (incoming from ahead) — switch lanes to dodge

### Nietzsche Obstacles
- **"God is Dead" tombstones** — ground level, jump or dodge
- **Falling philosophy books / "Thus Spoke Zarathustra" tomes** — dodge lane
- **Abyss gaps with eyeballs staring up** — jump over (eyes track the penguin)
- **"Eternal Return" rings** — spinning ring obstacles, duck or jump depending on height

Obstacles spawn in randomized patterns with difficulty scaling over time (more frequent, tighter spacing, faster approach).

## Collectibles & Health

### Health
- 3 hearts displayed on HUD
- Lose 1 heart per obstacle hit (2 hearts during dread mode)
- Brief invincibility window (~1.5s) after being hit
- Game over at 0 hearts

### Fish (Common Collectible)
- Scattered along lanes, float and rotate gently
- +100 points each
- Every 10 fish collected restores 1 heart (capped at 3)

### Golden Fish (Rare)
- Appears occasionally, glows gold
- +500 points

### Nietzsche Quotes (Achievement Pickups)
- Floating text fragments along the path, less frequent than fish
- Collecting one unlocks it in the achievements gallery
- Examples:
  - "What doesn't kill me makes me stronger"
  - "He who has a why can bear any how"
  - "You must have chaos within you to give birth to a dancing star"
  - "There are no facts, only interpretations"
  - "In heaven, all the interesting people are missing"
  - "Without music, life would be a mistake"
  - "Man is a rope, tied between beast and overman"
  - "The higher we soar, the smaller we appear to those who cannot fly"

### Abyss Orb (Dread Mode Trigger)
- Dark swirling sphere, appears occasionally (rare — roughly every 45-90 seconds of gameplay)
- Player can choose to collect it or dodge it
- Collecting it triggers the Existential Dread Sequence

## Existential Dread Sequence

A risk/reward mechanic — the player opts in by grabbing the Abyss Orb.

### Effects (duration: ~12 seconds)
- Screen darkens, color desaturates to near-monochrome
- Giant glowing red eyes fade in on the mountain horizon
- Shadow creatures appear on the sides of the path (silhouettes)
- Obstacles become dark silhouettes (harder to read)
- Speed increases slightly (~15%)
- **2x point multiplier** on all distance and fish collected during dread mode

### Risk
- Hitting an obstacle during dread mode costs 2 hearts instead of 1
- Obstacles are harder to see

### Exit
- After ~12 seconds, light returns with a brief flash
- A Nietzsche quote appears on screen (e.g., "If you gaze long into an abyss, the abyss gazes also into you")
- Multiplier reverts to 1x

## Scoring

- **Distance** is the primary score (1 point per meter)
- **Fish** give bonus points (+100 regular, +500 golden)
- **Dread mode** applies 2x multiplier to all scoring during the sequence
- **High score** saved to localStorage
- Speed increases over time, making distance accumulate faster but gameplay harder

## UI Screens

### Start Screen
- Title: "NIETZSCHE PENGUIN" in bold meme-style font (Bangers from Google Fonts)
- Penguin model rotating slowly on an ice platform
- Mountains in background, subtle snow particle effect
- "TAP TO START" / "PRESS SPACE TO START" prompt
- High score displayed below
- "ACHIEVEMENTS" button to open gallery

### HUD (In-Game)
- Hearts (top-left) — simple heart icons
- Score / distance (top-center) — large number
- Fish count (top-right) — fish icon + count
- "2X" multiplier badge (visible only during dread mode, pulsing)

### Game Over Screen
- Title: "THE ABYSS CLAIMED YOU" (or random from a pool of Nietzsche quips)
- Final score, distance run, fish collected
- Random Nietzsche quote
- "PLAY AGAIN" button
- List of achievements/quotes unlocked this run (if any)

### Achievements Gallery
- Accessible from start screen
- Grid of Nietzsche quotes — collected ones visible, uncollected shown as "???"
- Milestone achievements:
  - "First Steps" — run 100m
  - "The Long Walk" — run 1km
  - "Ubermensch" — run 5km
  - "Stared Into the Abyss" — survive 1 dread sequence
  - "Abyss Veteran" — survive 10 dread sequences total
  - "Fish Philosopher" — collect 100 fish in one run
  - "Eternal Return" — play 10 games
  - "Beyond Good and Evil" — score 10,000 points

## Technical Architecture

```
nietzsche-penguin-the-game/
├── index.html              # Entry HTML
├── vite.config.js          # Vite config
├── package.json
├── public/
│   └── models/             # Future GLTF/GLB assets go here
├── src/
│   ├── main.js             # Entry point — init, game state machine
│   ├── scene.js            # Three.js scene, camera, renderer, lighting
│   ├── penguin.js          # Player model, animations, lane state
│   ├── terrain.js          # Procedural ice path chunks, mountains, environment
│   ├── obstacles.js        # Obstacle types, spawning patterns, collision boxes
│   ├── collectibles.js     # Fish, golden fish, quotes, abyss orbs
│   ├── dread.js            # Existential dread mode effects and timing
│   ├── hud.js              # HTML overlay — score, hearts, multiplier
│   ├── screens.js          # Start, game over, achievements screens
│   ├── controls.js         # Keyboard input + touch swipe detection
│   ├── audio.js            # Sound manager (optional, can be empty initially)
│   ├── achievements.js     # Achievement tracking + localStorage persistence
│   └── constants.js        # All tunable game values (speed, timing, points, etc.)
└── assets/
    ├── sounds/             # Future sound files
    └── textures/           # Future texture files
```

### Key Technical Decisions
- **Three.js** (via npm) for all 3D rendering
- **Vite** for dev server, HMR, and static build
- **No framework** — vanilla JS, keeping the game loop lean for mobile performance
- **HTML overlays** for HUD and menus (CSS positioned over the canvas) — simpler than rendering text in Three.js
- **localStorage** for high scores and achievement persistence
- **Procedural geometry** for MVP — all models built from Three.js primitives
- **Model abstraction layer** — each entity (penguin, obstacles, collectibles) has a `createModel()` function that returns a Three.js Group, making it trivial to swap procedural for GLTF later
- **requestAnimationFrame** game loop with delta-time for consistent speed across frame rates
- **Collision detection** via bounding box overlap (simple AABB)
- **Deploy** as static site to Vercel (just `vite build` output)

### Mobile Considerations
- Touch swipe detection with configurable threshold
- Responsive canvas sizing (fills viewport)
- Performance budget: target 60fps on mid-range mobile
- Minimal draw calls — reuse geometries and materials
- Frustum culling handled by Three.js
- No heavy post-processing effects (dread mode uses simple fog + color grading via renderer)

## Asset Swap Strategy (Post-MVP)

Each visual entity is created through a factory function:
```
// MVP: returns procedural geometry
function createPenguinModel() { ... return group; }

// Later: load and return GLTF model
function createPenguinModel() { ... return gltfScene; }
```

Game logic references only the returned Group/Object3D — never the internal geometry. This means swapping from procedural to GLTF requires changing only the factory functions, not the game logic.

## Out of Scope for MVP
- Sound effects and music (audio.js exists as placeholder)
- Online leaderboards
- Multiple penguin skins
- Power-ups beyond health restore
- Settings menu (volume, controls config)
- Haptic feedback on mobile

These can all be added incrementally after MVP.
