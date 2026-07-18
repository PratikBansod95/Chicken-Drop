import type { Vec2 } from "../types";

export const SIMULATION = {
  fixedStepMs: 1000 / 60,
  maxFrameMs: 100,
  maxSubsteps: 6,
} as const;

export const EGG_SPEC = {
  radius: 24,
  renderWidth: 50,
  renderHeight: 58,
  density: 0.0019,
  restitution: 0.2,
  friction: 0.085,
  frictionStatic: 0.42,
  frictionAir: 0.0025,
  angularDamping: 0.996,
  maxAngularSpeed: 0.42,
  spawnOffset: { x: -12, y: 54 } satisfies Vec2,
  spawnClearance: 58,
  laySpacingSec: 0.68,
} as const;

export const NEST_SPEC = {
  outerWidth: 360,
  cavityWidth: 300,
  floorWidth: 294,
  floorOffsetY: 54,
  wallHeight: 116,
  wallThickness: 16,
  wallAngle: 0.18,
  sensorWidth: 292,
  sensorHeight: 116,
  sensorOffsetY: 0,
  spriteWidth: 380,
  spriteHeight: 200,
  spriteOffsetY: -96,
  safeMarginX: 190,
  safeMarginBottom: 112,
  settleSpeed: 0.75,
  settleAngularSpeed: 0.08,
  settleDurationSec: 0.42,
} as const;

export const INK_SPEC = {
  physicsThickness: 12,
  outerStroke: 12,
  innerStroke: 6,
  mergeAngleRad: 0.22,
  maxSegmentLength: 92,
} as const;

