// src/penguin.js
import * as THREE from 'three';
import {
  LANE_POSITIONS, PLAYER_START_LANE, LANE_SWITCH_SPEED,
  JUMP_FORCE, GRAVITY, SLIDE_DURATION,
  PENGUIN_HEIGHT, PENGUIN_RADIUS, TERRAIN_Y, BASE_SPEED,
} from './constants.js';

let penguinGroup = null;
let currentLane = PLAYER_START_LANE;
let targetX = LANE_POSITIONS[currentLane];
let velocityY = 0;
let isJumping = false;
let isSliding = false;
let slideTimer = 0;
let invincible = false;
let invincibilityTimer = 0;
let blinkTimer = 0;
let waddleTime = 0;

// Animated part references
let body = null, leftFoot = null, rightFoot = null, leftWing = null, rightWing = null;

// Material references for skin system
let bodyMat = null, bellyMat = null, headMat = null;
let beakMat = null, footMat = null, wingMat = null;

const normalScaleY = 1;
const slideScaleY = 0.5;

export function createPenguin(scene) {
  penguinGroup = new THREE.Group();

  // Body
  const bodyGeo = new THREE.SphereGeometry(PENGUIN_RADIUS, 16, 12);
  bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
  body = new THREE.Mesh(bodyGeo, bodyMat);
  body.scale.set(1, 1.4, 0.9);
  body.position.y = PENGUIN_HEIGHT * 0.45;
  body.castShadow = true;
  penguinGroup.add(body);

  // Belly
  const bellyGeo = new THREE.SphereGeometry(PENGUIN_RADIUS * 0.7, 12, 10);
  bellyMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const belly = new THREE.Mesh(bellyGeo, bellyMat);
  belly.scale.set(0.8, 1.2, 0.6);
  belly.position.set(0, PENGUIN_HEIGHT * 0.4, PENGUIN_RADIUS * 0.35);
  penguinGroup.add(belly);

  // Head
  const headGeo = new THREE.SphereGeometry(PENGUIN_RADIUS * 0.6, 12, 10);
  headMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = PENGUIN_HEIGHT * 0.85;
  head.castShadow = true;
  penguinGroup.add(head);

  // Eyes
  const eyeWhiteGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const pupilGeo = new THREE.SphereGeometry(0.035, 8, 8);
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
  for (const xOff of [-0.1, 0.1]) {
    const eyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    eyeWhite.position.set(xOff, PENGUIN_HEIGHT * 0.88, PENGUIN_RADIUS * 0.5);
    penguinGroup.add(eyeWhite);
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(xOff, PENGUIN_HEIGHT * 0.88, PENGUIN_RADIUS * 0.55);
    penguinGroup.add(pupil);
  }

  // Beak
  const beakGeo = new THREE.ConeGeometry(0.06, 0.18, 8);
  beakMat = new THREE.MeshStandardMaterial({ color: 0xff8c00 });
  const beak = new THREE.Mesh(beakGeo, beakMat);
  beak.position.set(0, PENGUIN_HEIGHT * 0.82, PENGUIN_RADIUS * 0.65);
  beak.rotation.x = -Math.PI / 2;
  penguinGroup.add(beak);

  // Feet
  const footGeo = new THREE.BoxGeometry(0.15, 0.05, 0.2);
  footMat = new THREE.MeshStandardMaterial({ color: 0xff8c00 });
  leftFoot = new THREE.Mesh(footGeo, footMat);
  leftFoot.position.set(-0.12, 0.025, 0.05); leftFoot.castShadow = true;
  penguinGroup.add(leftFoot);
  rightFoot = new THREE.Mesh(footGeo, footMat);
  rightFoot.position.set(0.12, 0.025, 0.05); rightFoot.castShadow = true;
  penguinGroup.add(rightFoot);

  // Wings
  const wingGeo = new THREE.BoxGeometry(0.08, 0.35, 0.2);
  wingMat = new THREE.MeshStandardMaterial({ color: 0x2a2a4a });
  leftWing = new THREE.Mesh(wingGeo, wingMat);
  leftWing.position.set(-PENGUIN_RADIUS - 0.04, PENGUIN_HEIGHT * 0.45, 0); leftWing.castShadow = true;
  penguinGroup.add(leftWing);
  rightWing = new THREE.Mesh(wingGeo, wingMat);
  rightWing.position.set(PENGUIN_RADIUS + 0.04, PENGUIN_HEIGHT * 0.45, 0); rightWing.castShadow = true;
  penguinGroup.add(rightWing);

  // Face away from camera
  penguinGroup.rotation.y = Math.PI;
  penguinGroup.position.set(LANE_POSITIONS[currentLane], TERRAIN_Y, 0);

  scene.add(penguinGroup);
  return penguinGroup;
}

