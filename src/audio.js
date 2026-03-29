// src/audio.js — Procedural audio via Web Audio API
let ctx = null;
let musicGain = null;
let musicNodes = [];
let musicPlaying = false;
let masterGain = null;

function ensureCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 1;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function osc(type, freq, startTime, duration, volume, rampTo) {
  const c = ensureCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, startTime);
  if (rampTo) o.frequency.exponentialRampToValueAtTime(rampTo, startTime + duration * 0.8);
  g.gain.setValueAtTime(volume, startTime);
  g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  o.connect(g);
  g.connect(masterGain);
  o.start(startTime);
  o.stop(startTime + duration);
}

export function initAudio() {
  // Context is created lazily on first user interaction
}

export function playJump() {
  const c = ensureCtx();
  const t = c.currentTime;
  osc('sine', 300, t, 0.15, 0.12, 600);
  osc('sine', 450, t + 0.02, 0.12, 0.06, 800);
}

export function playHit() {
  const c = ensureCtx();
  const t = c.currentTime;
  osc('square', 80, t, 0.25, 0.18, 35);
  osc('sawtooth', 120, t, 0.15, 0.08, 50);
}

export function playCollect() {
  const c = ensureCtx();
  const t = c.currentTime;
  osc('sine', 800, t, 0.1, 0.1);
  osc('sine', 1200, t + 0.06, 0.12, 0.08);
  osc('sine', 1600, t + 0.1, 0.08, 0.05);
}

export function playGoldenCollect() {
  const c = ensureCtx();
  const t = c.currentTime;
  [800, 1000, 1200, 1500, 1800].forEach((f, i) => {
    osc('sine', f, t + i * 0.04, 0.18, 0.08);
  });
}

export function playDreadEnter() {
  const c = ensureCtx();
  const t = c.currentTime;
  // Ominous ascending rumble
  const o = c.createOscillator();
  const g = c.createGain();
  const filt = c.createBiquadFilter();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(35, t);
  o.frequency.exponentialRampToValueAtTime(80, t + 1.5);
  filt.type = 'lowpass';
  filt.frequency.value = 200;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.15, t + 0.8);
  g.gain.linearRampToValueAtTime(0.06, t + 1.5);
  o.connect(filt);
  filt.connect(g);
  g.connect(masterGain);
  o.start(t);
  o.stop(t + 1.5);

  osc('sine', 55, t + 0.3, 1.2, 0.08, 110);
}

export function playDreadExit() {
  const c = ensureCtx();
  const t = c.currentTime;
  [220, 330, 440, 550].forEach((f, i) => {
    osc('sine', f, t + i * 0.08, 0.35, 0.07);
  });
}

export function playGameOver() {
  const c = ensureCtx();
  const t = c.currentTime;
  [440, 370, 330, 220, 165].forEach((f, i) => {
    osc('triangle', f, t + i * 0.22, 0.35, 0.1);
  });
}

export function playQuoteCollect() {
  const c = ensureCtx();
  const t = c.currentTime;
  // Mysterious harp-like arpeggio
  [330, 440, 554, 660, 880].forEach((f, i) => {
    osc('sine', f, t + i * 0.08, 0.5 - i * 0.05, 0.06);
  });
}

// ---------------------------------------------------------------------------
// Background music — atmospheric drone
// ---------------------------------------------------------------------------
export function startMusic() {
  const c = ensureCtx();
  if (musicPlaying) return;
  musicPlaying = true;

  musicGain = c.createGain();
  musicGain.gain.value = 0.05;
  musicGain.connect(masterGain);

  // Base drone A1
  const o1 = c.createOscillator();
  o1.type = 'sine';
  o1.frequency.value = 55;
  o1.connect(musicGain);
  o1.start();

  // Fifth E2
  const o2 = c.createOscillator();
  o2.type = 'sine';
  o2.frequency.value = 82.5;
  const g2 = c.createGain();
  g2.gain.value = 0.4;
  o2.connect(g2);
  g2.connect(musicGain);
  o2.start();

  // Octave A2 (subtle)
  const o3 = c.createOscillator();
  o3.type = 'triangle';
  o3.frequency.value = 110;
  const g3 = c.createGain();
  g3.gain.value = 0.15;
  o3.connect(g3);
  g3.connect(musicGain);
  o3.start();

  // LFO for slow drift
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.06;
  const lfoG = c.createGain();
  lfoG.gain.value = 3;
  lfo.connect(lfoG);
  lfoG.connect(o1.frequency);
  lfo.start();

  // High shimmer A4
  const o4 = c.createOscillator();
  o4.type = 'sine';
  o4.frequency.value = 440;
  const g4 = c.createGain();
  g4.gain.value = 0.02;
  o4.connect(g4);
  g4.connect(musicGain);
  o4.start();

  // LFO for shimmer volume
  const lfo2 = c.createOscillator();
  lfo2.frequency.value = 0.12;
  const lfoG2 = c.createGain();
  lfoG2.gain.value = 0.015;
  lfo2.connect(lfoG2);
  lfoG2.connect(g4.gain);
  lfo2.start();

  musicNodes = [o1, o2, o3, o4, lfo, lfo2];
}

export function stopMusic() {
  if (!musicPlaying) return;
  musicPlaying = false;
  for (const n of musicNodes) { try { n.stop(); } catch {} }
  musicNodes = [];
  musicGain = null;
}

export function setMusicPlaying(playing) {
  if (playing) startMusic();
  else stopMusic();
}
