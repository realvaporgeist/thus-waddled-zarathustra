// src/main.js
import { initScene, render, getCamera } from './scene.js';
import { createTerrain, updateTerrain } from './terrain.js';
import {
  createPenguin, updatePenguin, switchLane, jump, slide,
  getPenguinGroup, isPlayerJumping, isPlayerSliding, isInvincible,
  startInvincibility, getCurrentLane, resetPenguin,
} from './penguin.js';
import { initControls } from './controls.js';
import { spawnObstacle, updateObstacles, getActiveObstacles, clearObstacles } from './obstacles.js';
import { checkCollision } from './collision.js';
import { spawnCollectibles, updateCollectibles, checkCollectiblePickup, clearCollectibles } from './collectibles.js';
import { createHUD, updateScore, updateHearts, updateFishCount, showHUD, showMultiplier } from './hud.js';
import {
  createStartScreen, hideStartScreen, showStartScreen,
  showGameOverScreen, hideGameOverScreen,
} from './screens.js';
import { startDread, updateDread, isDreadActive, getDreadSpeedMultiplier, cleanupDread } from './dread.js';
import {
  CAMERA_OFFSET, CAMERA_LOOK_AHEAD, BASE_SPEED, SPEED_INCREMENT,
  MAX_SPEED, INVINCIBILITY_DURATION, POINTS_PER_METER, FISH_POINTS,
  GOLDEN_FISH_POINTS, FISH_PER_HEAL, MAX_HEARTS, DREAD_MULTIPLIER,
  DREAD_DAMAGE_MULTIPLIER,
} from './constants.js';

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------
let gameState = 'menu'; // 'menu' | 'playing' | 'gameover'

let playerZ = 0;
let speed = BASE_SPEED;
let elapsed = 0;
let lastTime = performance.now();
let score = 0;
let distance = 0;
let hearts = 3;
let fishCount = 0;
let newAchievements = []; // populated in Task 11
let dreadsSurvivedThisRun = 0;

// ---------------------------------------------------------------------------
// Scene setup (runs once)
// ---------------------------------------------------------------------------
const canvas = document.getElementById('game-canvas');
const { scene } = initScene(canvas);

createTerrain(scene);
createPenguin(scene);
createHUD();

// Hide HUD on initial load (menu state)
showHUD(false);
showMultiplier(false);

// ---------------------------------------------------------------------------
// Controls — only act when playing
// ---------------------------------------------------------------------------
initControls({
  onLeft: () => { if (gameState === 'playing') switchLane(-1); },
  onRight: () => { if (gameState === 'playing') switchLane(1); },
  onJump: () => { if (gameState === 'playing') jump(); },
  onSlide: () => { if (gameState === 'playing') slide(); },
  onAction: () => { /* reserved for future use */ },
});

// ---------------------------------------------------------------------------
// Start / restart helpers
// ---------------------------------------------------------------------------
function startGame() {
  hideStartScreen();
  hideGameOverScreen();

  // Reset game variables
  playerZ = 0;
  speed = BASE_SPEED;
  elapsed = 0;
  lastTime = performance.now();
  score = 0;
  distance = 0;
  hearts = 3;
  fishCount = 0;
  newAchievements = [];
  dreadsSurvivedThisRun = 0;

  // Clean up any active dread mode
  cleanupDread();

  // Reset entities
  resetPenguin();
  clearObstacles(scene);
  clearCollectibles(scene);

  // Reset HUD
  updateScore(0);
  updateHearts(hearts);
  updateFishCount(0);
  showHUD(true);
  showMultiplier(false);

  gameState = 'playing';
}

function gameOver() {
  gameState = 'gameover';
  showHUD(false);

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
    // Speed ramp-up over time
    elapsed += delta;
    speed = Math.min(BASE_SPEED + Math.floor(elapsed / 10) * SPEED_INCREMENT, MAX_SPEED);

    // Apply dread speed multiplier
    const dreadMultiplier = getDreadSpeedMultiplier();
    const currentSpeed = speed * dreadMultiplier;

    playerZ -= currentSpeed * delta;

    // Track distance and score separately (with dread score multiplier)
    distance += currentSpeed * delta;
    const scoreMultiplier = isDreadActive() ? DREAD_MULTIPLIER : 1;
    score += currentSpeed * delta * POINTS_PER_METER * scoreMultiplier;
    updateScore(score);

    updatePenguin(delta);
    updateTerrain(playerZ);
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
          hearts -= damage;
          updateHearts(hearts);
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
      const pickups = checkCollectiblePickup(penguinForPickup.position, getCurrentLane());
      for (const pickup of pickups) {
        if (pickup.type === 'fish') {
          fishCount++;
          score += FISH_POINTS * scoreMultiplier;
          updateFishCount(fishCount);
          if (fishCount % FISH_PER_HEAL === 0 && hearts < MAX_HEARTS) {
            hearts++;
            updateHearts(hearts);
          }
        } else if (pickup.type === 'goldenFish') {
          score += GOLDEN_FISH_POINTS * scoreMultiplier;
          fishCount++;
          updateFishCount(fishCount);
        } else if (pickup.type === 'abyssOrb' && !isDreadActive()) {
          startDread(scene, () => {
            showMultiplier(false);
            dreadsSurvivedThisRun++;
          });
          showMultiplier(true);
        }
      }
    }
  }

  // Camera and render always run (background visible in menu/gameover)
  const camera = getCamera();
  camera.position.set(CAMERA_OFFSET.x, CAMERA_OFFSET.y, CAMERA_OFFSET.z);
  camera.lookAt(0, 1, -CAMERA_LOOK_AHEAD);

  render();
}

requestAnimationFrame(gameLoop);
