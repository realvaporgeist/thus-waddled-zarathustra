# Phase 1 — Visual Foundation & Start Screen

**Project:** Thus Waddles Zarathustra (formerly Nietzsche Penguin)
**Date:** 2026-03-29
**Scope:** Visual overhaul, cinematic start screen, parallax, weather, particles, HUD polish

---

## 1. Game Rename

Rename the game from "Nietzsche Penguin" to **"Thus Waddles Zarathustra"**.

- Title text on start screen: "THUS WADDLES ZARATHUSTRA"
- Subtitle remains: "An Endless Run Toward Meaning"
- Update `index.html` `<title>`, start screen, game over screen, and any other references

---

## 2. Cinematic Start Screen

Replace the current flat HTML overlay with a 3D rendered scene behind the UI.

### Camera Sequence (on page load)

1. **Wide shot** — Camera positioned high above the arctic landscape, looking down at the path stretching into the distance, mountains on both sides
2. **Sweep** — Camera smoothly arcs down and forward over ~3 seconds, easing into the hero position
3. **Hero position** — Camera rests slightly below eye-level looking up at the penguin, mountains towering behind, path disappearing into fog

Any input during the sweep skips immediately to the hero position.

### Penguin Idle Animation

- Gentle side-to-side waddle (slower cadence than the run animation)
- Occasional blink (random interval, 3-6 seconds)
- Periodic head turn left/right (random interval, 5-10 seconds)
- Skin updates in real-time when the player changes skin in the gallery

### Environment Behind UI

- Weather set to **Clear/Aurora** on the start screen (aurora at full opacity for maximum visual impact, no snow)
- Aurora borealis ribbons shimmering in the sky (see Section 5)
- Subtle ground-level fog drift
- Parallax mountains responding to gentle automatic camera sway (slow sine wave)
- On gameplay start, weather transitions to a random state

### UI Overlay

All UI elements render on top of the 3D scene:

- **Title** "THUS WADDLES ZARATHUSTRA" fades in after camera lands (~3s mark). Large, bold typography.
- **Subtitle** "An Endless Run Toward Meaning" fades in 0.5s after title. Smaller, lighter weight.
- **Start prompt** "Press SPACE to Begin" / "Tap to Begin" pulses gently (opacity oscillation). Appears with subtitle.
- **High score** display appears with a subtle slide-up animation
- **Gallery buttons** (Achievements, Skins) slide up from bottom
- **Semi-transparent dark gradient** at bottom of screen ensures text readability against the 3D background

### Transition to Gameplay

When the player starts, the camera smoothly transitions from the hero position to the gameplay camera position behind/above the penguin. The UI overlay fades out during this transition (~0.5s). The penguin transitions from idle to run animation.

---

## 3. Parallax Mountain System

Replace the current single-row static mountains with a 3-layer parallax system.

### Layers

| Layer | Depth | Scroll Speed | Visual Treatment |
|-------|-------|-------------|-----------------|
| Far mountains | Farthest Z | ~10% of player speed | Largest scale, snow-capped, heavy blue atmospheric fog tint |
| Mid mountains | Mid Z | ~30% of player speed | Medium scale, more visible detail, darker tone |
| Near hills | Closest Z | ~60% of player speed | Smallest/closest, rocky detail, most contrast |

### Behavior

- **During gameplay:** Each layer scrolls at its designated rate relative to the current game speed. Mountains wrap/recycle when they scroll off-screen.
- **On start screen:** Parallax responds to the subtle automatic camera sway, giving a sense of depth even while idle.
- **Implementation:** Reuse the existing mountain geometry generation from `terrain.js`. Create 3 rows at different Z-depths, varying scale, color tint (blue shift for distance), and fog density per layer.

---

## 4. Weather System (Visual Only)

Weather is purely cosmetic in Phase 1. Gameplay effects (visibility impacting difficulty, wind affecting movement) are deferred to Phase 4.

### Weather Types

| Type | Snow Particles | Fog | Sky | Notes |
|------|---------------|-----|-----|-------|
| Light Snow | Gentle fall, low density | Light ground fog | Overcast | Default weather |
| Blizzard | Dense, wind-angled particles | Heavy, closes in | Dark overcast | Reduced mountain visibility |
| Clear/Aurora | None | Minimal | Dark sky, stars visible | Aurora borealis at full opacity |
| Fog | Light snow | Very heavy ground fog | Muted | Mountains barely visible, eerie |

### Transitions

- Weather shifts randomly every 60-90 seconds
- 5-second crossfade between weather states (particle density, fog, sky color interpolate smoothly)
- **Dread mode override:** Dread mode always forces a blizzard/fog-like atmosphere regardless of current weather. On dread exit, the previous weather state crossfades back.

### Particle System

Snow particles use a shared particle system (a single `Points` geometry with a position buffer). Particle count varies by weather type:

- Light Snow: ~200 particles
- Blizzard: ~600 particles, with horizontal wind drift
- Clear: 0 snow particles, optional star particles
- Fog: ~100 particles

Particles recycle when they fall below ground level, respawning at the top of the visible area.

---

## 5. Aurora Borealis

### Rendering

- 2-3 ribbon meshes positioned high in the sky
- Custom `ShaderMaterial` with:
  - Slow sinusoidal wave motion (ribbons undulate horizontally)
  - Color gradient that shifts between green, teal, and purple over time
  - Soft glow via emissive properties (no post-processing pass needed)
- Opacity controlled by weather state:
  - Clear/Aurora: full opacity
  - Light Snow: dimmed (~40% opacity)
  - Blizzard/Fog: hidden (0% opacity)

