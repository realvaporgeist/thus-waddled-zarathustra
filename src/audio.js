// src/audio.js — Procedural SFX + MP3 music with crossfading
import menuTrackUrl from '../assets/sounds/music/Main Menu.mp3';
import gameplayTrackUrl from '../assets/sounds/music/Main Loop.mp3';
import dreadTrackUrl from '../assets/sounds/music/Dread Mode.mp3';
import creditsTrackUrl from '../assets/sounds/music/Credits.mp3';

let ctx = null;
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

// ---------------------------------------------------------------------------
// Procedural SFX (unchanged)
// ---------------------------------------------------------------------------
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
  [330, 440, 554, 660, 880].forEach((f, i) => {
    osc('sine', f, t + i * 0.08, 0.5 - i * 0.05, 0.06);
  });
}

// ---------------------------------------------------------------------------
// MP3 music system — crossfading between tracks
// ---------------------------------------------------------------------------
const TRACK_URLS = {
  menu: menuTrackUrl,
  gameplay: gameplayTrackUrl,
  dread: dreadTrackUrl,
  credits: creditsTrackUrl,
};

const CROSSFADE_DURATION = 1.0; // seconds
const MUSIC_VOLUME = 0.35;

let rawTrackData = {};    // name → ArrayBuffer (raw fetch, no AudioContext needed)
let trackBuffers = {};    // name → AudioBuffer (decoded, needs AudioContext)
let currentSource = null;
let currentGainNode = null;
let currentTrackName = null;
let musicPaused = false;
let prefetchPromise = null;

// Fetch raw MP3 bytes — safe to call before any user gesture
function prefetchMusic() {
  if (prefetchPromise) return prefetchPromise;
  prefetchPromise = Promise.all(
    Object.entries(TRACK_URLS).map(async ([name, url]) => {
      try {
        const resp = await fetch(url);
        rawTrackData[name] = await resp.arrayBuffer();
      } catch (e) {
        console.warn(`Failed to fetch music track "${name}":`, e);
      }
    }),
  );
  return prefetchPromise;
}

// Decode a single track on demand — requires AudioContext
async function ensureDecoded(name) {
  if (trackBuffers[name]) return trackBuffers[name];
  const raw = rawTrackData[name];
  if (!raw) return null;
  const c = ensureCtx();
  try {
    trackBuffers[name] = await c.decodeAudioData(raw.slice(0));
  } catch (e) {
    console.warn(`Failed to decode music track "${name}":`, e);
  }
  return trackBuffers[name] || null;
}

export async function playTrack(name) {
  const c = ensureCtx();
  await prefetchPromise;

  // Resume the same paused track instead of restarting
  if (name === currentTrackName && musicPaused) {
    resumeMusic();
    return;
  }

  if (name === currentTrackName && !musicPaused) return;

  const buffer = await ensureDecoded(name);
  if (!buffer) return;

  musicPaused = false;
  const t = c.currentTime;

  // Crossfade out old track
  if (currentSource && currentGainNode) {
    const oldGain = currentGainNode;
    const oldSource = currentSource;
    oldGain.gain.cancelScheduledValues(t);
    oldGain.gain.setValueAtTime(oldGain.gain.value, t);
    oldGain.gain.linearRampToValueAtTime(0.001, t + CROSSFADE_DURATION);
    setTimeout(() => {
      try { oldSource.stop(); } catch {}
      try { oldGain.disconnect(); } catch {}
    }, (CROSSFADE_DURATION + 0.1) * 1000);
  }

  // Fade in new track
  const source = c.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const gain = c.createGain();
  gain.gain.setValueAtTime(0.001, t);
  gain.gain.linearRampToValueAtTime(MUSIC_VOLUME, t + CROSSFADE_DURATION);

  source.connect(gain);
  gain.connect(masterGain);
  source.start(0);

  currentSource = source;
  currentGainNode = gain;
  currentTrackName = name;
}

export function fadeOutMusic() {
  if (!currentSource || !currentGainNode) return;
  const c = ensureCtx();
  const t = c.currentTime;
  musicPaused = true;
  currentGainNode.gain.cancelScheduledValues(t);
  currentGainNode.gain.setValueAtTime(currentGainNode.gain.value, t);
  currentGainNode.gain.linearRampToValueAtTime(0.001, t + CROSSFADE_DURATION);
}

export function resumeMusic() {
  if (!currentGainNode || !musicPaused) return;
  const c = ensureCtx();
  const t = c.currentTime;
  musicPaused = false;
  currentGainNode.gain.cancelScheduledValues(t);
  currentGainNode.gain.setValueAtTime(currentGainNode.gain.value, t);
  currentGainNode.gain.linearRampToValueAtTime(MUSIC_VOLUME, t + CROSSFADE_DURATION);
}

// Start fetching MP3 bytes immediately on module load (no AudioContext needed)
prefetchMusic();

export function initAudio() {
  // Called from a user gesture (splash screen dismiss) so AudioContext is allowed.
  // MP3 bytes are already fetched — decode menu track and play, then decode the rest.
  playTrack('menu').then(() => {
    Object.keys(TRACK_URLS).forEach((name) => ensureDecoded(name));
  });
}
