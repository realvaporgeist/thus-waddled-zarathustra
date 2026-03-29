// src/terrain.js
import * as THREE from 'three';
import {
  PATH_WIDTH,
  CHUNK_LENGTH,
  VISIBLE_CHUNKS,
  TERRAIN_Y,
  ICE_COLOR,
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
  for (let i = 0; i < VISIBLE_CHUNKS; i++) {
    spawnChunk(scene, -i * CHUNK_LENGTH);
  }
  mountainGroup = createMountains();
  scene.add(mountainGroup);
  createSideSnow(scene);
}

function spawnChunk(scene, zPosition) {
  const path = new THREE.Mesh(pathGeometry, pathMaterial);
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, TERRAIN_Y, zPosition);
  path.receiveShadow = true;
  scene.add(path);
  chunks.push({ mesh: path, z: zPosition });
}

function createMountains() {
  const group = new THREE.Group();
  const mountainMat = new THREE.MeshStandardMaterial({ color: MOUNTAIN_COLOR, flatShading: true });
  const snowCapMat = new THREE.MeshStandardMaterial({ color: SNOW_COLOR, flatShading: true });

  const peaks = [
    { x: -15, z: -150, height: 25, radius: 12 },
    { x: 0,   z: -170, height: 35, radius: 15 },
    { x: 20,  z: -155, height: 28, radius: 13 },
    { x: -30, z: -160, height: 20, radius: 10 },
    { x: 35,  z: -165, height: 22, radius: 11 },
    { x: 10,  z: -180, height: 30, radius: 14 },
    { x: -20, z: -175, height: 26, radius: 12 },
  ];

  for (const peak of peaks) {
    const geometry = new THREE.ConeGeometry(peak.radius, peak.height, 6);
    const mountain = new THREE.Mesh(geometry, mountainMat);
    mountain.position.set(peak.x, peak.height / 2, peak.z);
    group.add(mountain);

    const capGeometry = new THREE.ConeGeometry(peak.radius * 0.4, peak.height * 0.25, 6);
    const cap = new THREE.Mesh(capGeometry, snowCapMat);
    cap.position.set(peak.x, peak.height * 0.85, peak.z);
    group.add(cap);
  }

  return group;
}

function createSideSnow(scene) {
  const leftSnow = new THREE.Mesh(snowGeometry, snowMaterial);
  leftSnow.rotation.x = -Math.PI / 2;
  leftSnow.position.set(-35, TERRAIN_Y - 0.01, -75);
  leftSnow.receiveShadow = true;
  scene.add(leftSnow);

  const rightSnow = new THREE.Mesh(snowGeometry, snowMaterial);
  rightSnow.rotation.x = -Math.PI / 2;
  rightSnow.position.set(35, TERRAIN_Y - 0.01, -75);
  rightSnow.receiveShadow = true;
  scene.add(rightSnow);
}

export function updateTerrain(playerZ) {
  const farthestNeeded = playerZ - CHUNK_LENGTH * VISIBLE_CHUNKS;

  if (chunks.length > 0) {
    const farthest = chunks[chunks.length - 1].z;
    if (farthest > farthestNeeded) {
      const scene = chunks[0].mesh.parent;
      spawnChunk(scene, farthest - CHUNK_LENGTH);
    }
  }

  while (chunks.length > 0 && chunks[0].z > playerZ + 20) {
    const old = chunks.shift();
    old.mesh.parent.remove(old.mesh);
  }

  if (mountainGroup) {
    mountainGroup.position.z = playerZ - 150;
  }
}

export function getMountainGroup() {
  return mountainGroup;
}