// ---------------------------------------------------------------------------
// Skin application
// ---------------------------------------------------------------------------
export function applySkin(skin) {
  const c = skin.colors;
  if (bodyMat) bodyMat.color.setHex(c.body);
  if (bellyMat) bellyMat.color.setHex(c.belly);
  if (headMat) headMat.color.setHex(c.head);
  if (beakMat) beakMat.color.setHex(c.beak);
  if (footMat) footMat.color.setHex(c.feet);
  if (wingMat) wingMat.color.setHex(c.wings);

  // Special material properties
  const mats = [bodyMat, bellyMat, headMat, wingMat];
  for (const m of mats) {
    if (!m) continue;
    m.transparent = !!skin.transparent;
    m.opacity = skin.transparent ? 0.55 : 1;
    m.metalness = skin.metallic ? 0.7 : 0;
    m.roughness = skin.metallic ? 0.3 : (m === bellyMat ? 0.5 : 0.6);
  }
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------
export function updatePenguin(delta, speed) {
  if (!penguinGroup) return;

  targetX = LANE_POSITIONS[currentLane];
  const dx = targetX - penguinGroup.position.x;
  if (Math.abs(dx) > 0.01) {
    penguinGroup.position.x += Math.sign(dx) * Math.min(LANE_SWITCH_SPEED * delta, Math.abs(dx));
  } else {
    penguinGroup.position.x = targetX;
  }

  if (isJumping) {
    velocityY -= GRAVITY * delta;
    penguinGroup.position.y += velocityY * delta;
    if (penguinGroup.position.y <= TERRAIN_Y) {
      penguinGroup.position.y = TERRAIN_Y;
      velocityY = 0;
      isJumping = false;
    }
  }

  if (isSliding) {
    slideTimer -= delta;
    if (slideTimer <= 0) { isSliding = false; penguinGroup.scale.y = normalScaleY; }
    else penguinGroup.scale.y = slideScaleY;
  }

  if (invincible) {
    invincibilityTimer -= delta;
    blinkTimer += delta;
    penguinGroup.visible = Math.sin(blinkTimer * 20) > 0;
    if (invincibilityTimer <= 0) {
      invincible = false; invincibilityTimer = 0; blinkTimer = 0;
      penguinGroup.visible = true;
    }
  }

  if (!isJumping && !isSliding) {
    const speedFactor = (speed || BASE_SPEED) / BASE_SPEED;
    waddleTime += delta * 8 * speedFactor;
    body.rotation.z = Math.sin(waddleTime) * 0.05;
    leftFoot.position.z = 0.05 + Math.sin(waddleTime) * 0.06;
    rightFoot.position.z = 0.05 + Math.sin(waddleTime + Math.PI) * 0.06;
    leftWing.rotation.z = Math.sin(waddleTime) * 0.15;
    rightWing.rotation.z = -Math.sin(waddleTime) * 0.15;
  } else {
    body.rotation.z = 0;
    leftFoot.position.z = 0.05; rightFoot.position.z = 0.05;
    leftWing.rotation.z = 0; rightWing.rotation.z = 0;
  }
}

export function switchLane(dir) {
  const n = currentLane + dir;
  if (n >= 0 && n < LANE_POSITIONS.length) currentLane = n;
}

export function jump() {
  if (!isJumping && !isSliding && penguinGroup.position.y <= TERRAIN_Y) {
    isJumping = true; velocityY = JUMP_FORCE;
  }
}

export function slide() {
  if (!isJumping && !isSliding && penguinGroup.position.y <= TERRAIN_Y) {
    isSliding = true; slideTimer = SLIDE_DURATION; penguinGroup.scale.y = slideScaleY;
  }
}

export function startInvincibility(d) { invincible = true; invincibilityTimer = d; blinkTimer = 0; }
export function isInvincible() { return invincible; }
export function isPlayerJumping() { return isJumping; }
export function isPlayerSliding() { return isSliding; }
export function getCurrentLane() { return currentLane; }
export function getPenguinGroup() { return penguinGroup; }

export function getPenguinBoundingBox() {
  if (!penguinGroup) return new THREE.Box3();
  const box = new THREE.Box3();
  const pos = penguinGroup.position;
  const halfW = PENGUIN_RADIUS;
  const height = isSliding ? PENGUIN_HEIGHT * slideScaleY : PENGUIN_HEIGHT;
  box.min.set(pos.x - halfW, pos.y, pos.z - halfW);
  box.max.set(pos.x + halfW, pos.y + height, pos.z + halfW);
  return box;
}

export function resetPenguin() {
  currentLane = PLAYER_START_LANE;
  targetX = LANE_POSITIONS[currentLane];
  velocityY = 0; isJumping = false; isSliding = false; slideTimer = 0;
  invincible = false; invincibilityTimer = 0; blinkTimer = 0; waddleTime = 0;
  if (penguinGroup) {
    penguinGroup.position.set(LANE_POSITIONS[currentLane], TERRAIN_Y, 0);
    penguinGroup.rotation.y = Math.PI;
    penguinGroup.scale.y = normalScaleY;
    penguinGroup.visible = true;
    body.rotation.z = 0;
    leftFoot.position.z = 0.05; rightFoot.position.z = 0.05;
    leftWing.rotation.z = 0; rightWing.rotation.z = 0;
  }
}
