// src/main.js
import { initScene, render, getCamera } from './scene.js';
import { createTerrain, updateTerrain } from './terrain.js';
import { createPenguin, updatePenguin, switchLane, jump, slide } from './penguin.js';
import { initControls } from './controls.js';
import { CAMERA_OFFSET, CAMERA_LOOK_AHEAD, BASE_SPEED } from './constants.js';

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
let lastTime = performance.now();

function gameLoop(now) {
  requestAnimationFrame(gameLoop);

  const delta = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  playerZ -= BASE_SPEED * delta;

  updatePenguin(delta);
  updateTerrain(playerZ);

  const camera = getCamera();
  camera.position.set(CAMERA_OFFSET.x, CAMERA_OFFSET.y, CAMERA_OFFSET.z);
  camera.lookAt(0, 1, -CAMERA_LOOK_AHEAD);

  render();
}

requestAnimationFrame(gameLoop);
