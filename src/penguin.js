// src/penguin.js
import * as THREE from 'three';
import {
  LANE_POSITIONS, PLAYER_START_LANE, LANE_SWITCH_SPEED,
  JUMP_FORCE, GRAVITY, SLIDE_DURATION,
  PENGUIN_HEIGHT, PENGUIN_RADIUS, TERRAIN_Y, BASE_SPEED,
  IDLE_WADDLE_SPEED, IDLE_BLINK_MIN, IDLE_BLINK_MAX,
  IDLE_BLINK_DURATION, IDLE_LOOK_MIN, IDLE_LOOK_MAX,
  IDLE_LOOK_DURATION, KNOCKBACK_DURATION, KNOCKBACK_DISTANCE,
  LANE_WIDTH,
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

// Idle animation state
let idleMode = false;
let idleBlinkTimer = 0;
let idleBlinkCooldown = 4;
let isBlinking = false;
let idleLookTimer = 0;
let idleLookCooldown = 7;
let idleLookDirection = 0;
let idleLookProgress = 0;

// Knockback state
let knockbackActive = false;
let knockbackTimer = 0;

// Shield visual
let shieldMesh = null;

// Head reference for look animation
let head = null;

// Eye references for blink
let eyeWhites = [];
let pupils = [];

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
  head = new THREE.Mesh(headGeo, headMat);
  head.position.y = PENGUIN_HEIGHT * 0.85;
  head.castShadow = true;
  penguinGroup.add(head);

  // Eyes
  const eyeWhiteGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const pupilGeo = new THREE.SphereGeometry(0.035, 8, 8);
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
  eyeWhites = [];
  pupils = [];
  for (const xOff of [-0.1, 0.1]) {
    const eyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    eyeWhite.position.set(xOff, PENGUIN_HEIGHT * 0.88, PENGUIN_RADIUS * 0.5);
    penguinGroup.add(eyeWhite);
    eyeWhites.push(eyeWhite);
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(xOff, PENGUIN_HEIGHT * 0.88, PENGUIN_RADIUS * 0.55);
    penguinGroup.add(pupil);
    pupils.push(pupil);
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

  // Disco ball accessory
  const existingBall = penguinGroup.getObjectByName('discoBall');
  if (existingBall) {
    penguinGroup.remove(existingBall);
    existingBall.geometry.dispose();
    existingBall.material.dispose();
  }
  if (skin.discoBall) {
    const ballGeo = new THREE.IcosahedronGeometry(0.15, 1);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc, metalness: 0.9, roughness: 0.1,
      emissive: 0xffffff, emissiveIntensity: 0.2,
    });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.position.y = PENGUIN_HEIGHT + 0.4;
    ball.name = 'discoBall';
    penguinGroup.add(ball);
  }
}

