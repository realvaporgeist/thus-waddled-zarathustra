// src/collision.js
import * as THREE from 'three';
import { PENGUIN_RADIUS, PENGUIN_HEIGHT, TERRAIN_Y, LANE_POSITIONS, LANE_WIDTH } from './constants.js';

const _playerBox = new THREE.Box3();
const _obstacleBox = new THREE.Box3();

/**
 * AABB collision test between the penguin and a single obstacle.
 *
 * @param {THREE.Vector3} penguinPos  - penguin group world position
 * @param {boolean}       penguinSliding - true when the penguin is sliding
 * @param {boolean}       penguinJumping - true when the penguin is jumping
 * @param {object}        obstacle - { mesh, height, type ('ground'|'overhead'), typeName, ... }
 * @returns {boolean} true if the two bounding boxes overlap
 */
export function checkCollision(penguinPos, penguinSliding, penguinJumping, obstacle) {
  // --- Ice wall: custom wide hitbox with open-lane gap ---
  if (obstacle.typeName === 'iceWall') {
    const playerLaneX = penguinPos.x;
    const openX = LANE_POSITIONS[obstacle.openLane];
    if (Math.abs(playerLaneX - openX) < LANE_WIDTH * 0.45) return false;
    const dz = Math.abs(penguinPos.z - obstacle.mesh.position.z);
    return dz < 1.0;
  }

  // --- Ice spike: slide-only counter (too tall to jump over) ---
  if (obstacle.typeName === 'iceSpike') {
    if (penguinSliding) return false;
    const dz = Math.abs(penguinPos.z - obstacle.mesh.position.z);
    const dx = Math.abs(penguinPos.x - obstacle.mesh.position.x);
    return dz < 1.0 && dx < LANE_WIDTH * 0.45;
  }

  // --- Crevasse: only hits grounded players ---
  if (obstacle.typeName === 'crevasse') {
    if (penguinJumping) return false;
    const dz = Math.abs(penguinPos.z - obstacle.mesh.position.z);
    const dx = Math.abs(penguinPos.x - obstacle.mesh.position.x);
    return dz < 1.0 && dx < LANE_WIDTH * 0.45;
  }

  // --- Standard AABB collision ---
  // Player bounding box — shorter when sliding
  const playerH = penguinSliding ? PENGUIN_HEIGHT * 0.5 : PENGUIN_HEIGHT;
  _playerBox.min.set(
    penguinPos.x - PENGUIN_RADIUS,
    penguinPos.y,
    penguinPos.z - PENGUIN_RADIUS,
  );
  _playerBox.max.set(
    penguinPos.x + PENGUIN_RADIUS,
    penguinPos.y + playerH,
    penguinPos.z + PENGUIN_RADIUS,
  );

  // Obstacle bounding box
  const obsPos = obstacle.mesh.position;
  const obsHalfW = 0.8;
  const obsH = obstacle.height;

  if (obstacle.type === 'overhead') {
    // Overhead obstacles float above the ground
    _obstacleBox.min.set(obsPos.x - obsHalfW, TERRAIN_Y + 1.0, obsPos.z - obsHalfW);
    _obstacleBox.max.set(obsPos.x + obsHalfW, TERRAIN_Y + obsH + 1.0, obsPos.z + obsHalfW);
  } else {
    // Ground obstacles sit on the terrain
    _obstacleBox.min.set(obsPos.x - obsHalfW, TERRAIN_Y, obsPos.z - obsHalfW);
    _obstacleBox.max.set(obsPos.x + obsHalfW, TERRAIN_Y + obsH, obsPos.z + obsHalfW);
  }

  return _playerBox.intersectsBox(_obstacleBox);
}
