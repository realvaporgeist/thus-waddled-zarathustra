// src/weather.js
import * as THREE from 'three';
import {
  WEATHER_TYPES, WEATHER_CHANGE_MIN, WEATHER_CHANGE_MAX,
  WEATHER_CROSSFADE_DURATION, SNOW_PARTICLE_COUNTS,
  SNOW_AREA_WIDTH, SNOW_AREA_HEIGHT, SNOW_AREA_DEPTH,
  BLIZZARD_WIND_DRIFT, WEATHER_FOG,
  SKY_COLOR, FOG_COLOR, NORMAL_FOG_NEAR, NORMAL_FOG_FAR,
} from './constants.js';
import { setAuroraOpacity } from './aurora.js';

let scene = null;
let snowPoints = null;
let snowPositions = null;
let snowVelocities = null;
let snowCount = 0;
const MAX_SNOW = 600;

let currentWeather = 'lightSnow';
let nextWeather = null;
let weatherTimer = 0;
let crossfadeTimer = 0;
let crossfading = false;

let dreadOverride = false;
let savedWeather = null;

let currentSky = new THREE.Color(SKY_COLOR);
let currentFog = new THREE.Color(FOG_COLOR);
let currentFogNear = NORMAL_FOG_NEAR;
let currentFogFar = NORMAL_FOG_FAR;

export function initWeather(sceneRef) {
  scene = sceneRef;

  const geometry = new THREE.BufferGeometry();
  snowPositions = new Float32Array(MAX_SNOW * 3);
  snowVelocities = new Float32Array(MAX_SNOW * 3);

  for (let i = 0; i < MAX_SNOW; i++) {
    snowPositions[i * 3] = 0;
    snowPositions[i * 3 + 1] = -100;
    snowPositions[i * 3 + 2] = 0;
    snowVelocities[i * 3] = 0;
    snowVelocities[i * 3 + 1] = -2 - Math.random() * 3;
    snowVelocities[i * 3 + 2] = 0;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.15,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    sizeAttenuation: true,
  });

  snowPoints = new THREE.Points(geometry, material);
  scene.add(snowPoints);

  snowCount = SNOW_PARTICLE_COUNTS[currentWeather];
  resetSnowPositions(snowCount);

  weatherTimer = WEATHER_CHANGE_MIN + Math.random() * (WEATHER_CHANGE_MAX - WEATHER_CHANGE_MIN);

  applyWeatherVisuals(currentWeather, 1);
}

function resetSnowPositions(count) {
  for (let i = 0; i < MAX_SNOW; i++) {
    if (i < count) {
      snowPositions[i * 3] = (Math.random() - 0.5) * SNOW_AREA_WIDTH;
      snowPositions[i * 3 + 1] = Math.random() * SNOW_AREA_HEIGHT;
      snowPositions[i * 3 + 2] = -Math.random() * SNOW_AREA_DEPTH;
      snowVelocities[i * 3] = 0;
      snowVelocities[i * 3 + 1] = -2 - Math.random() * 3;
      snowVelocities[i * 3 + 2] = 0;
    } else {
      snowPositions[i * 3 + 1] = -100;
    }
  }
}

function applyWeatherVisuals(weatherType, blend) {
  const config = WEATHER_FOG[weatherType];
  if (!config) return;

  const targetSky = new THREE.Color(config.skyColor);
  const targetFog = new THREE.Color(config.fogColor);

  currentSky.lerp(targetSky, blend);
  currentFog.lerp(targetFog, blend);
  currentFogNear = THREE.MathUtils.lerp(currentFogNear, config.fogNear, blend);
  currentFogFar = THREE.MathUtils.lerp(currentFogFar, config.fogFar, blend);

  scene.background.copy(currentSky);
  scene.fog.color.copy(currentFog);
  scene.fog.near = currentFogNear;
  scene.fog.far = currentFogFar;

  const auroraOpacity = {
    lightSnow: 0.4,
    blizzard: 0.0,
    clearAurora: 1.0,
    fog: 0.0,
  };
  setAuroraOpacity(auroraOpacity[weatherType] ?? 0.4);
}

