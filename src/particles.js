// src/particles.js
import * as THREE from 'three';
import { PARTICLE_BUDGET } from './constants.js';

const emitters = [];
let scene = null;
let totalActiveParticles = 0;

export function initParticles(sceneRef) {
  scene = sceneRef;
}

/**
 * Spawn a burst of particles at a world position.
 * @param {Object} config
 * @param {THREE.Vector3} config.position - World position
 * @param {number} config.count - Number of particles
 * @param {number} config.color - Hex color
 * @param {number} config.duration - Lifetime in seconds
 * @param {number} config.speed - Initial velocity magnitude
 * @param {string} config.type - 'burst' | 'spiral' | 'implode'
 * @param {number} [config.size=0.08] - Particle size
 */
export function emitParticles(config) {
  const {
    position, count, color, duration, speed,
    type = 'burst', size = 0.08,
  } = config;

  if (totalActiveParticles + count > PARTICLE_BUDGET) return;

  const colorObj = new THREE.Color(color);
  const particles = [];

  for (let i = 0; i < count; i++) {
    const p = {
      x: position.x, y: position.y, z: position.z,
      vx: 0, vy: 0, vz: 0,
      life: 0,
      maxLife: duration * (0.7 + Math.random() * 0.6),
      size,
    };

    if (type === 'burst') {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI - Math.PI / 2;
      p.vx = Math.cos(theta) * Math.cos(phi) * speed * (0.5 + Math.random() * 0.5);
      p.vy = Math.sin(phi) * speed * (0.5 + Math.random() * 0.5) + 2;
      p.vz = Math.sin(theta) * Math.cos(phi) * speed * (0.5 + Math.random() * 0.5);
    } else if (type === 'spiral') {
      const angle = (i / count) * Math.PI * 4;
      const r = 0.5 + Math.random();
      p.vx = Math.cos(angle) * r * speed * 0.3;
      p.vy = speed * 0.5 + Math.random() * 2;
      p.vz = Math.sin(angle) * r * speed * 0.3;
    } else if (type === 'implode') {
      const theta = Math.random() * Math.PI * 2;
      const r = 1.5 + Math.random() * 1.5;
      p.x += Math.cos(theta) * r;
      p.z += Math.sin(theta) * r;
      p.y += (Math.random() - 0.5) * r;
      p.originX = position.x;
      p.originY = position.y;
      p.originZ = position.z;
      p.vx = 0; p.vy = 0; p.vz = 0;
      p.implode = true;
    }

    particles.push(p);
  }

  const geom = new THREE.BufferGeometry();
  const posAttr = new Float32Array(count * 3);
  const colAttr = new Float32Array(count * 3);
  const sizeAttr = new Float32Array(count);
  geom.setAttribute('position', new THREE.BufferAttribute(posAttr, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(colAttr, 3));
  geom.setAttribute('size', new THREE.BufferAttribute(sizeAttr, 1));

  const mat = new THREE.PointsMaterial({
    size,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geom, mat);
  scene.add(points);

  emitters.push({
    particles, points, geom, mat,
    color: colorObj,
    maxDuration: duration * 1.3,
    elapsed: 0, type,
  });

  totalActiveParticles += count;
}

export function updateParticles(delta) {
  for (let e = emitters.length - 1; e >= 0; e--) {
    const emitter = emitters[e];
    emitter.elapsed += delta;

    const posArr = emitter.geom.attributes.position.array;
    const colArr = emitter.geom.attributes.color.array;

    let allDead = true;

    for (let i = 0; i < emitter.particles.length; i++) {
      const p = emitter.particles[i];
      p.life += delta;

      if (p.life >= p.maxLife) {
        posArr[i * 3] = 0; posArr[i * 3 + 1] = -100; posArr[i * 3 + 2] = 0;
        continue;
      }

      allDead = false;
      const t = p.life / p.maxLife;

      if (p.implode) {
        if (t < 0.4) {
          const it = t / 0.4;
          p.x = THREE.MathUtils.lerp(p.x, p.originX, it * 0.1);
          p.y = THREE.MathUtils.lerp(p.y, p.originY, it * 0.1);
          p.z = THREE.MathUtils.lerp(p.z, p.originZ, it * 0.1);
        } else {
          if (!p.exploded) {
            p.exploded = true;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI - Math.PI / 2;
            const s = 6 + Math.random() * 4;
            p.vx = Math.cos(theta) * Math.cos(phi) * s;
            p.vy = Math.sin(phi) * s + 2;
            p.vz = Math.sin(theta) * Math.cos(phi) * s;
          }
          p.x += p.vx * delta;
          p.vy -= 8 * delta;
          p.y += p.vy * delta;
          p.z += p.vz * delta;
        }
      } else {
        p.x += p.vx * delta;
        p.vy -= 5 * delta;
        p.y += p.vy * delta;
        p.z += p.vz * delta;
      }

      posArr[i * 3] = p.x;
      posArr[i * 3 + 1] = p.y;
      posArr[i * 3 + 2] = p.z;

      const fade = 1 - t;
      colArr[i * 3] = emitter.color.r * fade;
      colArr[i * 3 + 1] = emitter.color.g * fade;
      colArr[i * 3 + 2] = emitter.color.b * fade;
    }

    emitter.geom.attributes.position.needsUpdate = true;
    emitter.geom.attributes.color.needsUpdate = true;
    emitter.mat.opacity = Math.max(0, 1 - emitter.elapsed / emitter.maxDuration);

    if (allDead || emitter.elapsed >= emitter.maxDuration) {
      scene.remove(emitter.points);
      emitter.geom.dispose();
      emitter.mat.dispose();
      totalActiveParticles -= emitter.particles.length;
      emitters.splice(e, 1);
    }
  }
}

export function clearParticles() {
  for (const emitter of emitters) {
    scene.remove(emitter.points);
    emitter.geom.dispose();
    emitter.mat.dispose();
  }
  emitters.length = 0;
  totalActiveParticles = 0;
}

export function getActiveParticleCount() {
  return totalActiveParticles;
}
