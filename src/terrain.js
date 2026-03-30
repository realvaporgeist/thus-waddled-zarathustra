// src/terrain.js
import * as THREE from 'three';
import {
  PATH_WIDTH, CHUNK_LENGTH, VISIBLE_CHUNKS, TERRAIN_Y,
  PATH_COLOR, SNOW_COLOR, MOUNTAIN_COLOR, MOUNTAIN_LAYERS,
} from './constants.js';

const chunks = [];
const mountainLayers = []; // { group, scrollFactor, baseX }

const pathGeometry = new THREE.PlaneGeometry(PATH_WIDTH, CHUNK_LENGTH);
const pathMaterial = new THREE.MeshStandardMaterial({
  color: PATH_COLOR,
  roughness: 0.3,
  metalness: 0.1,
});

// Wider snow panels that overlap the path edges — eliminates the gap
const snowWidth = 70;
const snowGeometry = new THREE.PlaneGeometry(snowWidth, CHUNK_LENGTH, 16, 1);
const snowMaterial = new THREE.MeshStandardMaterial({
  color: SNOW_COLOR,
  roughness: 0.85,
  flatShading: true,
});

// Displace snow vertices for a bumpy, textured look
function displaceSnowGeometry(geo, side) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const lx = pos.getX(i); // local X relative to center of plane
    const worldX = lx + side * (PATH_WIDTH / 2 + snowWidth / 2);
    // Stronger bumps further from the path edge
    const distFromPath = Math.abs(worldX) - PATH_WIDTH / 2;
    const bumpScale = Math.min(distFromPath / 15, 1) * 0.4;
    // Pseudo-random bump based on position
    const hash = Math.sin(lx * 7.3 + pos.getY(i) * 3.7) * 0.5 + 0.5;
    pos.setZ(i, pos.getZ(i) + hash * bumpScale);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

// Snow bank geometry — rounded ridge along the path edge
function createSnowBank(length) {
  const bankWidth = 1.2;
  const bankHeight = 0.25;
  const segments = Math.ceil(length / 2);
  const shape = new THREE.Shape();

  // Cross-section: a soft mound
  shape.moveTo(-bankWidth / 2, 0);
  shape.quadraticCurveTo(-bankWidth / 4, bankHeight * 1.3, 0, bankHeight);
  shape.quadraticCurveTo(bankWidth / 4, bankHeight * 1.3, bankWidth / 2, 0);
  shape.lineTo(-bankWidth / 2, 0);

  const extrudeSettings = {
    steps: segments,
    depth: length,
    bevelEnabled: false,
  };

  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xe8eef4,
    roughness: 0.9,
    flatShading: true,
  });
  return new THREE.Mesh(geo, mat);
}

export function createTerrain(scene) {
  const numChunks = VISIBLE_CHUNKS + 1;
  for (let i = 0; i < numChunks; i++) {
    spawnChunk(scene, -i * CHUNK_LENGTH);
  }

  // Large background ground plane extending to the mountains and beyond
  const bgGroundGeo = new THREE.PlaneGeometry(500, 500);
  const bgGroundMat = new THREE.MeshStandardMaterial({
    color: SNOW_COLOR,
    roughness: 0.85,
  });
  const bgGround = new THREE.Mesh(bgGroundGeo, bgGroundMat);
  bgGround.rotation.x = -Math.PI / 2;
  bgGround.position.set(0, TERRAIN_Y - 0.05, -150);
  bgGround.receiveShadow = true;
  scene.add(bgGround);

  createMountains(scene);
}

