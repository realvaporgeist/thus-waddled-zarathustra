// src/achievements.js

const MILESTONE_ACHIEVEMENTS = [
  // Distance
  { id: 'first_steps', name: 'First Steps', description: 'Run 100m', flavor: 'Every long journey begins with a single waddle.', check: s => s.distance >= 100 },
  { id: 'long_walk', name: 'The Long Walk', description: 'Run 1km', flavor: 'The path of the overpenguin is a lonely one.', check: s => s.distance >= 1000 },
  { id: 'marathon', name: 'Marathon', description: 'Run 2km in one run', flavor: 'Endurance is the truest form of strength.', check: s => s.distance >= 2000 },
  { id: 'ubermensch', name: 'Ubermensch', description: 'Run 5km in one run', flavor: 'You have become that which surpasses the penguin.', check: s => s.distance >= 5000 },

  // Score
  { id: 'beyond_good_evil', name: 'Beyond Good and Evil', description: 'Score 10,000', flavor: 'Morality is for those who stop counting.', check: s => s.score >= 10000 },
  { id: 'master', name: 'Will to Power', description: 'Score 50,000', flavor: 'The will to power is the will to points.', check: s => s.score >= 50000 },

  // Dread
  { id: 'stared_abyss', name: 'Stared Into the Abyss', description: 'Survive 1 dread', flavor: 'The abyss gazed back. You did not blink.', check: s => s.dreadsSurvived >= 1 },
  { id: 'abyss_veteran', name: 'Abyss Veteran', description: 'Survive 10 dreads total', flavor: 'The darkness is now an old friend.', check: s => s.totalDreadsSurvived >= 10 },
  { id: 'abyss_master', name: 'Lord of the Abyss', description: 'Survive 30 dreads total', flavor: 'You are the abyss now.', check: s => s.totalDreadsSurvived >= 30 },

  // Fish
  { id: 'fish_philosopher', name: 'Fish Philosopher', description: 'Collect 100 fish in one run', flavor: 'A diet worthy of deep contemplation.', check: s => s.fishThisRun >= 100 },
  { id: 'golden_touch', name: 'Golden Touch', description: 'Collect 10 golden fish in one run', flavor: 'Midas would be envious.', check: s => s.goldenFishThisRun >= 10 },
  { id: 'collector', name: 'The Collector', description: 'Collect 500 fish total', flavor: 'The sea weeps at your appetite.', check: s => s.totalFish >= 500 },

  // Games
  { id: 'eternal_return', name: 'Eternal Return', description: 'Play 10 games', flavor: 'Would you live this run again, infinitely?', check: s => s.totalGames >= 10 },
  { id: 'eternal_return_2', name: 'Amor Fati', description: 'Play 50 games', flavor: 'To love one\'s fate, even this fate.', check: s => s.totalGames >= 50 },

  // Quotes
  { id: 'deep_thinker', name: 'Deep Thinker', description: 'Complete all 8 quotes', flavor: 'The philosopher has nothing left to learn... almost.', check: s => s.completedQuotes >= 8 },

  // Skill-based
  { id: 'speed_demon', name: 'Speed Demon', description: 'Reach max speed', flavor: 'Faster than thought itself.', check: s => s.maxSpeedReached },
  { id: 'nihilist', name: 'Nihilist', description: 'Die within 5 seconds', flavor: 'Nothing matters. Especially survival.', check: s => s.quickDeath },
  { id: 'unstoppable', name: 'Unstoppable', description: 'Run 500m without taking damage', flavor: 'An unstoppable force meets no object.', check: s => s.longestNoDamage >= 500 },

  // Phase 2
  { id: 'longWalk70k', name: '70,000 Meters From Home', description: 'Travel 70,000m in a single run', flavor: 'The march continues...', check: s => s.distance >= 70000 },
  { id: 'discoMode', name: 'Dance of Eternity', description: 'Trigger disco mode', flavor: 'All four at once!', check: s => s.discoTriggered },
  { id: 'bossSlayer', name: 'Beyond All Monsters', description: 'Defeat all 5 boss types', flavor: 'What does not kill you...', check: s => s.uniqueBossesDefeated >= 5 },
  { id: 'comboMax', name: 'The Übermensch Cometh', description: 'Reach Übermensch combo tier', flavor: 'Man is something to be surpassed.', check: s => s.reachedUbermensch },
  { id: 'weatherSurvivor', name: 'Storm Walker', description: 'Survive 3 blizzards in one run', flavor: 'Love of fate.', check: s => s.blizzardsSurvived >= 3 },
  { id: 'shieldBreaker', name: 'Glass Philosophy', description: 'Break 10 shields in one run', flavor: 'Fragile truths.', check: s => s.shieldsBroken >= 10 },
  { id: 'noHitBoss', name: 'Untouchable', description: 'Defeat any boss without taking damage', flavor: 'Perfection in adversity.', check: s => s.cleanBossDefeat },
];

