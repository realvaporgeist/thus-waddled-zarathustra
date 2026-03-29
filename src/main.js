// src/main.js
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
import { startDread, updateDread, isDreadActive, getDreadSpeedMultiplier, cleanupDread } from './dread.js';
import {
  initAudio, playJump, playHit, playCollect, playGoldenCollect,
  playQuoteCollect, playDreadEnter, playDreadExit, playGameOver,
  startMusic, stopMusic,
} from './audio.js';
import { getSelectedSkin } from './skins.js';
import {
  CAMERA_OFFSET, CAMERA_LOOK_AHEAD, BASE_SPEED, SPEED_INCREMENT,
  MAX_SPEED, INVINCIBILITY_DURATION, POINTS_PER_METER, FISH_POINTS,
  GOLDEN_FISH_POINTS, FISH_PER_HEAL, MAX_HEARTS, DREAD_MULTIPLIER,
  DREAD_DAMAGE_MULTIPLIER,
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

// ---------------------------------------------------------------------------
// Scene setup (runs once)
// ---------------------------------------------------------------------------
const canvas = document.getElementById('game-canvas');
const { scene } = initScene(canvas);

createTerrain(scene);
createPenguin(scene);
createHUD(() => togglePause());

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
}

// ---------------------------------------------------------------------------
// Show start screen
// ---------------------------------------------------------------------------
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
          hearts -= damage;
          updateHearts(hearts);

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
          fishCount++;
          score += FISH_POINTS * scoreMultiplier;
          updateFishCount(fishCount);
          if (fishCount % FISH_PER_HEAL === 0 && hearts < MAX_HEARTS) {
            hearts++;
            updateHearts(hearts);
          }
        } else if (pickup.type === 'goldenFish') {
          playGoldenCollect();
          score += GOLDEN_FISH_POINTS * scoreMultiplier;
          fishCount++;
          goldenFishCount++;
          updateFishCount(fishCount);
        } else if (pickup.type === 'quote') {
          playQuoteCollect();
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

  // Camera and render always run (background visible in menu/gameover/paused)
  const camera = getCamera();
  camera.position.set(CAMERA_OFFSET.x, CAMERA_OFFSET.y, CAMERA_OFFSET.z);
  camera.lookAt(0, 1, -CAMERA_LOOK_AHEAD);

  render();
}

requestAnimationFrame(gameLoop);
