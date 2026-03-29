// src/skins.js — Penguin skin system

export const SKINS = [
  {
    id: 'classic',
    name: 'Classic',
    desc: 'The original philosophical penguin',
    colors: { body: 0x1a1a2e, belly: 0xffffff, head: 0x1a1a2e, beak: 0xff8c00, feet: 0xff8c00, wings: 0x2a2a4a },
    unlock: null, // always available
  },
  {
    id: 'tuxedo',
    name: 'Tuxedo',
    desc: 'Dressed for the eternal gala',
    colors: { body: 0x0a0a0a, belly: 0xf5f5f5, head: 0x0a0a0a, beak: 0xcc7700, feet: 0xcc7700, wings: 0x111111 },
    unlock: { stat: 'totalGames', value: 5, label: 'Play 5 games' },
  },
  {
    id: 'golden',
    name: 'Golden',
    desc: 'Worth its weight in philosophy',
    colors: { body: 0xdaa520, belly: 0xffd700, head: 0xdaa520, beak: 0xff6600, feet: 0xff6600, wings: 0xb8860b },
    unlock: { stat: 'totalGoldenFish', value: 25, label: 'Collect 25 golden fish' },
  },
  {
    id: 'philosopher',
    name: 'Philosopher',
    desc: 'Wisdom wears deep blue',
    colors: { body: 0x1a3355, belly: 0xf0e6c8, head: 0x1a3355, beak: 0xaa6622, feet: 0xaa6622, wings: 0x223355 },
    unlock: { stat: 'completedQuotes', value: 4, label: 'Complete 4 quotes' },
  },
  {
    id: 'abyssal',
    name: 'Abyssal',
    desc: 'The abyss stared back and stayed',
    colors: { body: 0x2a0040, belly: 0x440066, head: 0x2a0040, beak: 0xff2222, feet: 0xff2222, wings: 0x1a0030 },
    unlock: { stat: 'totalDreadsSurvived', value: 15, label: 'Survive 15 dread sequences' },
  },
  {
    id: 'arctic',
    name: 'Arctic',
    desc: 'One with the ice',
    colors: { body: 0x88bbdd, belly: 0xe8f4ff, head: 0x88bbdd, beak: 0x5599cc, feet: 0x5599cc, wings: 0x6699bb },
    unlock: { stat: 'totalDistance', value: 10000, label: 'Run 10km total' },
  },
  {
    id: 'inferno',
    name: 'Inferno',
    desc: 'Dancing on the edge of destruction',
    colors: { body: 0xcc2200, belly: 0xff6633, head: 0xcc2200, beak: 0xffaa00, feet: 0xffaa00, wings: 0x991100 },
    unlock: { stat: 'highestScore', value: 25000, label: 'Score 25,000 in one run' },
  },
  {
    id: 'spectral',
    name: 'Spectral',
    desc: 'Between worlds',
    colors: { body: 0x8899aa, belly: 0xbbccdd, head: 0x8899aa, beak: 0x99aacc, feet: 0x99aacc, wings: 0x778899 },
    transparent: true,
    unlock: { stat: 'totalGames', value: 25, label: 'Play 25 games' },
  },
  {
    id: 'ubermensch',
    name: '\u00dcbermensch',
    desc: 'Beyond the penguin',
    colors: { body: 0xaab0b8, belly: 0xd0d4d8, head: 0xaab0b8, beak: 0xddcc44, feet: 0xddcc44, wings: 0x9098a0 },
    metallic: true,
    unlock: { stat: 'totalAchievements', value: 14, label: 'Unlock 14 achievements' },
  },
  {
    id: 'disco',
    name: 'Disco Penguin',
    desc: 'Trigger disco mode 3 times',
    colors: { body: 0xff00ff, belly: 0xffff00, head: 0x00ffff, beak: 0xff8800, feet: 0xff0088, wings: 0x8800ff },
    unlock: { stat: 'totalDiscoTriggers', value: 3, label: '3 disco modes' },
    discoBall: true,
  },
];

const SKINS_KEY = 'np_skins';

function loadSkinData() {
  try {
    const data = localStorage.getItem(SKINS_KEY);
    return data ? JSON.parse(data) : { selected: 'classic' };
  } catch { return { selected: 'classic' }; }
}

function saveSkinData(data) {
  localStorage.setItem(SKINS_KEY, JSON.stringify(data));
}

export function getSelectedSkinId() {
  return loadSkinData().selected;
}

export function selectSkin(skinId) {
  const data = loadSkinData();
  data.selected = skinId;
  saveSkinData(data);
}

export function getSelectedSkin() {
  const id = getSelectedSkinId();
  return SKINS.find(s => s.id === id) || SKINS[0];
}

export function getUnlockedSkinIds(stats) {
  const unlocked = ['classic'];
  for (const skin of SKINS) {
    if (skin.id === 'classic') continue;
    if (!skin.unlock) { unlocked.push(skin.id); continue; }
    const val = stats[skin.unlock.stat] || 0;
    if (val >= skin.unlock.value) unlocked.push(skin.id);
  }
  return unlocked;
}

export function getSkinById(id) {
  return SKINS.find(s => s.id === id) || SKINS[0];
}
