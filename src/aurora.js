// src/aurora.js
import * as THREE from 'three';
import {
  AURORA_RIBBON_COUNT, AURORA_Y, AURORA_Z,
  AURORA_WIDTH, AURORA_SEGMENTS,
  AURORA_WAVE_SPEED, AURORA_COLOR_SPEED,
} from './constants.js';

let ribbons = [];
let scene = null;
let currentOpacity = 0.4;
let targetOpacity = 0.4;
let dreadBlend = 0;
let discoMode = false;
let beatPulse = 0;
const BEAT_DECAY = 3;

export function setAuroraDiscoMode(active) {
  discoMode = active;
}

export function pulseAurora(intensity = 1) {
  beatPulse = Math.max(beatPulse, intensity);
}

const normalColors = [
  new THREE.Color(0x00ff88),
  new THREE.Color(0x00ccaa),
  new THREE.Color(0x8844ff),
];
const dreadColors = [
  new THREE.Color(0xff1111),
  new THREE.Color(0xcc0022),
  new THREE.Color(0x880044),
];

export function initAurora(sceneRef) {
  scene = sceneRef;

  for (let r = 0; r < AURORA_RIBBON_COUNT; r++) {
    const geometry = new THREE.BufferGeometry();
    const vertCount = AURORA_SEGMENTS * 2;
    const positions = new Float32Array(vertCount * 3);
    const uvs = new Float32Array(vertCount * 2);
    const indices = [];

    for (let i = 0; i < AURORA_SEGMENTS; i++) {
      const u = i / (AURORA_SEGMENTS - 1);
      const x = (u - 0.5) * AURORA_WIDTH;
      const topIdx = i * 2;
      const botIdx = i * 2 + 1;

      positions[topIdx * 3] = x;
      positions[topIdx * 3 + 1] = 0;
      positions[topIdx * 3 + 2] = 0;

      positions[botIdx * 3] = x;
      positions[botIdx * 3 + 1] = -10 - Math.random() * 6;
      positions[botIdx * 3 + 2] = 0;

      uvs[topIdx * 2] = u;
      uvs[topIdx * 2 + 1] = 1;
      uvs[botIdx * 2] = u;
      uvs[botIdx * 2 + 1] = 0;

      if (i < AURORA_SEGMENTS - 1) {
        indices.push(topIdx, botIdx, topIdx + 2);
        indices.push(botIdx, botIdx + 2, topIdx + 2);
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(indices);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPhase: { value: r * 2.1 },
        uOpacity: { value: currentOpacity },
        uBeatPulse: { value: 0 },
        uColor1: { value: normalColors[0].clone() },
        uColor2: { value: normalColors[1].clone() },
        uColor3: { value: normalColors[2].clone() },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uPhase;
        uniform float uBeatPulse;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          float pulse = 1.0 + uBeatPulse * 1.2;
          float wave = sin(pos.x * 0.04 + uTime + uPhase) * 8.0 * pulse
                     + sin(pos.x * 0.09 + uTime * 0.7 + uPhase) * 4.0 * pulse
                     + sin(pos.x * 0.02 + uTime * 0.3) * 3.0;
          pos.y += wave * uv.y;
          pos.z += sin(pos.x * 0.05 + uTime * 0.5) * 2.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        uniform float uBeatPulse;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        varying vec2 vUv;
        void main() {
          vec3 col = mix(uColor1, uColor2, vUv.x);
          col = mix(col, uColor3, smoothstep(0.4, 0.8, vUv.x));
          float alpha = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
          alpha *= smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
          gl_FragColor = vec4(col, alpha * uOpacity * (1.0 + uBeatPulse * 0.8));
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set((r - 1.5) * 15, AURORA_Y + r * 8, AURORA_Z - r * 15);
    mesh.rotation.x = -0.12;
    scene.add(mesh);

    ribbons.push({ mesh, material, phaseOffset: r * 2.1 });
  }
}

export function updateAurora(delta) {
  beatPulse = Math.max(0, beatPulse - BEAT_DECAY * delta);

  if (discoMode) {
    const hue = (performance.now() * 0.001) % 1;
    for (const ribbon of ribbons) {
      ribbon.material.uniforms.uColor1.value.setHSL(hue, 1, 0.5);
      ribbon.material.uniforms.uColor2.value.setHSL((hue + 0.33) % 1, 1, 0.5);
      ribbon.material.uniforms.uColor3.value.setHSL((hue + 0.66) % 1, 1, 0.5);
      ribbon.material.uniforms.uOpacity.value = 1.0;
      ribbon.material.uniforms.uBeatPulse.value = beatPulse;
      ribbon.material.uniforms.uTime.value = performance.now() * 0.001 * AURORA_WAVE_SPEED;
    }
    return; // Skip normal aurora update
  }

  const time = performance.now() * 0.001;

  currentOpacity += (targetOpacity - currentOpacity) * delta * 2;

  for (const ribbon of ribbons) {
    ribbon.material.uniforms.uTime.value = time * AURORA_WAVE_SPEED;
    ribbon.material.uniforms.uOpacity.value = currentOpacity;
    ribbon.material.uniforms.uBeatPulse.value = beatPulse;

    for (let i = 0; i < 3; i++) {
      const uniform = [`uColor1`, `uColor2`, `uColor3`][i];
      ribbon.material.uniforms[uniform].value.lerpColors(
        normalColors[i], dreadColors[i], dreadBlend
      );
    }
  }
}

export function setAuroraOpacity(opacity) {
  targetOpacity = opacity;
}

export function setAuroraDreadBlend(blend) {
  dreadBlend = blend;
}

export function cleanupAurora() {
  for (const ribbon of ribbons) {
    scene.remove(ribbon.mesh);
    ribbon.material.dispose();
    ribbon.mesh.geometry.dispose();
  }
  ribbons = [];
}