// ---------------------------------------------------------------------------
// Quote fragment system
// ---------------------------------------------------------------------------
export const QUOTE_DATA = [
  { id: 'q0', fragments: ["What doesn't kill me", "makes me stronger"] },
  { id: 'q1', fragments: ["He who has a why", "can bear any how"] },
  { id: 'q2', fragments: ["You must have chaos within you", "to give birth", "to a dancing star"] },
  { id: 'q3', fragments: ["There are no facts", "only interpretations"] },
  { id: 'q4', fragments: ["In heaven", "all the interesting people", "are missing"] },
  { id: 'q5', fragments: ["Without music", "life would be a mistake"] },
  { id: 'q6', fragments: ["Man is a rope", "tied between beast", "and overman"] },
  { id: 'q7', fragments: ["The higher we soar", "the smaller we appear", "to those who cannot fly"] },
];

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'np_achievements';
const FRAGMENTS_KEY = 'np_quote_fragments';
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

export function getPersistentStats() {
  return loadData(STATS_KEY, {
    totalDreadsSurvived: 0,
    totalGames: 0,
    totalFish: 0,
    totalGoldenFish: 0,
    totalDistance: 0,
    highestScore: 0,
    longestRun: 0,
    totalAchievements: 0,
    totalDiscoTriggers: 0,
  });
}

// --- Quote fragments ---

export function getCollectedFragments() {
  return loadData(FRAGMENTS_KEY, {});
}

export function collectRandomFragment() {
  const collected = getCollectedFragments();
  // Find uncollected fragments
  const uncollected = [];
  for (const q of QUOTE_DATA) {
    const have = collected[q.id] || [];
    for (let i = 0; i < q.fragments.length; i++) {
      if (!have.includes(i)) {
        uncollected.push({ quoteId: q.id, fragIndex: i, text: q.fragments[i] });
      }
    }
  }
  if (uncollected.length === 0) return null;

  const pick = uncollected[Math.floor(Math.random() * uncollected.length)];
  if (!collected[pick.quoteId]) collected[pick.quoteId] = [];
  collected[pick.quoteId].push(pick.fragIndex);
  saveData(FRAGMENTS_KEY, collected);

  // Check if quote is now complete
  const q = QUOTE_DATA.find(q => q.id === pick.quoteId);
  const isComplete = collected[pick.quoteId].length >= q.fragments.length;

  return {
    text: pick.text,
    fullQuote: q.fragments.join(' '),
    isComplete,
  };
}

export function getCompletedQuoteCount() {
  const collected = getCollectedFragments();
  let count = 0;
  for (const q of QUOTE_DATA) {
    const have = collected[q.id] || [];
    if (have.length >= q.fragments.length) count++;
  }
  return count;
}

// Backwards compat — old collected quotes (full strings) aren't used anymore
export function getCollectedQuotes() {
  // Build from fragments
  const collected = getCollectedFragments();
  const result = [];
  for (const q of QUOTE_DATA) {
    const have = collected[q.id] || [];
    if (have.length >= q.fragments.length) {
      result.push(q.fragments.join(' '));
    }
  }
  return result;
}

// --- Achievement checking ---

export function checkAchievements(runStats) {
  const unlocked = getUnlockedAchievements();
  const newlyUnlocked = [];
  for (const a of MILESTONE_ACHIEVEMENTS) {
    if (!unlocked.includes(a.id) && a.check(runStats)) {
      unlocked.push(a.id);
      newlyUnlocked.push(a.name);
    }
  }
  saveData(STORAGE_KEY, unlocked);
  return newlyUnlocked;
}

export function incrementPersistentStats(runStats) {
  const stats = getPersistentStats();
  stats.totalDreadsSurvived += runStats.dreadsSurvived || 0;
  stats.totalGames += 1;
  stats.totalFish += runStats.fishThisRun || 0;
  stats.totalGoldenFish += runStats.goldenFishThisRun || 0;
  stats.totalDistance += runStats.distance || 0;
  if (runStats.score > stats.highestScore) stats.highestScore = runStats.score;
  if (runStats.distance > stats.longestRun) stats.longestRun = runStats.distance;
  if (runStats.discoTriggered) stats.totalDiscoTriggers = (stats.totalDiscoTriggers || 0) + 1;
  stats.completedQuotes = getCompletedQuoteCount();
  stats.totalAchievements = getUnlockedAchievements().length;
  saveData(STATS_KEY, stats);
  return stats;
}

export function getAllAchievements() { return MILESTONE_ACHIEVEMENTS; }
