// src/main.js
import * as THREE from 'three';
import { initScene, render, getCamera } from './scene.js';
import { createTerrain, updateTerrain, resetTerrain } from './terrain.js';
import {
  createPenguin, updatePenguin, switchLane, jump, slide,
  getPenguinGroup, isPlayerJumping, isPlayerSliding, isInvincible,
  startInvincibility, getCurrentLane, resetPenguin, applySkin,
} from './penguin.js';
import { initControls } from './controls.js';
import { spawnObstacle, updateObstacles, getActiveObstacles, clearObstacles } from './obstacles.js';
import { checkCollision } from './collision.js';
import { spawnCollectibles, updateCollectibles, checkCollectiblePickup, clearCollectibles } from './collectibles.js';
import { createHUD, updateScore, updateHearts, updateFishCount, showHUD, showMultiplier, showToast } from './hud.js';
import {
  createStartScreen, hideStartScreen, showStartScreen,
  showGameOverScreen, hideGameOverScreen,
  showPauseScreen, hidePauseScreen, onSkinChange,
} from './screens.js';
import { checkAchievements, incrementPersistentStats, collectRandomFragment, getCompletedQuoteCount } from './achievements.js';
import { startDread, updateDread, isDreadActive, getDreadSpeedMultiplier, cleanupDread, getDreadTimer } from './dread.js';
import {
  initAudio, playJump, playHit, playCollect, playGoldenCollect,
  playQuoteCollect, playDreadEnter, playDreadExit, playGameOver,
  startMusic, stopMusic,
} from './audio.js';
import { getSelectedSkin } from './skins.js';
import { initParticles, updateParticles, emitParticles, clearParticles } from './particles.js';
import { initAurora, updateAurora } from './aurora.js';
import { initWeather, updateWeather, setWeather } from './weather.js';
import { swayMountains } from './terrain.js';
import {
  setIdleMode, updateIdleAnimation, triggerKnockback,
} from './penguin.js';
import {
  triggerScreenShake, updateScreenEffects, getShakeOffset,
  showRedVignette, setSpeedLinesVisible,
} from './scene.js';
import {
  bounceScore, shakeHeart, pulseLastHeart, updateDreadTimerBar,
} from './hud.js';
import {
  CAMERA_OFFSET, CAMERA_LOOK_AHEAD, BASE_SPEED, SPEED_INCREMENT,
  MAX_SPEED, INVINCIBILITY_DURATION, POINTS_PER_METER, FISH_POINTS,
  GOLDEN_FISH_POINTS, FISH_PER_HEAL, MAX_HEARTS, DREAD_MULTIPLIER,
  DREAD_DAMAGE_MULTIPLIER,
  SCREEN_SHAKE_INTENSITY_LIGHT, SCREEN_SHAKE_INTENSITY_HEAVY,
  SPEED_LINE_THRESHOLD, COLLECTION_PARTICLES, DREAD_DURATION,
  CAMERA_INTRO_DURATION, CAMERA_INTRO_START, CAMERA_INTRO_END,
  CAMERA_INTRO_LOOK_START, CAMERA_INTRO_LOOK_END,
  CAMERA_GAMEPLAY_TRANSITION, CAMERA_IDLE_SWAY_SPEED, CAMERA_IDLE_SWAY_AMOUNT,
  NEAR_MISS_THRESHOLD, LANE_WIDTH,
} from './constants.js';

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------
let gameState = 'menu'; // 'menu' | 'playing' | 'paused' | 'gameover'

let playerZ = 0;
let speed = BASE_SPEED;
let elapsed = 0;
let lastTime = performance.now();
let score = 0;
let distance = 0;
let hearts = 3;
let fishCount = 0;
let goldenFishCount = 0;
let newAchievements = [];
let dreadsSurvivedThisRun = 0;
let lastDamageDistance = 0; // distance at last damage
let longestNoDamage = 0;

// Camera state machine
let cameraState = 'intro'; // 'intro' | 'idle' | 'transitioning' | 'gameplay'
let cameraTimer = 0;
let introSkipped = false;

// ---------------------------------------------------------------------------
// Scene setup (runs once)
// ---------------------------------------------------------------------------
const canvas = document.getElementById('game-canvas');
const { scene } = initScene(canvas);

createTerrain(scene);
createPenguin(scene);
createHUD(() => togglePause());

initParticles(scene);
initAurora(scene);
initWeather(scene);

// Start screen: clear/aurora weather, idle penguin
setWeather('clearAurora');
setIdleMode(true);