// ---------------------------------------------------------------------------
// Idle animation
// ---------------------------------------------------------------------------
function updateIdle(delta) {
  if (!penguinGroup || !idleMode) return;

  waddleTime += delta * IDLE_WADDLE_SPEED;
  body.rotation.z = Math.sin(waddleTime) * 0.03;
  leftWing.rotation.z = Math.sin(waddleTime) * 0.08;
  rightWing.rotation.z = -Math.sin(waddleTime) * 0.08;

  // Blink
  idleBlinkTimer += delta;
  if (isBlinking) {
    if (idleBlinkTimer >= IDLE_BLINK_DURATION) {
      isBlinking = false;
      idleBlinkTimer = 0;
      idleBlinkCooldown = IDLE_BLINK_MIN + Math.random() * (IDLE_BLINK_MAX - IDLE_BLINK_MIN);
      for (const ew of eyeWhites) ew.scale.y = 1;
      for (const p of pupils) p.visible = true;
    } else {
      for (const ew of eyeWhites) ew.scale.y = 0.1;
      for (const p of pupils) p.visible = false;
    }
  } else {
    if (idleBlinkTimer >= idleBlinkCooldown) {
      isBlinking = true;
      idleBlinkTimer = 0;
    }
  }

  // Head look
  idleLookTimer += delta;
  if (idleLookDirection === 0) {
    if (idleLookTimer >= idleLookCooldown) {
      idleLookDirection = Math.random() < 0.5 ? -1 : 1;
      idleLookTimer = 0;
      idleLookProgress = 0;
    }
  } else {
    idleLookProgress += delta / IDLE_LOOK_DURATION;
    if (idleLookProgress >= 1) {
      idleLookDirection = 0;
      idleLookTimer = 0;
      idleLookCooldown = IDLE_LOOK_MIN + Math.random() * (IDLE_LOOK_MAX - IDLE_LOOK_MIN);
      if (head) head.rotation.y = 0;
    } else {
      const t = Math.sin(idleLookProgress * Math.PI);
      if (head) head.rotation.y = idleLookDirection * t * 0.4;
    }
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

  // Knockback
  if (knockbackActive) {
    knockbackTimer += delta;
    const t = knockbackTimer / KNOCKBACK_DURATION;
    if (t >= 1) {
      knockbackActive = false;
      penguinGroup.position.z = 0;
    } else {
      const ease = Math.sin(t * Math.PI);
      penguinGroup.position.z = ease * KNOCKBACK_DISTANCE;
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

  const discoBall = penguinGroup?.getObjectByName('discoBall');
  if (discoBall) discoBall.rotation.y += delta * 3;
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
  idleMode = false;
  knockbackActive = false;
  knockbackTimer = 0;
  if (head) head.rotation.y = 0;
  for (const ew of eyeWhites) ew.scale.y = 1;
  for (const p of pupils) p.visible = true;
}

export function setIdleMode(enabled) {
  idleMode = enabled;
  if (enabled) {
    waddleTime = 0;
    idleBlinkTimer = 0;
    idleLookTimer = 0;
    idleLookDirection = 0;
    if (head) head.rotation.y = 0;
    for (const ew of eyeWhites) ew.scale.y = 1;
    for (const p of pupils) p.visible = true;
    if (penguinGroup) penguinGroup.rotation.y = 0;
  } else {
    if (penguinGroup) penguinGroup.rotation.y = Math.PI;
    if (head) head.rotation.y = 0;
    for (const ew of eyeWhites) ew.scale.y = 1;
    for (const p of pupils) p.visible = true;
  }
}

export function triggerKnockback() {
  knockbackActive = true;
  knockbackTimer = 0;
}

export function updateIdleAnimation(delta) {
  updateIdle(delta);
}

// ---------------------------------------------------------------------------
// Shield visual
// ---------------------------------------------------------------------------
export function showShieldVisual() {
  if (shieldMesh || !penguinGroup) return;
  const geo = new THREE.SphereGeometry(1.0, 16, 12);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x64c8ff, transparent: true, opacity: 0.2,
    emissive: 0x64c8ff, emissiveIntensity: 0.2,
    side: THREE.DoubleSide,
  });
  shieldMesh = new THREE.Mesh(geo, mat);
  shieldMesh.position.y = 0.6;
  penguinGroup.add(shieldMesh);
}

export function hideShieldVisual() {
  if (!shieldMesh || !penguinGroup) return;
  penguinGroup.remove(shieldMesh);
  shieldMesh.geometry.dispose();
  shieldMesh.material.dispose();
  shieldMesh = null;
}

export function updateShieldVisual(delta) {
  if (!shieldMesh) return;
  shieldMesh.rotation.y += delta * 0.5;
}

// ---------------------------------------------------------------------------
// Drift (for blizzard weather)
// ---------------------------------------------------------------------------
export function applyDrift(dx) {
  if (!penguinGroup) return;
  penguinGroup.position.x += dx;
  const minX = LANE_POSITIONS[0] - LANE_WIDTH * 0.4;
  const maxX = LANE_POSITIONS[2] + LANE_WIDTH * 0.4;
  penguinGroup.position.x = Math.max(minX, Math.min(maxX, penguinGroup.position.x));
}
