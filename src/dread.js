// src/dread.js
import * as THREE from 'three';
import { transitionToDread } from './scene.js';
import { DREAD_DURATION, DREAD_SPEED_MULTIPLIER, TERRAIN_Y } from './constants.js';

let active = false;
let timer = 0;
let transitionProgress = 0;
let dreadEyes = null;
let shadowCreatures = [];
let dreadQuoteCallback = null;

const TRANSITION_IN_DURATION = 1.5;
const TRANSITION_OUT_DURATION = 1.0;

export function startDread(scene, onEnd) {
  active = true;
  timer = DREAD_DURATION;
  transitionProgress = 0;
  dreadQuoteCallback = onEnd;

  // Giant red eyes on the horizon
  dreadEyes = createDreadEyes();
  dreadEyes.position.set(0, 15, -140);
  scene.add(dreadEyes);

  // Shadow creatures on sides of path
  shadowCreatures = createShadowCreatures();
  for (const creature of shadowCreatures) {
    scene.add(creature);
  }
}

function createDreadEyes() {
  const group = new THREE.Group();
  const eyeGeo = new THREE.SphereGeometry(3, 12, 12);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const pupilGeo = new THREE.SphereGeometry(1.2, 8, 8);
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-8, 0, 0);
  group.add(leftEye);
  const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
  leftPupil.position.set(-8, 0, 2);
  group.add(leftPupil);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(8, 0, 0);
  group.add(rightEye);
  const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
  rightPupil.position.set(8, 0, 2);
  group.add(rightPupil);

  const glowGeo = new THREE.SphereGeometry(5, 8, 8);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.15 });
  group.add(new THREE.Mesh(glowGeo, glowMat));

  group.visible = false;
  return group;
}

function createShadowCreatures() {
  const creatures = [];
  const creatureMat = new THREE.MeshBasicMaterial({ color: 0x0a0015, transparent: true, opacity: 0 });

  for (let i = 0; i < 6; i++) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.ConeGeometry(1, 4, 5), creatureMat.clone());
    body.position.y = 2;
    group.add(body);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0 });
    const eyeGeo = new THREE.SphereGeometry(0.15, 6, 6);
    const lEye = new THREE.Mesh(eyeGeo, eyeMat.clone());
    lEye.position.set(-0.3, 3.2, 0.4);
    group.add(lEye);
    const rEye = new THREE.Mesh(eyeGeo, eyeMat.clone());
    rEye.position.set(0.3, 3.2, 0.4);
    group.add(rEye);

    const side = i < 3 ? -1 : 1;
    const zOffset = (i % 3) * -15 - 10;
    group.position.set(side * (6 + Math.random() * 3), TERRAIN_Y, zOffset);
    creatures.push(group);
  }
  return creatures;
}

export function updateDread(delta) {
  if (!active) return;

  timer -= delta;

  // Transition in
  if (timer > DREAD_DURATION - TRANSITION_IN_DURATION) {
    transitionProgress = Math.min(1, (DREAD_DURATION - timer) / TRANSITION_IN_DURATION);
  }
  // Transition out
  else if (timer < TRANSITION_OUT_DURATION) {
    transitionProgress = Math.max(0, timer / TRANSITION_OUT_DURATION);
  } else {
    transitionProgress = 1;
  }

  transitionToDread(transitionProgress);

  // Eyes visibility and pulsing
  if (dreadEyes) {
    dreadEyes.visible = transitionProgress > 0.3;
    const pulse = 0.8 + Math.sin(performance.now() * 0.005) * 0.2;
    dreadEyes.scale.setScalar(pulse * transitionProgress);
  }

  // Shadow creatures fade in/out
  for (const creature of shadowCreatures) {
    creature.traverse((child) => {
      if (child.material && child.material.opacity !== undefined) {
        child.material.opacity = transitionProgress * 0.7;
      }
    });
    creature.rotation.z = Math.sin(performance.now() * 0.002 + creature.position.x) * 0.1;
  }

  // End dread mode
  if (timer <= 0) {
    endDread();
  }
}

function endDread() {
  active = false;
  transitionProgress = 0;
  transitionToDread(0);

  if (dreadEyes) {
    dreadEyes.parent?.remove(dreadEyes);
    dreadEyes = null;
  }

  for (const creature of shadowCreatures) {
    creature.parent?.remove(creature);
  }
  shadowCreatures = [];

  if (dreadQuoteCallback) dreadQuoteCallback();
}

export function isDreadActive() { return active; }

export function getDreadSpeedMultiplier() {
  return active ? DREAD_SPEED_MULTIPLIER : 1;
}

export function cleanupDread() {
  if (active) {
    active = false;
    transitionToDread(0);
    if (dreadEyes) {
      dreadEyes.parent?.remove(dreadEyes);
      dreadEyes = null;
    }
    for (const creature of shadowCreatures) {
      creature.parent?.remove(creature);
    }
    shadowCreatures = [];
  }
}

export function getDreadTimer() { return timer; }
