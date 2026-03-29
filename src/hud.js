// src/hud.js
import { MAX_HEARTS } from './constants.js';

let hudContainer = null;
let heartsEl = null;
let scoreEl = null;
let fishEl = null;
let multiplierEl = null;

export function createHUD() {
  hudContainer = document.createElement('div');
  hudContainer.id = 'hud';

  hudContainer.innerHTML = `
    <div id="hud-hearts"></div>
    <div id="hud-score">0</div>
    <div id="hud-fish">🐟 0</div>
    <div id="hud-multiplier" class="hidden">2X</div>
  `;

  document.getElementById('ui-overlay').appendChild(hudContainer);

  heartsEl = document.getElementById('hud-hearts');
  scoreEl = document.getElementById('hud-score');
  fishEl = document.getElementById('hud-fish');
  multiplierEl = document.getElementById('hud-multiplier');

  updateHearts(MAX_HEARTS);
}

export function updateHearts(hearts) {
  if (!heartsEl) return;
  heartsEl.innerHTML = '';
  for (let i = 0; i < MAX_HEARTS; i++) {
    const heart = document.createElement('span');
    heart.className = 'heart';
    heart.textContent = i < hearts ? '❤️' : '🖤';
    heartsEl.appendChild(heart);
  }
}

export function updateScore(score) {
  if (!scoreEl) return;
  scoreEl.textContent = Math.floor(score).toLocaleString();
}

export function updateFishCount(count) {
  if (!fishEl) return;
  fishEl.textContent = `🐟 ${count}`;
}

export function showMultiplier(show) {
  if (!multiplierEl) return;
  multiplierEl.classList.toggle('hidden', !show);
}

export function showHUD(visible) {
  if (hudContainer) {
    hudContainer.style.display = visible ? 'flex' : 'none';
  }
}
