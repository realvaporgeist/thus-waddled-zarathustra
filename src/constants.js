// src/constants.js

// World
export const LANE_WIDTH = 2.5;
export const LANE_POSITIONS = [-LANE_WIDTH, 0, LANE_WIDTH];
export const PATH_WIDTH = LANE_WIDTH * 3 + 1;
export const CHUNK_LENGTH = 50;
export const VISIBLE_CHUNKS = 4;
export const TERRAIN_Y = 0;

// Camera
export const CAMERA_OFFSET = { x: 0, y: 6, z: 10 };
export const CAMERA_LOOK_AHEAD = 20;
export const CAMERA_FOV = 65;

// Player
export const PLAYER_START_LANE = 1;
export const LANE_SWITCH_SPEED = 10;
export const JUMP_FORCE = 8;
export const GRAVITY = 20;
export const SLIDE_DURATION = 0.6;
export const PENGUIN_HEIGHT = 1.2;
export const PENGUIN_RADIUS = 0.4;

// Speed
export const BASE_SPEED = 12;
export const SPEED_INCREMENT = 0.3;
export const MAX_SPEED = 30;
export const DREAD_SPEED_MULTIPLIER = 1.3;

// Obstacles
export const OBSTACLE_SPAWN_DISTANCE = 80;
export const OBSTACLE_DESPAWN_DISTANCE = -10;
export const MIN_OBSTACLE_GAP = 8;
export const BASE_OBSTACLE_INTERVAL = 1.5;
export const MIN_OBSTACLE_INTERVAL = 0.5;
export const SNOWBALL_SPEED_MULT = 1.4;

// Collectibles
export const FISH_SPAWN_CHANCE = 0.4;
export const GOLDEN_FISH_CHANCE = 0.05;
export const QUOTE_SPAWN_CHANCE = 0.008;
export const ABYSS_ORB_MIN_INTERVAL = 35;
export const ABYSS_ORB_MAX_INTERVAL = 70;
export const FISH_FLOAT_HEIGHT = 1.0;
export const FISH_ROTATE_SPEED = 2;

// Health
export const MAX_HEARTS = 3;
export const INVINCIBILITY_DURATION = 1.5;
export const FISH_PER_HEAL = 10;

// Scoring
export const POINTS_PER_METER = 1;
export const FISH_POINTS = 100;
export const GOLDEN_FISH_POINTS = 500;
export const DREAD_MULTIPLIER = 2;

// Dread mode
export const DREAD_DURATION = 18;
export const DREAD_DAMAGE_MULTIPLIER = 2;
export const DREAD_FOG_NEAR = 5;
export const DREAD_FOG_FAR = 40;
export const NORMAL_FOG_NEAR = 30;
export const NORMAL_FOG_FAR = 200;

// Colors — overcast arctic sky to match the meme aesthetic
export const SKY_COLOR = 0xa8c4d8;
export const FOG_COLOR = 0xb0c8d6;
export const ICE_COLOR = 0xd4f1f9;
export const PATH_COLOR = 0xc0dce8;
export const SNOW_COLOR = 0xf0f4f8;
export const MOUNTAIN_COLOR = 0x7b8da3;
export const DREAD_SKY_COLOR = 0x1a0a2e;
export const DREAD_FOG_COLOR = 0x0d0520;

// Controls
export const SWIPE_THRESHOLD = 30;
export const SWIPE_MAX_TIME = 300;

// Parallax mountains
export const MOUNTAIN_LAYERS = [
  { scrollFactor: 0.1, zBase: -190, scale: 1.3, fogTint: 0.6, yOffset: 0 },   // far
  { scrollFactor: 0.3, zBase: -145, scale: 1.0, fogTint: 0.3, yOffset: 0 },   // mid
  { scrollFactor: 0.6, zBase: -110, scale: 0.7, fogTint: 0.0, yOffset: 0 },   // near
];