function spawnChunk(scene, zPosition) {
  const group = new THREE.Group();

  // Path
  const path = new THREE.Mesh(pathGeometry, pathMaterial);
  path.rotation.x = -Math.PI / 2;
  path.receiveShadow = true;
  group.add(path);

  // Snow panels — positioned to overlap path edges by 1 unit
  const overlap = 1;
  const snowOffset = PATH_WIDTH / 2 + snowWidth / 2 - overlap;

  const leftSnowGeo = snowGeometry.clone();
  displaceSnowGeometry(leftSnowGeo, -1);
  const leftSnow = new THREE.Mesh(leftSnowGeo, snowMaterial);
  leftSnow.rotation.x = -Math.PI / 2;
  leftSnow.position.set(-snowOffset, -0.02, 0);
  leftSnow.receiveShadow = true;
  group.add(leftSnow);

  const rightSnowGeo = snowGeometry.clone();
  displaceSnowGeometry(rightSnowGeo, 1);
  const rightSnow = new THREE.Mesh(rightSnowGeo, snowMaterial);
  rightSnow.rotation.x = -Math.PI / 2;
  rightSnow.position.set(snowOffset, -0.02, 0);
  rightSnow.receiveShadow = true;
  group.add(rightSnow);

  // Snow banks along path edges (replaces black lines)
  const leftBank = createSnowBank(CHUNK_LENGTH);
  leftBank.rotation.y = Math.PI;
  leftBank.position.set(-PATH_WIDTH / 2 + 0.1, TERRAIN_Y, CHUNK_LENGTH / 2);
  group.add(leftBank);

  const rightBank = createSnowBank(CHUNK_LENGTH);
  rightBank.position.set(PATH_WIDTH / 2 - 0.1, TERRAIN_Y, -CHUNK_LENGTH / 2);
  group.add(rightBank);

  group.position.set(0, TERRAIN_Y, zPosition);
  scene.add(group);
  chunks.push(group);
}

// Displace cone vertices for rugged, natural-looking ridges
function displaceConePeak(geometry, height) {
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const r = Math.sqrt(x * x + z * z);
    if (r < 0.01) continue; // skip tip vertex

    // Height fraction (0 at base, 1 at tip)
    const hFrac = (y + height / 2) / height;

    // Sinusoidal noise — strongest at mid-height for ridgeline character
    const noiseScale = Math.sin(hFrac * Math.PI) * 0.15;
    const angle = Math.atan2(z, x);
    const noise = Math.sin(angle * 5.3 + hFrac * 7.1) * 0.5 +
                  Math.sin(angle * 11.7 + hFrac * 3.3) * 0.3 +
                  Math.sin(angle * 2.1 + hFrac * 13.7) * 0.2;

    pos.setX(i, x * (1 + noise * noiseScale));
    pos.setZ(i, z * (1 + noise * noiseScale));
    pos.setY(i, y + noise * height * 0.01);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
}

