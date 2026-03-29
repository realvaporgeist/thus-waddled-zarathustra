// src/screens.js
import * as THREE from 'three';
import { getAllAchievements, getUnlockedAchievements, getCollectedFragments, QUOTE_DATA, getPersistentStats, getCompletedQuoteCount } from './achievements.js';
import { SKINS, getUnlockedSkinIds, getSelectedSkinId, selectSkin } from './skins.js';
import { PENGUIN_HEIGHT, PENGUIN_RADIUS } from './constants.js';

const GAME_OVER_QUIPS = [
  'THE ABYSS CLAIMED YOU', 'THUS SPOKE... NOBODY',
  'BEYOND GOOD AND ALIVE', 'THE ETERNAL RETURN AWAITS',
  'GOD IS DEAD. SO ARE YOU.', 'WHAT KILLED YOU MADE YOU... DEAD',
];
const GAME_OVER_QUOTES = [
  'He who fights with monsters should look to it that he himself does not become a monster.',
  'And if you gaze long into an abyss, the abyss also gazes into you.',
  'There is always some madness in love. But there is also always some reason in madness.',
  'In individuals, insanity is rare; but in groups, parties, nations and epochs, it is the rule.',
  'The snake which cannot cast its skin has to die.',
];

let startScreen = null;
let gameOverScreen = null;
let pauseScreen = null;

// ---------------------------------------------------------------------------
// Start screen
// ---------------------------------------------------------------------------
export function createStartScreen(onStart) {
  startScreen = document.createElement('div');
  startScreen.id = 'start-screen';
  startScreen.innerHTML = `
    <h1 class="game-title">THUS WADDLES<br>ZARATHUSTRA</h1>
    <p class="subtitle">An Endless Run Toward Meaning</p>
    <p id="high-score-display"></p>
    <p class="controls-hint">
      <span>ARROWS / WASD</span> move &middot;
      <span>SPACE / UP</span> jump &middot;
      <span>DOWN / SHIFT</span> slide<br>
      Jump over ground obstacles &middot; Slide under hanging ones
    </p>
    <p class="start-prompt">TAP TO START</p>
    <div class="menu-buttons">
      <button id="achievements-btn" class="game-btn">ACHIEVEMENTS</button>
      <button id="skins-btn" class="game-btn">SKINS</button>
    </div>
  `;
  document.getElementById('ui-overlay').appendChild(startScreen);

  document.getElementById('achievements-btn').addEventListener('click', (e) => { e.stopPropagation(); showAchievementsGallery(); });
  document.getElementById('skins-btn').addEventListener('click', (e) => { e.stopPropagation(); showSkinGallery(); });

  refreshHighScore();

  const startHandler = (e) => {
    if (e.target.tagName === 'BUTTON') return;
    if (e.type === 'keydown' && e.code !== 'Space' && e.code !== 'Enter') return;
    if (document.getElementById('achievements-gallery') || document.getElementById('skin-gallery')) return;
    onStart();
  };
  startScreen.addEventListener('click', startHandler);
  window.addEventListener('keydown', startHandler, { once: true });
  return startScreen;
}

function refreshHighScore() {
  const hs = localStorage.getItem('np_highscore') || 0;
  const el = document.getElementById('high-score-display');
  if (el) el.textContent = hs > 0 ? `HIGH SCORE: ${Number(hs).toLocaleString()}` : '';
}

export function hideStartScreen() { if (startScreen) startScreen.style.display = 'none'; }
export function showStartScreen() { if (startScreen) { startScreen.style.display = 'flex'; refreshHighScore(); } }