initAudio();

// Apply saved skin on load
applySkin(getSelectedSkin());

// When skin changes from gallery, apply it
onSkinChange(() => {
  applySkin(getSelectedSkin());
});

// Hide HUD on initial load (menu state)
showHUD(false);
showMultiplier(false);

// ---------------------------------------------------------------------------
// Pause
// ---------------------------------------------------------------------------
function togglePause() {
  if (gameState === 'playing') {
    gameState = 'paused';
    stopMusic();
    showPauseScreen(
      () => { gameState = 'playing'; lastTime = performance.now(); startMusic(); },
      () => { gameState = 'gameover'; hidePauseScreen(); gameOver(); },
    );
  } else if (gameState === 'paused') {
    hidePauseScreen();
    gameState = 'playing';
    lastTime = performance.now();
    startMusic();
  }
}

// ---------------------------------------------------------------------------
// Controls — only act when playing
// ---------------------------------------------------------------------------
initControls({
  onLeft: () => { if (gameState === 'playing') switchLane(-1); },
  onRight: () => { if (gameState === 'playing') switchLane(1); },
  onJump: () => { if (gameState === 'playing') { jump(); playJump(); } },
  onSlide: () => { if (gameState === 'playing') slide(); },
  onAction: () => { /* reserved for future use */ },
  onPause: () => { if (gameState === 'playing' || gameState === 'paused') togglePause(); },
});

// ---------------------------------------------------------------------------
// Start / restart helpers
// ---------------------------------------------------------------------------
function startGame() {
  hideStartScreen();
  hideGameOverScreen();

  cameraState = 'transitioning';
  cameraTimer = 0;
  introSkipped = false;

  setIdleMode(false);

  playerZ = 0;
  speed = BASE_SPEED;
  elapsed = 0;
  lastTime = performance.now();
  score = 0;
  distance = 0;
  hearts = 3;
  fishCount = 0;
  goldenFishCount = 0;
  newAchievements = [];
  dreadsSurvivedThisRun = 0;
  lastDamageDistance = 0;
  longestNoDamage = 0;

  cleanupDread();
  clearParticles();

  resetPenguin();
  applySkin(getSelectedSkin());
  clearObstacles(scene);
  clearCollectibles(scene);
  resetTerrain();

  updateScore(0);
  updateHearts(hearts);
  updateFishCount(0);
  showHUD(true);
  showMultiplier(false);
  updateDreadTimerBar(0, false);

  const gameWeathers = ['lightSnow', 'blizzard', 'clearAurora', 'fog'];
  setWeather(gameWeathers[Math.floor(Math.random() * gameWeathers.length)]);

  startMusic();
  gameState = 'playing';
}

function gameOver() {
  gameState = 'gameover';
  playGameOver();
  stopMusic();
  cleanupDread();
  showHUD(false);

  const quickDeath = elapsed < 5;
  const maxSpeedReached = speed >= MAX_SPEED;

  // Track no-damage streak at end of run
  const streakAtEnd = distance - lastDamageDistance;
  if (streakAtEnd > longestNoDamage) longestNoDamage = streakAtEnd;

  const persistentStats = incrementPersistentStats({
    dreadsSurvived: dreadsSurvivedThisRun,
    fishThisRun: fishCount,
    goldenFishThisRun: goldenFishCount,
    distance,
    score,
  });

  const runStats = {
    distance,
    score,
    fishThisRun: fishCount,
    goldenFishThisRun: goldenFishCount,
    dreadsSurvived: dreadsSurvivedThisRun,
    totalDreadsSurvived: persistentStats.totalDreadsSurvived,
    totalGames: persistentStats.totalGames,
    totalFish: persistentStats.totalFish,
    completedQuotes: getCompletedQuoteCount(),
    maxSpeedReached,
    quickDeath,
    longestNoDamage,
  };
  newAchievements = checkAchievements(runStats);

  showGameOverScreen(score, distance, fishCount, newAchievements, () => {
    startGame();
  });

  setSpeedLinesVisible(false);
  updateDreadTimerBar(0, false);
  clearParticles();
}

// ---------------------------------------------------------------------------
// Show start screen
// ---------------------------------------------------------------------------

// Skip intro on any input
function handleIntroSkip(e) {
  if (cameraState === 'intro') {
    introSkipped = true;
    cameraState = 'idle';
    cameraTimer = 0;
  }
}
window.addEventListener('keydown', handleIntroSkip);
window.addEventListener('click', handleIntroSkip);
window.addEventListener('touchstart', handleIntroSkip);

