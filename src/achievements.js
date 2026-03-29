// src/achievements.js

const MILESTONE_ACHIEVEMENTS = [
  { id: 'first_steps', name: 'First Steps', description: 'Run 100m', check: (stats) => stats.distance >= 100 },
  { id: 'long_walk', name: 'The Long Walk', description: 'Run 1km', check: (stats) => stats.distance >= 1000 },
  { id: 'ubermensch', name: 'Ubermensch', description: 'Run 5km', check: (stats) => stats.distance >= 5000 },
  { id: 'stared_abyss', name: 'Stared Into the Abyss', description: 'Survive 1 dread sequence', check: (stats) => stats.dreadsSurvived >= 1 },
  { id: 'abyss_veteran', name: 'Abyss Veteran', description: 'Survive 10 dread sequences total', check: (stats) => stats.totalDreadsSurvived >= 10 },
  { id: 'fish_philosopher', name: 'Fish Philosopher', description: 'Collect 100 fish in one run', check: (stats) => stats.fishThisRun >= 100 },
  { id: 'eternal_return', name: 'Eternal Return', description: 'Play 10 games', check: (stats) => stats.totalGames >= 10 },
  { id: 'beyond_good_evil', name: 'Beyond Good and Evil', description: 'Score 10,000 points', check: (stats) => stats.score >= 10000 },
];

const STORAGE_KEY = 'np_achievements';
const QUOTES_KEY = 'np_quotes';
const STATS_KEY = 'np_stats';

function loadData(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function getUnlockedAchievements() { return loadData(STORAGE_KEY, []); }
export function getCollectedQuotes() { return loadData(QUOTES_KEY, []); }
export function getPersistentStats() { return loadData(STATS_KEY, { totalDreadsSurvived: 0, totalGames: 0 }); }

export function collectQuote(quoteText) {
  const quotes = getCollectedQuotes();
  if (!quotes.includes(quoteText)) {
    quotes.push(quoteText);
    saveData(QUOTES_KEY, quotes);
    return true;
  }
  return false;
}

export function checkAchievements(runStats) {
  const unlocked = getUnlockedAchievements();
  const newlyUnlocked = [];
  for (const achievement of MILESTONE_ACHIEVEMENTS) {
    if (!unlocked.includes(achievement.id) && achievement.check(runStats)) {
      unlocked.push(achievement.id);
      newlyUnlocked.push(achievement.name);
    }
  }
  saveData(STORAGE_KEY, unlocked);
  return newlyUnlocked;
}

export function incrementPersistentStats(runStats) {
  const stats = getPersistentStats();
  stats.totalDreadsSurvived += runStats.dreadsSurvived || 0;
  stats.totalGames += 1;
  saveData(STATS_KEY, stats);
  return stats;
}

export function getAllAchievements() { return MILESTONE_ACHIEVEMENTS; }
