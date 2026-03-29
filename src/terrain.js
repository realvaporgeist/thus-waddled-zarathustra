// src/terrain.js
import * as THREE from 'three';
import {
  PATH_WIDTH,
  CHUNK_LENGTH,
  VISIBLE_CHUNKS,
  TERRAIN_Y,
  PATH_COLOR,
  SNOW_COLOR,
  MOUNTAIN_COLOR,
} from './constants.js';

const chunks = [];
let mountainGroup = null;

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
  mountainGroup = createMountains();
  scene.add(mountainGroup);
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

function createMountains() {
  const group = new THREE.Group();
  const mountainMat = new THREE.MeshStandardMaterial({
    color: MOUNTAIN_COLOR,
    flatShading: true,
  });
  const snowCapMat = new THREE.MeshStandardMaterial({
    color: 0xe8eef4,
    flatShading: true,
  });
  const deepSnowMat = new THREE.MeshStandardMaterial({
    color: 0xdde6ee,
    flatShading: true,
  });

  // Dramatic mountain range — multiple layers for depth, matching the meme
  const peaks = [
    // Back layer — massive, dominant
    { x: -50, z: -170, h: 60, r: 35 },
    { x: -10, z: -180, h: 75, r: 40 },
    { x: 30,  z: -175, h: 55, r: 32 },
    { x: 65,  z: -185, h: 65, r: 38 },
    { x: -80, z: -190, h: 50, r: 30 },
    { x: 90,  z: -180, h: 48, r: 28 },

    // Mid layer — medium peaks filling gaps
    { x: -35, z: -140, h: 40, r: 24 },
    { x: 15,  z: -150, h: 50, r: 28 },
    { x: 50,  z: -145, h: 38, r: 22 },
    { x: -65, z: -155, h: 35, r: 20 },
    { x: 75,  z: -150, h: 42, r: 24 },
    { x: -15, z: -145, h: 32, r: 18 },

    // Front layer — smaller foothills
    { x: -45, z: -110, h: 22, r: 15 },
    { x: 40,  z: -115, h: 25, r: 16 },
    { x: -10, z: -108, h: 18, r: 13 },
    { x: 65,  z: -112, h: 20, r: 14 },
    { x: -70, z: -118, h: 16, r: 12 },
  ];

  for (const peak of peaks) {
    const sides = 5 + Math.floor(Math.random() * 4); // 5-8 sides for variety

    // Main mountain body
    const geo = new THREE.ConeGeometry(peak.r, peak.h, sides);
    const mountain = new THREE.Mesh(geo, mountainMat);
    mountain.position.set(peak.x, peak.h / 2, peak.z);
    group.add(mountain);

    // Snow cap (top 35%)
    const capGeo = new THREE.ConeGeometry(peak.r * 0.45, peak.h * 0.35, sides);
    const cap = new THREE.Mesh(capGeo, snowCapMat);
    cap.position.set(peak.x, peak.h * 0.82, peak.z);
    group.add(cap);

    // Mid-snow band (adds coverage)
    if (peak.h > 30) {
      const bandGeo = new THREE.ConeGeometry(peak.r * 0.65, peak.h * 0.2, sides);
      const band = new THREE.Mesh(bandGeo, deepSnowMat);
      band.position.set(peak.x, peak.h * 0.65, peak.z);
      group.add(band);
    }
  }

  return group;
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
}

export function resetTerrain() {
  for (let i = 0; i < chunks.length; i++) {
    chunks[i].position.z = -i * CHUNK_LENGTH;
  }
}

export function getMountainGroup() {
  return mountainGroup;
}
