// src/main.js
import { initScene, render } from './scene.js';

const canvas = document.getElementById('game-canvas');
const { scene, camera, renderer } = initScene(canvas);

function gameLoop() {
  requestAnimationFrame(gameLoop);
  render();
}

gameLoop();
