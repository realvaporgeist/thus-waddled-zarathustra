// src/main.js
import { initScene, render, getCamera } from './scene.js';
import { createTerrain, updateTerrain } from './terrain.js';
import { CAMERA_OFFSET, CAMERA_LOOK_AHEAD, BASE_SPEED } from './constants.js';

const canvas = document.getElementById('game-canvas');
const { scene } = initScene(canvas);

createTerrain(scene);

let playerZ = 0;
let lastTime = performance.now();

function gameLoop(now) {
  requestAnimationFrame(gameLoop);

  const delta = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  playerZ -= BASE_SPEED * delta;

  updateTerrain(playerZ);

  const camera = getCamera();
  camera.position.set(CAMERA_OFFSET.x, CAMERA_OFFSET.y, CAMERA_OFFSET.z);
  camera.lookAt(0, 1, -CAMERA_LOOK_AHEAD);

  render();
}

requestAnimationFrame(gameLoop);
