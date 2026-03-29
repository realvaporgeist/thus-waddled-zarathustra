// src/collectibles.js
import * as THREE from 'three';
import {
  LANE_POSITIONS,
  OBSTACLE_SPAWN_DISTANCE,
  TERRAIN_Y,
  FISH_FLOAT_HEIGHT,
  FISH_ROTATE_SPEED,
  FISH_SPAWN_CHANCE,
  GOLDEN_FISH_CHANCE,
  QUOTE_SPAWN_CHANCE,
  ABYSS_ORB_MIN_INTERVAL,
  ABYSS_ORB_MAX_INTERVAL,
} from './constants.js';

// ---------------------------------------------------------------------------
// Nietzsche quotes
// ---------------------------------------------------------------------------
const NIETZSCHE_QUOTES = [
  "What doesn't kill me makes me stronger",
  "He who has a why can bear any how",
  "You must have chaos within you to give birth to a dancing star",
  "There are no facts, only interpretations",
  "In heaven, all the interesting people are missing",
  "Without music, life would be a mistake",
  "Man is a rope, tied between beast and overman",
  "The higher we soar, the smaller we appear to those who cannot fly",
];

// ---------------------------------------------------------------------------
// Active collectibles list
// ---------------------------------------------------------------------------
const activeCollectibles = [];

// ---------------------------------------------------------------------------
// Spawn tracking
// ---------------------------------------------------------------------------
let nextSpawnZ = -15;
let orbCooldownEnd = ABYSS_ORB_MIN_INTERVAL; // first orb available after min interval

// ---------------------------------------------------------------------------
// Shared geometry / material pools
// ---------------------------------------------------------------------------
const pool = {
  // Fish (common)
  fishGeo: new THREE.ConeGeometry(0.15, 0.5, 8),
  fishMat: new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.4 }),
  fishTailGeo: new THREE.BufferGeometry(),

  // Golden fish
  goldenFishMat: new THREE.MeshStandardMaterial({
    color: 0xffd700,
    roughness: 0.2,
    metalness: 0.8,
  }),
  goldenGlowGeo: new THREE.SphereGeometry(0.5, 12, 10),
  goldenGlowMat: new THREE.MeshStandardMaterial({
    color: 0xffd700,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
  }),

  // Quote scroll
  quoteGeo: new THREE.PlaneGeometry(2, 0.6),
  quoteGlowGeo: new THREE.SphereGeometry(1.2, 12, 10),
  quoteGlowMat: new THREE.MeshStandardMaterial({
    color: 0xffff88,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
  }),

  // Abyss orb
  orbGeo: new THREE.SphereGeometry(0.5, 16, 14),
  orbMat: new THREE.MeshStandardMaterial({
    color: 0x440066,
    roughness: 0.3,
    metalness: 0.5,
  }),
  orbRingGeo: new THREE.TorusGeometry(0.7, 0.05, 8, 24),
  orbRingMat: new THREE.MeshStandardMaterial({
    color: 0x8800cc,
    roughness: 0.3,
    metalness: 0.6,
  }),
  orbGlowGeo: new THREE.SphereGeometry(0.8, 12, 10),
  orbGlowMat: new THREE.MeshStandardMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
  }),
};

// Build the fish tail triangle (shared geometry)
{
  const vertices = new Float32Array([
    0, 0.25, -0.12,
    0, -0.25, -0.12,
    0, 0, -0.35,
  ]);
  pool.fishTailGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  pool.fishTailGeo.computeVertexNormals();
}

// ---------------------------------------------------------------------------
// Create collectible meshes
// ---------------------------------------------------------------------------

function createFishMesh() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(pool.fishGeo, pool.fishMat);
  // Rotate cone so it points forward (along -z)
  body.rotation.x = Math.PI / 2;
  group.add(body);

  // Tail triangle
  const tailMat = new THREE.MeshStandardMaterial({ color: 0x3366cc, side: THREE.DoubleSide });
  const tail = new THREE.Mesh(pool.fishTailGeo, tailMat);
  tail.position.z = 0.25;
  group.add(tail);

  group.position.y = TERRAIN_Y + FISH_FLOAT_HEIGHT;
  return group;
}