### Contextual Color

- **Normal gameplay / start screen:** Green-teal-purple gradient (natural aurora)
- **Dread mode:** Shifts to deep red/crimson — the beautiful becomes ominous

---

## 6. Particle Effects

### Collection Particles

| Collectible | Particle Count | Color | Behavior | Duration |
|-------------|---------------|-------|----------|----------|
| Fish | 8-12 | Silver/white | Fan outward from collection point | 0.3s fade |
| Golden Fish | 15-20 | Gold with shimmer | Larger burst, lingering trail | 0.5s fade |
| Quote Fragment | 10-15 | Text-glow color (warm white) | Spiral inward toward HUD position | 0.4s |
| Abyss Orb | 20-25 | Dark purple | Implosion (rush inward) then explosion outward | 0.6s total |

### Damage Feedback

- **Screen shake:** Short horizontal jitter, 0.15s duration. Intensity scales with damage (1 heart = mild, 2 hearts during dread = strong).
- **Red vignette:** Edges of screen flash red for 0.2s using a full-screen overlay quad with radial gradient. Opacity: ~0.3.
- **Penguin knockback:** Slight backward positional stagger (0.2s ease-out, then return to position).

### Speed & Movement

- **Speed lines:** Faint white streaks at screen edges when speed exceeds 80% of max. Density and length increase with speed. Implemented as elongated particles spawning at screen edges, moving backward.
- **Jump trail:** Subtle white arc trail behind penguin during jumps. Short-lived particles emitted from penguin's position each frame while airborne.
- **Slide sparks:** Small ice-colored particle spray at ground level when sliding. 4-6 particles per frame, short lifespan.
- **Lane change:** Brief directional wind streak (2-3 elongated particles) in the direction of movement.

### Near-Miss Flash (Visual Preview)

- When an obstacle passes within ~0.3 units of the penguin's collision box without colliding, a brief white flash appears on the obstacle edge and a floating "CLOSE!" text fades upward over 0.5s.
- This is visual-only feedback in Phase 1. The scoring/combo system is Phase 2.

### Dread Mode Transitions

- **Entry:** Screen distortion ripple effect emanating from the orb pickup point. Color desaturates outward like a shockwave. Implemented as a brief post-effect or overlay animation (~0.5s).
- **Exit:** Color floods back in from screen edges. Brief brightness flash (white overlay fades from ~20% opacity to 0 over 0.3s).

---

## 7. HUD Polish

### Score Counter

- Brief scale-up bounce (1.0 -> 1.2 -> 1.0 over 0.2s) when points are added
- During dread mode, the "2X" multiplier text pulses with a glow effect (existing behavior, keep)

### Hearts

- On damage: affected heart shakes (horizontal jitter) and scales down with an ease-out animation before disappearing
- Low health (1 heart): remaining heart pulses slowly (scale oscillation) as a warning

### Fish Counter

- Small fish icon next to the counter flips (Y-axis rotation) when the count increments

### Dread Timer Bar

- New element: a thin horizontal bar at the top of the screen during dread mode
- Fills from left to right over the 18-second duration
- Color: deep purple with a glowing edge at the fill point
- Fades in on dread entry, fades out on exit

### Toast Messages

- Quote fragments and achievement unlocks slide in from the right edge
- Frosted glass background (semi-transparent with backdrop blur if supported, solid fallback)
- Slide out after 3 seconds or when another toast arrives

---

## 8. Performance Considerations

- **Particle budget:** Cap total active particles at ~800 across all systems (snow + collection + speed lines + sparks). Reuse particle pools.
- **Mountain geometry:** Parallax layers reuse the existing mountain generation approach. 3 rows total, each with the same number of mountains as the current single row.
- **Aurora shader:** Runs on a small number of vertices (ribbon geometry). Shader is simple (sine waves + color interpolation). Negligible GPU cost.
- **Weather transitions:** Interpolate uniforms/properties rather than creating/destroying objects. No allocation during crossfades.
- **Screen effects (shake, vignette, dread ripple):** Use overlay quads or camera offset — no post-processing pipeline needed.

---

## 9. Files Affected

| File | Changes |
|------|---------|
| `index.html` | Update title, restructure start screen markup for overlay approach |
| `src/main.js` | Start screen state machine (camera sequence, transition to gameplay), weather tick |
| `src/scene.js` | Aurora meshes, weather fog/sky color transitions, camera shake |
| `src/terrain.js` | 3-layer parallax mountain system replacing single row |
| `src/penguin.js` | Idle animation (waddle, blink, head turn), knockback animation |
| `src/hud.js` | Score bounce, heart pulse/shake, fish flip, dread timer bar, frosted toasts |
| `src/collectibles.js` | Trigger collection particle bursts |
| `src/dread.js` | Entry/exit transition effects, aurora color shift, weather override |
| `src/audio.js` | No changes in Phase 1 (audio overhaul is Phase 3) |
| `src/constants.js` | Weather timing, particle counts, animation durations, parallax speeds |
| **New:** `src/particles.js` | Particle system manager — pools, emitters, per-frame update |
| **New:** `src/weather.js` | Weather state machine, transition logic, snow particle system |
| **New:** `src/aurora.js` | Aurora ribbon meshes, shader material, color transitions |

---

## 10. Out of Scope (Later Phases)

- Power-ups, new obstacles, bosses, combo scoring (Phase 2)
- Dynamic music, reactive SFX, soundtrack integration (Phase 3)
- Daily challenges, leaderboard, settings menu, stats dashboard, weather gameplay effects (Phase 4)
