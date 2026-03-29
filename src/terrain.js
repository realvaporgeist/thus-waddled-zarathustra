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

const snowGeometry = new THREE.PlaneGeometry(60, CHUNK_LENGTH);
const snowMaterial = new THREE.MeshStandardMaterial({
  color: SNOW_COLOR,
  roughness: 0.8,
});

export function createTerrain(scene) {
  const numChunks = VISIBLE_CHUNKS + 1;
  for (let i = 0; i < numChunks; i++) {
    spawnChunk(scene, -i * CHUNK_LENGTH);
  }
  createMountains(scene);
}

function spawnChunk(scene, zPosition) {
  const group = new THREE.Group();

  const path = new THREE.Mesh(pathGeometry, pathMaterial);
  path.rotation.x = -Math.PI / 2;
  path.receiveShadow = true;
  group.add(path);

  const leftSnow = new THREE.Mesh(snowGeometry, snowMaterial);
  leftSnow.rotation.x = -Math.PI / 2;
  leftSnow.position.set(-35, -0.01, 0);
  leftSnow.receiveShadow = true;
  group.add(leftSnow);

  const rightSnow = new THREE.Mesh(snowGeometry, snowMaterial);
  rightSnow.rotation.x = -Math.PI / 2;
  rightSnow.position.set(35, -0.01, 0);
  rightSnow.receiveShadow = true;
  group.add(rightSnow);

  group.position.set(0, TERRAIN_Y, zPosition);
  scene.add(group);
  chunks.push(group);
}

function createMountainLayer(layerConfig, layerIndex) {
  const group = new THREE.Group();
  const baseTint = new THREE.Color(MOUNTAIN_COLOR);
  const fogColor = new THREE.Color(0xa8c4d8);
  const tintedColor = baseTint.clone().lerp(fogColor, layerConfig.fogTint);

  const mountainMat = new THREE.MeshStandardMaterial({
    color: tintedColor, flatShading: true,
  });
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

  const peakCount = layerIndex === 0 ? 8 : layerIndex === 1 ? 7 : 5;
  const peaks = [];
  for (let i = 0; i < peakCount; i++) {
    const spread = layerIndex === 0 ? 200 : layerIndex === 1 ? 180 : 160;
    const x = (i / (peakCount - 1)) * spread - spread / 2 + (Math.random() - 0.5) * 20;
    const baseHeight = layerIndex === 0 ? 55 : layerIndex === 1 ? 38 : 22;
    const h = baseHeight + (Math.random() - 0.5) * baseHeight * 0.5;
    const r = (h * 0.55 + Math.random() * 5) * layerConfig.scale;
    const z = layerConfig.zBase + (Math.random() - 0.5) * 15;
    peaks.push({ x, z, h: h * layerConfig.scale, r });
  }

  for (const peak of peaks) {
    const sides = 5 + Math.floor(Math.random() * 4);
    const geo = new THREE.ConeGeometry(peak.r, peak.h, sides);
    const mountain = new THREE.Mesh(geo, mountainMat);
    mountain.position.set(peak.x, peak.h / 2, peak.z);
    group.add(mountain);

    const capGeo = new THREE.ConeGeometry(peak.r * 0.45, peak.h * 0.35, sides);
    const cap = new THREE.Mesh(capGeo, snowCapMat);
    cap.position.set(peak.x, peak.h * 0.82, peak.z);
    group.add(cap);

    if (peak.h > 20) {
      const bandGeo = new THREE.ConeGeometry(peak.r * 0.65, peak.h * 0.2, sides);
      const band = new THREE.Mesh(bandGeo, deepSnowMat);
      band.position.set(peak.x, peak.h * 0.65, peak.z);
      group.add(band);
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