function createMountainLayer(layerConfig, layerIndex) {
  const group = new THREE.Group();
  const baseTint = new THREE.Color(MOUNTAIN_COLOR);
  const fogColor = new THREE.Color(0xa8c4d8);
  const tintedColor = baseTint.clone().lerp(fogColor, layerConfig.fogTint);

  // Darker base shade for gradient effect
  const darkerBase = tintedColor.clone().multiplyScalar(0.7);

  const mountainMat = new THREE.MeshStandardMaterial({
    color: tintedColor, flatShading: true,
  });
  // Far mountains get subtle emissive glow for atmosphere
  if (layerIndex === 0) {
    mountainMat.emissive = new THREE.Color(0x334466);
    mountainMat.emissiveIntensity = 0.08;
  }

  const snowCapMat = new THREE.MeshStandardMaterial({
    color: 0xe8eef4, flatShading: true,
    opacity: 1 - layerConfig.fogTint * 0.5,
    transparent: layerConfig.fogTint > 0.3,
  });
  const deepSnowMat = new THREE.MeshStandardMaterial({
    color: 0xdde6ee, flatShading: true,
    opacity: 1 - layerConfig.fogTint * 0.3,
    transparent: layerConfig.fogTint > 0.3,
  });
  // Darker rock material for secondary ridges
  const ridgeMat = new THREE.MeshStandardMaterial({
    color: darkerBase, flatShading: true,
  });

  const peakCount = layerIndex === 0 ? 10 : layerIndex === 1 ? 8 : 6;
  const peaks = [];
  for (let i = 0; i < peakCount; i++) {
    const spread = layerIndex === 0 ? 220 : layerIndex === 1 ? 190 : 160;
    const x = (i / (peakCount - 1)) * spread - spread / 2 + (Math.random() - 0.5) * 20;
    const baseHeight = layerIndex === 0 ? 55 : layerIndex === 1 ? 38 : 22;
    const h = baseHeight + (Math.random() - 0.5) * baseHeight * 0.5;
    const r = (h * 0.55 + Math.random() * 5) * layerConfig.scale;
    const z = layerConfig.zBase + (Math.random() - 0.5) * 15;
    peaks.push({ x, z, h: h * layerConfig.scale, r });
  }

  for (const peak of peaks) {
    // More segments + displacement = rugged natural silhouette
    const sides = 10 + Math.floor(Math.random() * 6);
    const heightSegs = 4;
    const geo = new THREE.ConeGeometry(peak.r, peak.h, sides, heightSegs);
    displaceConePeak(geo, peak.h);
    const mountain = new THREE.Mesh(geo, mountainMat);
    mountain.position.set(peak.x, TERRAIN_Y + peak.h / 2, peak.z);
    group.add(mountain);

    // Snow cap — also displaced for natural look
    const capSides = Math.max(6, sides - 2);
    const capGeo = new THREE.ConeGeometry(peak.r * 0.45, peak.h * 0.35, capSides, 2);
    displaceConePeak(capGeo, peak.h * 0.35);
    const cap = new THREE.Mesh(capGeo, snowCapMat);
    cap.position.set(peak.x, TERRAIN_Y + peak.h * 0.82, peak.z);
    group.add(cap);

    // Deep snow band on taller peaks
    if (peak.h > 20) {
      const bandGeo = new THREE.ConeGeometry(peak.r * 0.65, peak.h * 0.2, capSides, 2);
      displaceConePeak(bandGeo, peak.h * 0.2);
      const band = new THREE.Mesh(bandGeo, deepSnowMat);
      band.position.set(peak.x, TERRAIN_Y + peak.h * 0.65, peak.z);
      group.add(band);
    }

    // Secondary ridge — smaller shoulder peak offset from main
    if (peak.h > 15 && Math.random() > 0.4) {
      const ridgeH = peak.h * (0.3 + Math.random() * 0.25);
      const ridgeR = peak.r * (0.3 + Math.random() * 0.2);
      const ridgeSides = 6 + Math.floor(Math.random() * 4);
      const ridgeGeo = new THREE.ConeGeometry(ridgeR, ridgeH, ridgeSides, 2);
      displaceConePeak(ridgeGeo, ridgeH);
      const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
      const offsetX = (Math.random() > 0.5 ? 1 : -1) * peak.r * (0.4 + Math.random() * 0.3);
      const offsetZ = (Math.random() - 0.5) * 5;
      ridge.position.set(peak.x + offsetX, TERRAIN_Y + ridgeH / 2, peak.z + offsetZ);
      group.add(ridge);

      // Mini snow cap on the ridge
      if (ridgeH > 10) {
        const rCapGeo = new THREE.ConeGeometry(ridgeR * 0.4, ridgeH * 0.3, ridgeSides);
        const rCap = new THREE.Mesh(rCapGeo, snowCapMat);
        rCap.position.set(peak.x + offsetX, TERRAIN_Y + ridgeH * 0.82, peak.z + offsetZ);
        group.add(rCap);
      }
    }
  }

  return { group, scrollFactor: layerConfig.scrollFactor, baseX: 0 };
}

function createMountains(scene) {
  for (let i = 0; i < MOUNTAIN_LAYERS.length; i++) {
    const layer = createMountainLayer(MOUNTAIN_LAYERS[i], i);
    scene.add(layer.group);
    mountainLayers.push(layer);
  }
}

export function updateTerrain(speed, delta) {
  for (const group of chunks) {
    group.position.z += speed * delta;
  }

  let minZ = Infinity;
  for (const group of chunks) {
    if (group.position.z < minZ) minZ = group.position.z;
  }

  for (const group of chunks) {
    if (group.position.z > CHUNK_LENGTH) {
      group.position.z = minZ - CHUNK_LENGTH;
    }
  }

  // Parallax mountain scrolling
  for (const layer of mountainLayers) {
    layer.baseX += speed * delta * layer.scrollFactor * 0.02;
    layer.group.position.x = Math.sin(layer.baseX) * 2;
  }
}

export function resetTerrain() {
  for (let i = 0; i < chunks.length; i++) {
    chunks[i].position.z = -i * CHUNK_LENGTH;
  }
}

export function getMountainLayers() {
  return mountainLayers;
}

export function swayMountains(swayX) {
  for (let i = 0; i < mountainLayers.length; i++) {
    const layer = mountainLayers[i];
    layer.group.position.x = swayX * layer.scrollFactor * 3;
  }
}
