// src/screens.js
import { getAllAchievements, getUnlockedAchievements, getCollectedFragments, QUOTE_DATA, getPersistentStats, getCompletedQuoteCount } from './achievements.js';
import { SKINS, getUnlockedSkinIds, getSelectedSkinId, selectSkin } from './skins.js';

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
    <h1 class="game-title">NIETZSCHE<br>PENGUIN</h1>
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

  overlay.querySelectorAll('.skin-item.unlocked').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.skin;
      selectSkin(id);
      if (skinChangeCallback) skinChangeCallback(id);
      overlay.remove();
      showSkinGallery(); // refresh
    });
  });

  document.getElementById('skin-close').addEventListener('click', () => overlay.remove());
}

function hexToCss(hex) {
  return '#' + hex.toString(16).padStart(6, '0');
}
