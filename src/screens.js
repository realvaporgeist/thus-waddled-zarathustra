// src/screens.js

const GAME_OVER_QUIPS = [
  'THE ABYSS CLAIMED YOU',
  'THUS SPOKE... NOBODY',
  'BEYOND GOOD AND ALIVE',
  'THE ETERNAL RETURN AWAITS',
  'GOD IS DEAD. SO ARE YOU.',
  'WHAT KILLED YOU MADE YOU... DEAD',
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

export function createStartScreen(onStart) {
  startScreen = document.createElement('div');
  startScreen.id = 'start-screen';
  startScreen.innerHTML = `
    <h1 class="game-title">NIETZSCHE<br>PENGUIN</h1>
    <p class="subtitle">An Endless Run Toward Meaning</p>
    <p id="high-score-display"></p>
    <p class="start-prompt">TAP TO START</p>
    <button id="achievements-btn">ACHIEVEMENTS</button>
  `;

  document.getElementById('ui-overlay').appendChild(startScreen);

  const highScore = localStorage.getItem('np_highscore') || 0;
  document.getElementById('high-score-display').textContent =
    highScore > 0 ? `HIGH SCORE: ${Number(highScore).toLocaleString()}` : '';

  const startHandler = (e) => {
    if (e.type === 'keydown' && e.code !== 'Space' && e.code !== 'Enter') return;
    onStart();
  };
  startScreen.addEventListener('click', startHandler);
  window.addEventListener('keydown', startHandler, { once: true });

  return startScreen;
}

export function hideStartScreen() {
  if (startScreen) startScreen.style.display = 'none';
}

export function showStartScreen() {
  if (startScreen) {
    startScreen.style.display = 'flex';
    const highScore = localStorage.getItem('np_highscore') || 0;
    const el = document.getElementById('high-score-display');
    if (el) el.textContent = highScore > 0 ? `HIGH SCORE: ${Number(highScore).toLocaleString()}` : '';
  }
}

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
    ${newAchievements.length > 0 ? `
      <div class="gameover-achievements">
        <p>UNLOCKED:</p>
        ${newAchievements.map(a => `<p class="achievement-item">${a}</p>`).join('')}
      </div>
    ` : ''}
    <button id="restart-btn" class="game-btn">PLAY AGAIN</button>
  `;

  document.getElementById('ui-overlay').appendChild(gameOverScreen);

  const restartHandler = () => {
    gameOverScreen.remove();
    gameOverScreen = null;
    onRestart();
  };

  document.getElementById('restart-btn').addEventListener('click', restartHandler);
  window.addEventListener('keydown', function handler(e) {
    if (e.code === 'Space' || e.code === 'Enter') {
      window.removeEventListener('keydown', handler);
      restartHandler();
    }
  });
}

export function hideGameOverScreen() {
  if (gameOverScreen) {
    gameOverScreen.remove();
    gameOverScreen = null;
  }
}