createStartScreen(() => {
  startGame();
});

// ---------------------------------------------------------------------------
// Game loop
// ---------------------------------------------------------------------------
function gameLoop(now) {
  requestAnimationFrame(gameLoop);

  const delta = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  if (gameState === 'playing') {
    elapsed += delta;
    speed = Math.min(BASE_SPEED + Math.floor(elapsed / 10) * SPEED_INCREMENT, MAX_SPEED);

    const dreadMultiplier = getDreadSpeedMultiplier();
    const currentSpeed = speed * dreadMultiplier;

    playerZ -= currentSpeed * delta;

    distance += currentSpeed * delta;
    const scoreMultiplier = isDreadActive() ? DREAD_MULTIPLIER : 1;
    score += currentSpeed * delta * POINTS_PER_METER * scoreMultiplier;
    updateScore(score);

    updatePenguin(delta, currentSpeed);
    updateTerrain(currentSpeed, delta);
    updateDread(delta);

    if (isDreadActive()) {
      const dreadProgress = 1 - (getDreadTimer() / DREAD_DURATION);
      updateDreadTimerBar(dreadProgress, true);
    } else {
      updateDreadTimerBar(0, false);
    }

    // Obstacle spawning & movement
    const difficulty = Math.floor(elapsed / 10);
    spawnObstacle(scene, playerZ, difficulty);
    updateObstacles(delta, playerZ, currentSpeed);

    // Collision detection
    const penguin = getPenguinGroup();
    if (penguin && !isInvincible()) {
      for (const obs of getActiveObstacles()) {
        if (checkCollision(penguin.position, isPlayerSliding(), isPlayerJumping(), obs)) {
          const damage = isDreadActive() ? DREAD_DAMAGE_MULTIPLIER : 1;
          playHit();
          const shakeStrength = isDreadActive() ? SCREEN_SHAKE_INTENSITY_HEAVY : SCREEN_SHAKE_INTENSITY_LIGHT;
          triggerScreenShake(shakeStrength);
          showRedVignette();
          triggerKnockback();
          shakeHeart(hearts - 1);
          hearts -= damage;
          updateHearts(hearts);
          pulseLastHeart();

          // Track no-damage streaks
          const streak = distance - lastDamageDistance;
          if (streak > longestNoDamage) longestNoDamage = streak;
          lastDamageDistance = distance;

          if (hearts <= 0) {
            gameOver();
            break;
          }
          startInvincibility(INVINCIBILITY_DURATION);
          break;
        }
      }

      // Near-miss detection
      for (const obs of getActiveObstacles()) {
        if (obs.nearMissShown) continue;
        const dz = obs.mesh.position.z - penguin.position.z;
        if (dz > 0 && dz < 2 && obs.lane !== getCurrentLane()) {
          const laneDiff = Math.abs(obs.lane - getCurrentLane());
          if (laneDiff === 1) {
            const dx = Math.abs(penguin.position.x - obs.mesh.position.x);
            if (dx < LANE_WIDTH + NEAR_MISS_THRESHOLD) {
              obs.nearMissShown = true;
              showToast('CLOSE!', 800);
            }
          }
        }
      }
    }

    // Collectible spawning & movement
    spawnCollectibles(scene, playerZ, elapsed);
    updateCollectibles(delta, currentSpeed);

    const penguinForPickup = getPenguinGroup();
    if (penguinForPickup) {
      const pickups = checkCollectiblePickup(penguinForPickup.position, getCurrentLane(), scene);
      for (const pickup of pickups) {
        if (pickup.type === 'fish') {
          playCollect();
          emitParticles({ ...COLLECTION_PARTICLES.fish, position: penguinForPickup.position.clone() });
          bounceScore();
          fishCount++;
          score += FISH_POINTS * scoreMultiplier;
          updateFishCount(fishCount);
          if (fishCount % FISH_PER_HEAL === 0 && hearts < MAX_HEARTS) {
            hearts++;
            updateHearts(hearts);
          }
        } else if (pickup.type === 'goldenFish') {
          playGoldenCollect();
          emitParticles({ ...COLLECTION_PARTICLES.goldenFish, position: penguinForPickup.position.clone() });
          bounceScore();
          score += GOLDEN_FISH_POINTS * scoreMultiplier;
          fishCount++;
          goldenFishCount++;
          updateFishCount(fishCount);
        } else if (pickup.type === 'quote') {
          playQuoteCollect();
          emitParticles({ ...COLLECTION_PARTICLES.quote, position: penguinForPickup.position.clone() });
          const result = collectRandomFragment();
          if (result) {
            if (result.isComplete) {
              showToast(`"${result.fullQuote}"`, 3000);
            } else {
              showToast(`Fragment: "${result.text}"`, 2000);
            }
          }
        } else if (pickup.type === 'abyssOrb' && !isDreadActive()) {
          playDreadEnter();
          emitParticles({ ...COLLECTION_PARTICLES.abyssOrb, position: penguinForPickup.position.clone() });
          startDread(scene, () => {
            playDreadExit();
            showMultiplier(false);
            dreadsSurvivedThisRun++;
          });
          showMultiplier(true);
        }
      }
    }
  }

  // Update visual systems (always run)
  updateAurora(delta);
  updateParticles(delta);
  updateScreenEffects(delta);

  // Weather updates only during gameplay
  if (gameState === 'playing') {
    updateWeather(delta);
  }

  // Camera positioning
  const camera = getCamera();
  const shake = getShakeOffset();

  if (cameraState === 'intro') {
    cameraTimer += delta;
    const t = Math.min(cameraTimer / CAMERA_INTRO_DURATION, 1);
    const ease = t * t * (3 - 2 * t);

    camera.position.set(
      THREE.MathUtils.lerp(CAMERA_INTRO_START.x, CAMERA_INTRO_END.x, ease),
      THREE.MathUtils.lerp(CAMERA_INTRO_START.y, CAMERA_INTRO_END.y, ease),
      THREE.MathUtils.lerp(CAMERA_INTRO_START.z, CAMERA_INTRO_END.z, ease),
    );
    camera.lookAt(
      THREE.MathUtils.lerp(CAMERA_INTRO_LOOK_START.x, CAMERA_INTRO_LOOK_END.x, ease),
      THREE.MathUtils.lerp(CAMERA_INTRO_LOOK_START.y, CAMERA_INTRO_LOOK_END.y, ease),
      THREE.MathUtils.lerp(CAMERA_INTRO_LOOK_START.z, CAMERA_INTRO_LOOK_END.z, ease),
    );

    if (t >= 1 || introSkipped) {
      cameraState = 'idle';
      cameraTimer = 0;
    }
  } else if (cameraState === 'idle') {
    const sway = Math.sin(performance.now() * 0.001 * CAMERA_IDLE_SWAY_SPEED) * CAMERA_IDLE_SWAY_AMOUNT;
    camera.position.set(
      CAMERA_INTRO_END.x + sway,
      CAMERA_INTRO_END.y,
      CAMERA_INTRO_END.z,
    );
    camera.lookAt(
      CAMERA_INTRO_LOOK_END.x + sway * 0.3,
      CAMERA_INTRO_LOOK_END.y,
      CAMERA_INTRO_LOOK_END.z,
    );

    updateIdleAnimation(delta);
    swayMountains(sway);
  } else if (cameraState === 'transitioning') {
    cameraTimer += delta;
    const t = Math.min(cameraTimer / CAMERA_GAMEPLAY_TRANSITION, 1);
    const ease = t * t * (3 - 2 * t);

    camera.position.set(
      THREE.MathUtils.lerp(CAMERA_INTRO_END.x, CAMERA_OFFSET.x, ease),
      THREE.MathUtils.lerp(CAMERA_INTRO_END.y, CAMERA_OFFSET.y, ease),
      THREE.MathUtils.lerp(CAMERA_INTRO_END.z, CAMERA_OFFSET.z, ease),
    );
    camera.lookAt(
      THREE.MathUtils.lerp(CAMERA_INTRO_LOOK_END.x, 0, ease),
      THREE.MathUtils.lerp(CAMERA_INTRO_LOOK_END.y, 1, ease),
      THREE.MathUtils.lerp(CAMERA_INTRO_LOOK_END.z, -CAMERA_LOOK_AHEAD, ease),
    );

    if (t >= 1) {
      cameraState = 'gameplay';
    }
  } else {
    camera.position.set(
      CAMERA_OFFSET.x + shake.x,
      CAMERA_OFFSET.y + shake.y,
      CAMERA_OFFSET.z,
    );
    camera.lookAt(0, 1, -CAMERA_LOOK_AHEAD);
  }

  // Speed lines based on current speed
  if (gameState === 'playing') {
    setSpeedLinesVisible(speed >= MAX_SPEED * SPEED_LINE_THRESHOLD);
  }

  render();
}

requestAnimationFrame(gameLoop);
