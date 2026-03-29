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
