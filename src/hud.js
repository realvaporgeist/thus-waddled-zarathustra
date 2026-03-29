// src/hud.js
import { MAX_HEARTS } from './constants.js';

let hudContainer = null;
let heartsEl = null;
let scoreEl = null;
let fishEl = null;
let multiplierEl = null;
let pauseBtn = null;
let toastEl = null;
let toastTimer = null;

export function createHUD(onPause) {
  hudContainer = document.createElement('div');
  hudContainer.id = 'hud';
  hudContainer.innerHTML = `
    <div id="hud-left">
      <div id="hud-hearts"></div>
      <div id="hud-fish">&#x1F41F; 0</div>
    </div>
    <div id="hud-score">0</div>
    <div id="hud-multiplier" class="hidden">2X</div>
  `;
  document.getElementById('ui-overlay').appendChild(hudContainer);

  // Pause button — separate from HUD layout to avoid overlap
  pauseBtn = document.createElement('button');
  pauseBtn.id = 'hud-pause';
  pauseBtn.innerHTML = '&#x23F8;'; // pause icon
  pauseBtn.addEventListener('click', (e) => { e.stopPropagation(); if (onPause) onPause(); });
  document.getElementById('ui-overlay').appendChild(pauseBtn);

  // Toast notification
  toastEl = document.createElement('div');
  toastEl.id = 'hud-toast';
  toastEl.className = 'hidden';
  document.getElementById('ui-overlay').appendChild(toastEl);

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
    heart.textContent = i < hearts ? '\u2764\uFE0F' : '\u{1F5A4}';
    heartsEl.appendChild(heart);
  }
}

export function updateScore(score) {
  if (!scoreEl) return;
  scoreEl.textContent = Math.floor(score).toLocaleString();
}

export function updateFishCount(count) {
  if (!fishEl) return;
  fishEl.textContent = `\u{1F41F} ${count}`;
}

export function showMultiplier(show) {
  if (!multiplierEl) return;
  multiplierEl.classList.toggle('hidden', !show);
}

export function showHUD(visible) {
  if (hudContainer) hudContainer.style.display = visible ? 'flex' : 'none';
  if (pauseBtn) pauseBtn.style.display = visible ? 'block' : 'none';
}

export function showToast(text, duration = 2000) {
  if (!toastEl) return;
  toastEl.textContent = text;
  toastEl.classList.remove('hidden');
  toastEl.classList.remove('toast-fade');
  void toastEl.offsetWidth; // reflow
  toastEl.classList.add('toast-fade');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.add('hidden'), duration);
}