export function updateWeather(delta) {
  if (dreadOverride) return;

  if (crossfading) {
    crossfadeTimer += delta;
    const t = Math.min(crossfadeTimer / WEATHER_CROSSFADE_DURATION, 1);

    applyWeatherVisuals(nextWeather, t * 0.1);

    const fromCount = SNOW_PARTICLE_COUNTS[currentWeather];
    const toCount = SNOW_PARTICLE_COUNTS[nextWeather];
    snowCount = Math.round(THREE.MathUtils.lerp(fromCount, toCount, t));

    if (t >= 1) {
      crossfading = false;
      currentWeather = nextWeather;
      nextWeather = null;
      weatherTimer = WEATHER_CHANGE_MIN + Math.random() * (WEATHER_CHANGE_MAX - WEATHER_CHANGE_MIN);
    }
  } else {
    weatherTimer -= delta;
    if (weatherTimer <= 0) {
      const options = WEATHER_TYPES.filter(w => w !== currentWeather);
      nextWeather = options[Math.floor(Math.random() * options.length)];
      crossfading = true;
      crossfadeTimer = 0;
    }
  }

  const isBlizzard = (crossfading ? nextWeather : currentWeather) === 'blizzard';
  const windX = isBlizzard ? BLIZZARD_WIND_DRIFT : 0;

  for (let i = 0; i < MAX_SNOW; i++) {
    if (i >= snowCount) {
      if (snowPositions[i * 3 + 1] > -50) {
        snowPositions[i * 3 + 1] -= 10 * delta;
      }
      continue;
    }

    snowPositions[i * 3] += (snowVelocities[i * 3] + windX) * delta;
    snowPositions[i * 3 + 1] += snowVelocities[i * 3 + 1] * delta;
    snowPositions[i * 3 + 2] += snowVelocities[i * 3 + 2] * delta;

    if (snowPositions[i * 3 + 1] < -1) {
      snowPositions[i * 3] = (Math.random() - 0.5) * SNOW_AREA_WIDTH;
      snowPositions[i * 3 + 1] = SNOW_AREA_HEIGHT + Math.random() * 5;
      snowPositions[i * 3 + 2] = -Math.random() * SNOW_AREA_DEPTH;
      snowVelocities[i * 3] = (Math.random() - 0.5) * 0.5;
      snowVelocities[i * 3 + 1] = -2 - Math.random() * 3;
      snowVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }

    snowPositions[i * 3] += Math.sin(performance.now() * 0.001 + i) * 0.003;
  }

  snowPoints.geometry.attributes.position.needsUpdate = true;
}

export function setDreadOverride(active) {
  if (active && !dreadOverride) {
    dreadOverride = true;
    savedWeather = currentWeather;
  } else if (!active && dreadOverride) {
    dreadOverride = false;
    currentSky.set(WEATHER_FOG[savedWeather].skyColor);
    currentFog.set(WEATHER_FOG[savedWeather].fogColor);
    currentFogNear = WEATHER_FOG[savedWeather].fogNear;
    currentFogFar = WEATHER_FOG[savedWeather].fogFar;
    snowCount = SNOW_PARTICLE_COUNTS[savedWeather];
  }
}

export function setWeather(weatherType) {
  if (!WEATHER_TYPES.includes(weatherType)) return;
  currentWeather = weatherType;
  snowCount = SNOW_PARTICLE_COUNTS[weatherType];
  resetSnowPositions(snowCount);
  applyWeatherVisuals(weatherType, 1);
  weatherTimer = WEATHER_CHANGE_MIN + Math.random() * (WEATHER_CHANGE_MAX - WEATHER_CHANGE_MIN);
  crossfading = false;
}

export function getCurrentWeather() {
  return currentWeather;
}

export function cleanupWeather() {
  if (snowPoints) {
    scene.remove(snowPoints);
    snowPoints.geometry.dispose();
    snowPoints.material.dispose();
    snowPoints = null;
  }
}