// Weather
export const WEATHER_TYPES = ['lightSnow', 'blizzard', 'clearAurora', 'fog'];
export const WEATHER_CHANGE_MIN = 60;
export const WEATHER_CHANGE_MAX = 90;
export const WEATHER_CROSSFADE_DURATION = 5;
export const SNOW_PARTICLE_COUNTS = { lightSnow: 200, blizzard: 600, clearAurora: 0, fog: 100 };
export const SNOW_AREA_WIDTH = 40;
export const SNOW_AREA_HEIGHT = 25;
export const SNOW_AREA_DEPTH = 60;
export const BLIZZARD_WIND_DRIFT = 3;

// Weather fog/sky per type
export const WEATHER_FOG = {
  lightSnow:   { skyColor: 0xa8c4d8, fogColor: 0xb0c8d6, fogNear: 30, fogFar: 200 },
  blizzard:    { skyColor: 0x8a9eb0, fogColor: 0x95aabb, fogNear: 10, fogFar: 80 },
  clearAurora: { skyColor: 0x0a1628, fogColor: 0x0a1628, fogNear: 50, fogFar: 300 },
  fog:         { skyColor: 0x9ab0c0, fogColor: 0xa0b8c8, fogNear: 8, fogFar: 60 },
};

// Aurora
export const AURORA_RIBBON_COUNT = 4;
export const AURORA_Y = 60;
export const AURORA_Z = -100;
export const AURORA_WIDTH = 220;
export const AURORA_SEGMENTS = 96;
export const AURORA_WAVE_SPEED = 0.3;
export const AURORA_COLOR_SPEED = 0.15;

// Particles
export const PARTICLE_BUDGET = 800;
export const COLLECTION_PARTICLES = {
  fish:       { count: 10, color: 0xc0d8e8, duration: 0.3, speed: 5, type: 'burst' },
  goldenFish: { count: 18, color: 0xffd700, duration: 0.5, speed: 4, type: 'burst' },
  quote:      { count: 12, color: 0xffeeaa, duration: 0.4, speed: 3, type: 'spiral' },
  abyssOrb:   { count: 22, color: 0x8800cc, duration: 0.6, speed: 6, type: 'implode' },
};

// Screen effects
export const SCREEN_SHAKE_DURATION = 0.15;
export const SCREEN_SHAKE_INTENSITY_LIGHT = 0.08;
export const SCREEN_SHAKE_INTENSITY_HEAVY = 0.2;
export const VIGNETTE_DURATION = 0.2;
export const VIGNETTE_OPACITY = 0.3;
export const SPEED_LINE_THRESHOLD = 0.8; // fraction of MAX_SPEED
export const NEAR_MISS_THRESHOLD = 0.3;

// Cinematic camera
export const CAMERA_INTRO_DURATION = 3.0;
export const CAMERA_INTRO_START = { x: 0, y: 40, z: 5 };
export const CAMERA_INTRO_END = { x: 0.5, y: 2.5, z: 6 };
export const CAMERA_INTRO_LOOK_START = { x: 0, y: 0, z: -100 };
export const CAMERA_INTRO_LOOK_END = { x: 0, y: 1.5, z: -2 };
export const CAMERA_GAMEPLAY_TRANSITION = 0.5;
export const CAMERA_IDLE_SWAY_SPEED = 0.3;
export const CAMERA_IDLE_SWAY_AMOUNT = 0.5;

// Penguin idle animation
export const IDLE_WADDLE_SPEED = 3;
export const IDLE_BLINK_MIN = 3;
export const IDLE_BLINK_MAX = 6;
export const IDLE_BLINK_DURATION = 0.15;
export const IDLE_LOOK_MIN = 5;
export const IDLE_LOOK_MAX = 10;
export const IDLE_LOOK_DURATION = 1.0;
export const KNOCKBACK_DURATION = 0.2;
export const KNOCKBACK_DISTANCE = 0.3;
