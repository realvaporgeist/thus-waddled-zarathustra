// src/controls.js
import { SWIPE_THRESHOLD, SWIPE_MAX_TIME } from './constants.js';

let onLeft = null;
let onRight = null;
let onJump = null;
let onSlide = null;
let onAction = null;
let onPause = null;
let onAbility = null;
let onAbilityHold = null;

let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;

export function initControls(callbacks) {
  onLeft = callbacks.onLeft;
  onRight = callbacks.onRight;
  onJump = callbacks.onJump;
  onSlide = callbacks.onSlide;
  onAction = callbacks.onAction;
  onPause = callbacks.onPause;
  onAbility = callbacks.onAbility;
  onAbilityHold = callbacks.onAbilityHold;

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('touchstart', handleTouchStart, { passive: false });
  window.addEventListener('touchend', handleTouchEnd, { passive: false });

  // Earned ability button
  const abilityBtn = document.getElementById('ability-btn');
  if (abilityBtn) {
    let holdTimer = null;
    let held = false;
    abilityBtn.addEventListener('pointerdown', () => {
      held = false;
      holdTimer = setTimeout(() => { held = true; callbacks.onAbilityHold?.(); }, 500);
    });
    abilityBtn.addEventListener('pointerup', () => {
      clearTimeout(holdTimer);
      if (!held) callbacks.onAbility?.();
    });
    abilityBtn.addEventListener('pointerleave', () => clearTimeout(holdTimer));
  }
}

function handleKeyDown(e) {
  switch (e.code) {
    case 'ArrowLeft':
    case 'KeyA':
      onLeft?.();
      break;
    case 'ArrowRight':
    case 'KeyD':
      onRight?.();
      break;
    case 'ArrowUp':
    case 'KeyW':
    case 'Space':
      e.preventDefault();
      onJump?.();
      break;
    case 'ArrowDown':
    case 'KeyS':
    case 'ShiftLeft':
    case 'ShiftRight':
      onSlide?.();
      break;
    case 'Enter':
      onAction?.();
      break;
    case 'Escape':
    case 'KeyP':
      onPause?.();
      break;
    case 'KeyE':
      onAbility?.();
      break;
  }
}

function handleTouchStart(e) {
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchStartTime = performance.now();
}

function handleTouchEnd(e) {
  const touch = e.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;
  const dt = performance.now() - touchStartTime;

  if (dt > SWIPE_MAX_TIME) {
    onAction?.();
    return;
  }

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx < SWIPE_THRESHOLD && absDy < SWIPE_THRESHOLD) {
    onAction?.();
    return;
  }

  if (absDx > absDy) {
    if (dx < -SWIPE_THRESHOLD) onLeft?.();
    else if (dx > SWIPE_THRESHOLD) onRight?.();
  } else {
    if (dy < -SWIPE_THRESHOLD) onJump?.();
    else if (dy > SWIPE_THRESHOLD) onSlide?.();
  }
}

export function destroyControls() {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('touchstart', handleTouchStart);
  window.removeEventListener('touchend', handleTouchEnd);
}
