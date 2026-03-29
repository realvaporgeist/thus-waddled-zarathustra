// src/main.js
import { initScene, render, getCamera } from './scene.js';
import { createTerrain, updateTerrain } from './terrain.js';
import {
  createPenguin, updatePenguin, switchLane, jump, slide,
  getPenguinGroup, isPlayerJumping, isPlayerSliding, isInvincible,
  startInvincibility, getCurrentLane,
} from './penguin.js';
import { initControls } from './controls.js';
import { spawnObstacle, updateObstacles, getActiveObstacles } from './obstacles.js';
import { checkCollision } from './collision.js';
import { spawnCollectibles, updateCollectibles, checkCollectiblePickup } from './collectibles.js';
import { createHUD, updateScore, updateHearts, updateFishCount } from './hud.js';
import {
  CAMERA_OFFSET, CAMERA_LOOK_AHEAD, BASE_SPEED, SPEED_INCREMENT,
  MAX_SPEED, INVINCIBILITY_DURATION, POINTS_PER_METER, FISH_POINTS,
  GOLDEN_FISH_POINTS, FISH_PER_HEAL, MAX_HEARTS,
} from './constants.js';

const canvas = document.getElementById('game-canvas');
const { scene } = initScene(canvas);

createTerrain(scene);
createPenguin(scene);
createHUD();

initControls({
  onLeft: () => switchLane(-1),
  onRight: () => switchLane(1),
  onJump: () => jump(),
  onSlide: () => slide(),
  onAction: () => console.log('action pressed'),
});

let playerZ = 0;
let speed = BASE_SPEED;
let elapsed = 0;
let lastTime = performance.now();
let score = 0;
let hearts = 3;
let fishCount = 0;

function gameLoop(now) {
  requestAnimationFrame(gameLoop);

  const delta = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  // Speed ramp-up over time
  elapsed += delta;
  speed = Math.min(BASE_SPEED + Math.floor(elapsed / 10) * SPEED_INCREMENT, MAX_SPEED);
  playerZ -= speed * delta;

  score += speed * delta * POINTS_PER_METER;
  updateScore(score);

  updatePenguin(delta);
  updateTerrain(playerZ);

  // Obstacle spawning & movement
  const difficulty = Math.floor(elapsed / 10);
  spawnObstacle(scene, playerZ, difficulty);
  updateObstacles(delta, playerZ, speed);

  // Collision detection
  const penguin = getPenguinGroup();
  if (penguin && !isInvincible()) {
    for (const obs of getActiveObstacles()) {
      if (checkCollision(penguin.position, isPlayerSliding(), isPlayerJumping(), obs)) {
        console.log('HIT!', obs.typeName);
        hearts--;
        updateHearts(hearts);
        if (hearts <= 0) {
          console.log('GAME OVER — score:', Math.floor(score));
        }
        startInvincibility(INVINCIBILITY_DURATION);
        break;
      }
    }
  }

  // Collectible spawning & movement
  spawnCollectibles(scene, playerZ, elapsed);
  updateCollectibles(delta, speed);

  const penguinForPickup = getPenguinGroup();
  if (penguinForPickup) {
    const pickups = checkCollectiblePickup(penguinForPickup.position, getCurrentLane());
    for (const pickup of pickups) {
      console.log('Collected:', pickup.type, pickup.quoteText || '');
      if (pickup.type === 'fish') {
        fishCount++;
        score += FISH_POINTS;
        updateFishCount(fishCount);
        if (fishCount % FISH_PER_HEAL === 0 && hearts < MAX_HEARTS) {
          hearts++;
          updateHearts(hearts);
        }
      } else if (pickup.type === 'goldenFish') {
        score += GOLDEN_FISH_POINTS;
        fishCount++;
        updateFishCount(fishCount);
      }
    }
  }

  const camera = getCamera();
  camera.position.set(CAMERA_OFFSET.x, CAMERA_OFFSET.y, CAMERA_OFFSET.z);
  camera.lookAt(0, 1, -CAMERA_LOOK_AHEAD);

  render();
}

requestAnimationFrame(gameLoop);