// ---------------------------------------------------------------------------
// Game over screen
// ---------------------------------------------------------------------------
export function showGameOverScreen(score, distance, fishCount, newAchievements, onRestart) {
  const prev = Number(localStorage.getItem('np_highscore') || 0);
  const isNewHigh = score > prev;
  if (isNewHigh) localStorage.setItem('np_highscore', Math.floor(score));

  gameOverScreen = document.createElement('div');
  gameOverScreen.id = 'gameover-screen';
  const quip = GAME_OVER_QUIPS[Math.floor(Math.random() * GAME_OVER_QUIPS.length)];
  const quote = GAME_OVER_QUOTES[Math.floor(Math.random() * GAME_OVER_QUOTES.length)];

  gameOverScreen.innerHTML = `
    <h1 class="gameover-title">${quip}</h1>
    ${isNewHigh ? '<p class="new-high">NEW HIGH SCORE!</p>' : ''}
    <div class="gameover-stats">
      <p>SCORE: ${Math.floor(score).toLocaleString()}</p>
      <p>DISTANCE: ${Math.floor(distance)}m</p>
      <p>FISH: ${fishCount}</p>
    </div>
    <p class="gameover-quote">"${quote}"</p>
    ${newAchievements.length > 0 ? `<div class="gameover-achievements"><p>UNLOCKED:</p>${newAchievements.map(a => `<p class="achievement-item">${a}</p>`).join('')}</div>` : ''}
    <button id="restart-btn" class="game-btn">PLAY AGAIN</button>
  `;
  document.getElementById('ui-overlay').appendChild(gameOverScreen);

  const restartHandler = () => { gameOverScreen.remove(); gameOverScreen = null; onRestart(); };
  document.getElementById('restart-btn').addEventListener('click', restartHandler);
  window.addEventListener('keydown', function handler(e) {
    if (e.code === 'Space' || e.code === 'Enter') { window.removeEventListener('keydown', handler); restartHandler(); }
  });
}

export function hideGameOverScreen() { if (gameOverScreen) { gameOverScreen.remove(); gameOverScreen = null; } }

// ---------------------------------------------------------------------------
// Pause screen
// ---------------------------------------------------------------------------
export function showPauseScreen(onResume, onQuit) {
  pauseScreen = document.createElement('div');
  pauseScreen.id = 'pause-screen';
  pauseScreen.innerHTML = `
    <h1 class="pause-title">PAUSED</h1>
    <div class="pause-controls">
      <span>ARROWS / WASD</span> — move lanes<br>
      <span>SPACE / UP</span> — jump over obstacles<br>
      <span>DOWN / SHIFT</span> — slide under obstacles<br>
      <span>ESC / P</span> — pause / resume
    </div>
    <button id="resume-btn" class="game-btn">RESUME</button>
    <button id="quit-btn" class="game-btn" style="background:#884444;">QUIT</button>
  `;
  document.getElementById('ui-overlay').appendChild(pauseScreen);
  document.getElementById('resume-btn').addEventListener('click', () => { hidePauseScreen(); onResume(); });
  document.getElementById('quit-btn').addEventListener('click', () => { hidePauseScreen(); onQuit(); });
}

export function hidePauseScreen() { if (pauseScreen) { pauseScreen.remove(); pauseScreen = null; } }

