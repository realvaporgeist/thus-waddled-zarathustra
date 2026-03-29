// src/hud.js
import { MAX_HEARTS, SHIELD_MAX_DURATION, MAGNET_DURATION } from './constants.js';

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

  // Power-up icons (bottom-left)
  const powerupIcons = document.createElement('div');
  powerupIcons.id = 'powerup-icons';
  powerupIcons.innerHTML = `
    <div class="powerup-icon" id="pu-shield" style="display:none">
      <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="currentColor"/></svg>
      <svg class="pu-ring" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="100" stroke-dashoffset="0"/></svg>
    </div>
    <div class="powerup-icon" id="pu-magnet" style="display:none">
      <svg viewBox="0 0 24 24" width="20" height="20"><path d="M3 7v6a9 9 0 0018 0V7h-4v6a5 5 0 01-10 0V7H3z" fill="currentColor"/></svg>
      <svg class="pu-ring" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="100" stroke-dashoffset="0"/></svg>
    </div>
  `;
  document.body.appendChild(powerupIcons);

  // Earned ability button (bottom-right)
  const abilityBtn = document.createElement('button');
  abilityBtn.id = 'ability-btn';
  abilityBtn.style.display = 'none';
  abilityBtn.textContent = '\u231B';
  document.body.appendChild(abilityBtn);

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
  const puIcons = document.getElementById('powerup-icons');
  if (puIcons) puIcons.style.display = visible ? 'flex' : 'none';
  const abilBtn = document.getElementById('ability-btn');
  if (abilBtn && !visible) abilBtn.style.display = 'none';
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

export function updatePowerupIcons(effects) {
  const shield = document.getElementById('pu-shield');
  const magnet = document.getElementById('pu-magnet');
  if (shield) {
    shield.style.display = effects.shield ? 'flex' : 'none';
    if (effects.shield) {
      const ring = shield.querySelector('.pu-ring circle');
      if (ring) ring.style.strokeDashoffset = (1 - effects.shieldTimer / SHIELD_MAX_DURATION) * 100;
    }
  }
  if (magnet) {
    magnet.style.display = effects.magnet ? 'flex' : 'none';
    if (effects.magnet) {
      const ring = magnet.querySelector('.pu-ring circle');
      if (ring) ring.style.strokeDashoffset = (1 - effects.magnetTimer / MAGNET_DURATION) * 100;
    }
  }
}

export function updateAbilityButton(slowTimeCharged, rushCharged, selected) {
  const btn = document.getElementById('ability-btn');
  if (!btn) return;
  const hasAny = slowTimeCharged || rushCharged;
  btn.style.display = hasAny ? 'flex' : 'none';
  if (!hasAny) return;

  if (slowTimeCharged && rushCharged) {
    btn.textContent = selected === 'slowTime' ? '\u231B' : '\u26A1';
    btn.className = 'ability-dual';
  } else if (rushCharged) {
    btn.textContent = '\u26A1';
    btn.className = 'ability-rush';
  } else {
    btn.textContent = '\u231B';
    btn.className = 'ability-slow';
  }
}