function createGoldenFishMesh() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(pool.fishGeo, pool.goldenFishMat);
  body.rotation.x = Math.PI / 2;
  group.add(body);

  // Tail triangle (golden)
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xccaa00, side: THREE.DoubleSide });
  const tail = new THREE.Mesh(pool.fishTailGeo, tailMat);
  tail.position.z = 0.25;
  group.add(tail);

  // Glow sphere
  const glow = new THREE.Mesh(pool.goldenGlowGeo, pool.goldenGlowMat);
  group.add(glow);

  group.position.y = TERRAIN_Y + FISH_FLOAT_HEIGHT;
  return group;
}

function createQuoteMesh(quoteText) {
  const group = new THREE.Group();

  // Create canvas texture with word-wrapped quote
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 154; // proportional to 2:0.6 ratio
  const ctx = canvas.getContext('2d');

  // Parchment background
  ctx.fillStyle = '#f5e6c8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border
  ctx.strokeStyle = '#8b7355';
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  // Word-wrapped text
  ctx.fillStyle = '#2a1a0a';
  ctx.font = '22px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const words = quoteText.split(' ');
  const maxWidth = canvas.width - 40;
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  const lineHeight = 28;
  const startY = (canvas.height - lines.length * lineHeight) / 2 + lineHeight / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], canvas.width / 2, startY + i * lineHeight);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
  });

  const plane = new THREE.Mesh(pool.quoteGeo, mat);
  group.add(plane);

  // Subtle glow sphere
  const glow = new THREE.Mesh(pool.quoteGlowGeo, pool.quoteGlowMat);
  group.add(glow);

  group.position.y = TERRAIN_Y + FISH_FLOAT_HEIGHT + 0.5;
  return group;
}