// ---------------------------------------------------------------------------
// Achievements gallery (with quote fragments)
// ---------------------------------------------------------------------------
export function showAchievementsGallery() {
  const overlay = document.createElement('div');
  overlay.id = 'achievements-gallery';

  const unlocked = getUnlockedAchievements();
  const allAchievements = getAllAchievements();
  const fragments = getCollectedFragments();

  overlay.innerHTML = `
    <h2 class="gallery-title">ACHIEVEMENTS</h2>
    <div class="gallery-section">
      <h3>MILESTONES (${unlocked.length}/${allAchievements.length})</h3>
      ${allAchievements.map(a => {
        const u = unlocked.includes(a.id);
        return `<div class="gallery-item ${u ? 'unlocked' : 'locked'}">
          <span class="gallery-icon">${u ? '&#x1F3C6;' : '&#x1F512;'}</span>
          <div class="gallery-info">
            <span class="gallery-name">${u ? a.name : '???'}</span>
            <span class="gallery-desc">${a.description}</span>
            ${u && a.flavor ? `<span class="gallery-flavor">${a.flavor}</span>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>
    <div class="gallery-section">
      <h3>NIETZSCHE QUOTES (${getCompletedQuoteCount()}/${QUOTE_DATA.length})</h3>
      ${QUOTE_DATA.map(q => {
        const have = fragments[q.id] || [];
        const complete = have.length >= q.fragments.length;
        return `<div class="gallery-item ${complete ? 'unlocked' : have.length > 0 ? 'partial' : 'locked'}">
          <span class="gallery-icon">${complete ? '&#x1F4DC;' : '&#x2753;'}</span>
          <div class="gallery-info">
            <span class="gallery-text">${q.fragments.map((f, i) =>
              have.includes(i) ? `<span class="frag-found">${f}</span>` : `<span class="frag-missing">???</span>`
            ).join(' ')}</span>
            <span class="gallery-desc">${have.length}/${q.fragments.length} fragments</span>
          </div>
        </div>`;
      }).join('')}
    </div>
    <button id="gallery-close" class="game-btn">BACK</button>
  `;
  document.getElementById('ui-overlay').appendChild(overlay);
  document.getElementById('gallery-close').addEventListener('click', () => overlay.remove());
}

// ---------------------------------------------------------------------------
// Skin gallery
// ---------------------------------------------------------------------------
let skinChangeCallback = null;
export function onSkinChange(cb) { skinChangeCallback = cb; }

export function showSkinGallery() {
  const overlay = document.createElement('div');
  overlay.id = 'skin-gallery';

  const stats = getPersistentStats();
  const unlockedIds = getUnlockedSkinIds(stats);
  const selectedId = getSelectedSkinId();

  overlay.innerHTML = `
    <h2 class="gallery-title">SKINS</h2>
    <div class="skin-preview-container">
      <canvas id="skin-preview-canvas"></canvas>
      <p class="skin-preview-name" id="skin-preview-name"></p>
    </div>
    <div class="gallery-section">
      ${SKINS.map(s => {
        const u = unlockedIds.includes(s.id);
        const sel = s.id === selectedId;
        return `<div class="skin-item ${u ? 'unlocked' : 'locked'} ${sel ? 'selected' : ''}" data-skin="${s.id}">
          <div class="skin-preview">
            <div class="skin-circle" style="background:${hexToCss(s.colors.body)};border:3px solid ${hexToCss(s.colors.belly)}"></div>
          </div>
          <div class="gallery-info">
            <span class="gallery-name">${u ? s.name : '???'}</span>
            <span class="gallery-desc">${u ? s.desc : s.unlock?.label || ''}</span>
            ${sel ? '<span class="skin-selected-label">EQUIPPED</span>' : ''}
          </div>
        </div>`;
      }).join('')}
    </div>
    <button id="skin-close" class="game-btn">BACK</button>
  `;

  document.getElementById('ui-overlay').appendChild(overlay);

  // Initialize 3D preview
  const previewCanvas = document.getElementById('skin-preview-canvas');
  const previewNameEl = document.getElementById('skin-preview-name');
  initPreview(previewCanvas);

  // Show selected skin initially
  const selectedSkin = SKINS.find(s => s.id === selectedId) || SKINS[0];
  applyPreviewSkin(previewState.materials, selectedSkin);
  previewNameEl.textContent = selectedSkin.name;

  // Hover to preview unlocked skins
  overlay.querySelectorAll('.skin-item.unlocked').forEach(el => {
    el.addEventListener('mouseenter', () => {
      const skin = SKINS.find(s => s.id === el.dataset.skin);
      if (skin && previewState) {
        applyPreviewSkin(previewState.materials, skin);
        previewNameEl.textContent = skin.name;
      }
    });
  });

  // Reset to selected on mouse leave from the list
  overlay.querySelector('.gallery-section').addEventListener('mouseleave', () => {
    if (previewState) {
      applyPreviewSkin(previewState.materials, selectedSkin);
      previewNameEl.textContent = selectedSkin.name;
    }
  });

  overlay.querySelectorAll('.skin-item.unlocked').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.skin;
      selectSkin(id);
      if (skinChangeCallback) skinChangeCallback(id);
      destroyPreview();
      overlay.remove();
      showSkinGallery(); // refresh
    });
  });

  document.getElementById('skin-close').addEventListener('click', () => {
    destroyPreview();
    overlay.remove();
  });
}

// ---------------------------------------------------------------------------
// Penguin 3D preview for skin gallery
// ---------------------------------------------------------------------------
let previewState = null; // { renderer, scene, camera, penguin, materials, animId }

