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
let comboContainer = null;

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

  // Dread timer bar
  const dreadBar = document.createElement('div');
  dreadBar.id = 'dread-timer-bar';
  dreadBar.className = 'hidden';
  dreadBar.innerHTML = '<div id="dread-timer-fill"></div>';
  document.getElementById('ui-overlay').appendChild(dreadBar);

  // Combo meter bar
  comboContainer = document.createElement('div');
  comboContainer.id = 'combo-container';
  comboContainer.innerHTML = `
    <div id="combo-label">MORTAL — 1.0x</div>
    <div id="combo-bar"><div id="combo-fill"></div></div>
  `;
  document.body.appendChild(comboContainer);

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
  if (comboContainer) comboContainer.style.display = visible ? 'block' : 'none';
}

export function showToast(text, duration = 2000) {
  if (!toastEl) return;
  toastEl.textContent = text;
  toastEl.classList.remove('hidden');
  toastEl.classList.remove('toast-slide-in');
  toastEl.classList.remove('toast-slide-out');
  void toastEl.offsetWidth;
  toastEl.classList.add('toast-slide-in');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('toast-slide-in');
    toastEl.classList.add('toast-slide-out');
    setTimeout(() => {
      toastEl.classList.add('hidden');
      toastEl.classList.remove('toast-slide-out');
    }, 300);
  }, duration);
}

export function bounceScore() {
  if (!scoreEl) return;
  scoreEl.classList.remove('score-bounce');
  void scoreEl.offsetWidth;
  scoreEl.classList.add('score-bounce');
}

export function shakeHeart(index) {
  if (!heartsEl) return;
  const hearts = heartsEl.querySelectorAll('.heart');
  if (hearts[index]) {
    hearts[index].classList.add('heart-shake');
    setTimeout(() => hearts[index].classList.remove('heart-shake'), 300);
  }
}

export function pulseLastHeart() {
  if (!heartsEl) return;
  const hearts = heartsEl.querySelectorAll('.heart');
  for (const h of hearts) {
    h.classList.remove('heart-pulse');
  }
  const visibleHearts = [...hearts].filter(h => h.textContent === '\u2764\uFE0F');
  if (visibleHearts.length === 1) {
    visibleHearts[0].classList.add('heart-pulse');
  }
}

export function updateDreadTimerBar(progress, visible) {
  const bar = document.getElementById('dread-timer-bar');
  const fill = document.getElementById('dread-timer-fill');
  if (!bar || !fill) return;
  bar.classList.toggle('hidden', !visible);
  fill.style.width = `${progress * 100}%`;
}

export function updateComboBar(meter, tier) {
  const label = document.getElementById('combo-label');
  const fill = document.getElementById('combo-fill');
  const container = document.getElementById('combo-container');
  if (!label || !fill || !container) return;
  label.textContent = `${tier.name} — ${tier.multiplier}x`;
  label.style.color = tier.color;
  fill.style.width = `${meter * 100}%`;
  fill.style.background = `linear-gradient(90deg, ${tier.color}88, ${tier.color})`;
  container.classList.toggle('combo-pulse', tier.name === 'Übermensch');
}

export function flashComboTierUp(tier) {
  showToast(`${tier.name.toUpperCase()} — ${tier.multiplier}x!`, 1500);
}