function createAbyssOrbMesh() {
  const group = new THREE.Group();

  // Dark purple sphere
  const orb = new THREE.Mesh(pool.orbGeo, pool.orbMat);
  group.add(orb);

  // Swirling ring 1
  const ring1 = new THREE.Mesh(pool.orbRingGeo, pool.orbRingMat);
  ring1.name = 'ring1';
  group.add(ring1);

  // Swirling ring 2
  const ring2 = new THREE.Mesh(pool.orbRingGeo, pool.orbRingMat);
  ring2.name = 'ring2';
  ring2.rotation.x = Math.PI / 2;
  group.add(ring2);

  // Red glow
  const glow = new THREE.Mesh(pool.orbGlowGeo, pool.orbGlowMat);
  group.add(glow);

  group.position.y = TERRAIN_Y + FISH_FLOAT_HEIGHT + 0.3;
  return group;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Attempt to spawn a collectible if the player has advanced far enough.
 * @param {THREE.Scene} scene
 * @param {number} worldZ - current playerZ (decreasing over time)
 * @param {number} elapsed - seconds since game start
 */
export function spawnCollectibles(scene, worldZ, elapsed) {
  if (worldZ > nextSpawnZ) return;

  const lane = Math.floor(Math.random() * LANE_POSITIONS.length);
  const laneX = LANE_POSITIONS[lane];
  const spawnZ = -(OBSTACLE_SPAWN_DISTANCE - 5);

  const roll = Math.random();
  let type;
  let mesh;
  let quoteText = null;
  let spacing;

  // Determine type by priority: abyss orb > quote > golden fish > regular fish
  if (elapsed > orbCooldownEnd && roll < 0.02) {
    // Abyss orb (2% chance, only if cooldown passed)
    type = 'abyssOrb';
    mesh = createAbyssOrbMesh();
    spacing = 20;
    // Set next cooldown
    orbCooldownEnd = elapsed + ABYSS_ORB_MIN_INTERVAL
      + Math.random() * (ABYSS_ORB_MAX_INTERVAL - ABYSS_ORB_MIN_INTERVAL);
  } else if (roll < 0.02 + QUOTE_SPAWN_CHANCE) {
    // Nietzsche quote
    type = 'quote';
    quoteText = NIETZSCHE_QUOTES[Math.floor(Math.random() * NIETZSCHE_QUOTES.length)];
    mesh = createQuoteMesh(quoteText);
    spacing = 15;
  } else if (roll < 0.02 + QUOTE_SPAWN_CHANCE + GOLDEN_FISH_CHANCE) {
    // Golden fish
    type = 'goldenFish';
    mesh = createGoldenFishMesh();
    spacing = 12;
  } else if (roll < 0.02 + QUOTE_SPAWN_CHANCE + GOLDEN_FISH_CHANCE + FISH_SPAWN_CHANCE) {
    // Regular fish
    type = 'fish';
    mesh = createFishMesh();
    spacing = 8;
  } else {
    // Nothing spawns this cycle
    nextSpawnZ = worldZ - 5;
    return;
  }

  mesh.position.x = laneX;
  mesh.position.z = spawnZ;

  scene.add(mesh);

  activeCollectibles.push({
    mesh,
    type,
    lane,
    quoteText,
  });

  nextSpawnZ = worldZ - spacing;
}

/**
 * Move all active collectibles toward the player and animate them.
 * @param {number} delta - seconds since last frame
 * @param {number} speed - current game speed
 */
export function updateCollectibles(delta, speed) {
  for (let i = activeCollectibles.length - 1; i >= 0; i--) {
    const col = activeCollectibles[i];
    const mesh = col.mesh;

    // Move toward player
    mesh.position.z += speed * delta;

    // Float bobbing animation
    const baseY = mesh.position.y;
    mesh.position.y += Math.sin(performance.now() * 0.003 + i) * 0.002;

    // Rotate animation
    mesh.rotation.y += FISH_ROTATE_SPEED * delta;

    // Abyss orb ring animation
    if (col.type === 'abyssOrb') {
      const ring1 = mesh.getObjectByName('ring1');
      const ring2 = mesh.getObjectByName('ring2');
      if (ring1) ring1.rotation.z += delta * 2;
      if (ring2) ring2.rotation.y += delta * 1.5;
    }

    // Despawn when past camera
    if (mesh.position.z > 5) {
      mesh.parent?.remove(mesh);
      activeCollectibles.splice(i, 1);
    }
  }
}

/**
 * Check if the penguin has picked up any collectibles.
 * @param {THREE.Vector3} penguinPos - penguin world position
 * @param {number} penguinLane - current lane index
 * @returns {Array<{type: string, quoteText: string|null}>} collected items
 */
export function checkCollectiblePickup(penguinPos, penguinLane) {
  const collected = [];

  for (let i = activeCollectibles.length - 1; i >= 0; i--) {
    const col = activeCollectibles[i];
    const mesh = col.mesh;

    const dz = Math.abs(mesh.position.z - penguinPos.z);
    const dx = Math.abs(mesh.position.x - penguinPos.x);

    if (dz < 1.5 && dx < 1.5) {
      collected.push({ type: col.type, quoteText: col.quoteText });
      mesh.parent?.remove(mesh);
      activeCollectibles.splice(i, 1);
    }
  }

  return collected;
}

/**
 * Remove all collectibles from the scene and clear the list. Used on game reset.
 * @param {THREE.Scene} scene
 */
export function clearCollectibles(scene) {
  for (const col of activeCollectibles) {
    scene.remove(col.mesh);
  }
  activeCollectibles.length = 0;
  nextSpawnZ = -15;
  orbCooldownEnd = ABYSS_ORB_MIN_INTERVAL;
}

/**
 * Return the Nietzsche quotes array.
 * @returns {string[]}
 */
export function getNietzscheQuotes() {
  return NIETZSCHE_QUOTES;
}