function createPreviewPenguin() {
  const group = new THREE.Group();
  const mats = {};

  const bodyGeo = new THREE.SphereGeometry(PENGUIN_RADIUS, 16, 12);
  mats.body = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
  const body = new THREE.Mesh(bodyGeo, mats.body);
  body.scale.set(1, 1.4, 0.9);
  body.position.y = PENGUIN_HEIGHT * 0.45;
  group.add(body);

  const bellyGeo = new THREE.SphereGeometry(PENGUIN_RADIUS * 0.7, 12, 10);
  mats.belly = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const belly = new THREE.Mesh(bellyGeo, mats.belly);
  belly.scale.set(0.8, 1.2, 0.6);
  belly.position.set(0, PENGUIN_HEIGHT * 0.4, PENGUIN_RADIUS * 0.35);
  group.add(belly);

  const headGeo = new THREE.SphereGeometry(PENGUIN_RADIUS * 0.6, 12, 10);
  mats.head = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
  const head = new THREE.Mesh(headGeo, mats.head);
  head.position.y = PENGUIN_HEIGHT * 0.85;
  group.add(head);

  const eyeWhiteGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const pupilGeo = new THREE.SphereGeometry(0.035, 8, 8);
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
  for (const xOff of [-0.1, 0.1]) {
    const ew = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    ew.position.set(xOff, PENGUIN_HEIGHT * 0.88, PENGUIN_RADIUS * 0.5);
    group.add(ew);
    const p = new THREE.Mesh(pupilGeo, pupilMat);
    p.position.set(xOff, PENGUIN_HEIGHT * 0.88, PENGUIN_RADIUS * 0.55);
    group.add(p);
  }

  const beakGeo = new THREE.ConeGeometry(0.06, 0.18, 8);
  mats.beak = new THREE.MeshStandardMaterial({ color: 0xff8c00 });
  const beak = new THREE.Mesh(beakGeo, mats.beak);
  beak.position.set(0, PENGUIN_HEIGHT * 0.82, PENGUIN_RADIUS * 0.65);
  beak.rotation.x = Math.PI / 2;
  group.add(beak);

  const footGeo = new THREE.BoxGeometry(0.15, 0.05, 0.2);
  mats.feet = new THREE.MeshStandardMaterial({ color: 0xff8c00 });
  const lf = new THREE.Mesh(footGeo, mats.feet);
  lf.position.set(-0.12, 0.025, 0.05);
  group.add(lf);
  const rf = new THREE.Mesh(footGeo, mats.feet);
  rf.position.set(0.12, 0.025, 0.05);
  group.add(rf);

  const wingGeo = new THREE.BoxGeometry(0.08, 0.35, 0.2);
  mats.wings = new THREE.MeshStandardMaterial({ color: 0x2a2a4a });
  const lw = new THREE.Mesh(wingGeo, mats.wings);
  lw.position.set(-PENGUIN_RADIUS - 0.04, PENGUIN_HEIGHT * 0.45, 0);
  group.add(lw);
  const rw = new THREE.Mesh(wingGeo, mats.wings);
  rw.position.set(PENGUIN_RADIUS + 0.04, PENGUIN_HEIGHT * 0.45, 0);
  group.add(rw);

  return { group, mats };
}

function applyPreviewSkin(mats, skin) {
  const c = skin.colors;
  mats.body.color.setHex(c.body);
  mats.belly.color.setHex(c.belly);
  mats.head.color.setHex(c.head);
  mats.beak.color.setHex(c.beak);
  mats.feet.color.setHex(c.feet);
  mats.wings.color.setHex(c.wings);

  const allMats = [mats.body, mats.belly, mats.head, mats.wings];
  for (const m of allMats) {
    m.transparent = !!skin.transparent;
    m.opacity = skin.transparent ? 0.55 : 1;
    m.metalness = skin.metallic ? 0.7 : 0;
    m.roughness = skin.metallic ? 0.3 : (m === mats.belly ? 0.5 : 0.6);
  }
}

function initPreview(canvas) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 50);
  camera.position.set(0, 0.8, 3.2);
  camera.lookAt(0, 0.55, 0);

  scene.add(new THREE.AmbientLight(0xddeeff, 0.8));
  const dl = new THREE.DirectionalLight(0xffffff, 0.7);
  dl.position.set(3, 5, 4);
  scene.add(dl);
  const rl = new THREE.DirectionalLight(0x8899cc, 0.3);
  rl.position.set(-3, 2, -2);
  scene.add(rl);

  const { group, mats } = createPreviewPenguin();
  scene.add(group);

  previewState = { renderer, scene, camera, penguin: group, materials: mats, animId: null };

  function animate() {
    if (!previewState) return;
    previewState.animId = requestAnimationFrame(animate);
    group.rotation.y += 0.008;
    // Gentle waddle
    const t = performance.now() * 0.002;
    group.children[0].rotation.z = Math.sin(t) * 0.03; // body
    renderer.render(scene, camera);
  }
  animate();
}

function destroyPreview() {
  if (!previewState) return;
  cancelAnimationFrame(previewState.animId);
  previewState.renderer.dispose();
  previewState = null;
}

function hexToCss(hex) {
  return '#' + hex.toString(16).padStart(6, '0');
}
