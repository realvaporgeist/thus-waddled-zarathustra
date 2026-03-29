// src/main.js
import { initScene, render, getCamera } from './scene.js';
import { createTerrain, updateTerrain } from './terrain.js';
import {
  createPenguin, updatePenguin, switchLane, jump, slide,
  getPenguinGroup, isPlayerJumping, isPlayerSliding, isInvincible,
  startInvincibility,
} from './penguin.js';
import { initControls } from './controls.js';
import { spawnObstacle, updateObstacles, getActiveObstacles } from './obstacles.js';
import { checkCollision } from './collision.js';
import {
  CAMERA_OFFSET, CAMERA_LOOK_AHEAD, BASE_SPEED, SPEED_INCREMENT,
  MAX_SPEED, INVINCIBILITY_DURATION,
} from './constants.js';

const canvas = document.getElementById('game-canvas');
const { scene } = initScene(canvas);

createTerrain(scene);
createPenguin(scene);

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

function gameLoop(now) {
  requestAnimationFrame(gameLoop);

  const delta = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  // Speed ramp-up over time
  elapsed += delta;
  speed = Math.min(BASE_SPEED + Math.floor(elapsed / 10) * SPEED_INCREMENT, MAX_SPEED);
  playerZ -= speed * delta;

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
        startInvincibility(INVINCIBILITY_DURATION);
        break;
      }
    }
  }

  const camera = getCamera();
  camera.position.set(CAMERA_OFFSET.x, CAMERA_OFFSET.y, CAMERA_OFFSET.z);
  camera.lookAt(0, 1, -CAMERA_LOOK_AHEAD);

  render();
}

requestAnimationFrame(gameLoop);
