export const WORLD = {
  width: 1000,
  height: 1180,
} as const;

export const EGG_RADIUS = 22;

export const TWEAKS = {
  gravity: 1.05,
  breakImpulse: 0.085,
  nestSettleSpeed: 1.35,
  nestHoldFrames: 10,
  bounceScale: 1,
  fanForce: 0.0042,
  eggLaySpacingMs: 420,
  inkBudgetScale: 1,
};

export type ToolKind = "spring" | "pad" | "fan" | "conveyor" | "sticky";
export type HazardKind = "spike" | "fire" | "pan";
export type PlacedKind = ToolKind | HazardKind;

export type GameMode = "intro" | "ready" | "laying" | "running" | "won" | "failed";

export type SelectedTool = "draw" | ToolKind;

export interface Vec2 {
  x: number;
  y: number;
}

export interface StarSpot extends Vec2 {
  collected: boolean;
}

export interface FixedObject {
  id: string;
  type: PlacedKind;
  x: number;
  y: number;
  angle: number;
  w: number;
  h: number;
  fixed: boolean;
  rotating?: boolean;
  rotateSpeed?: number;
  dir?: number;
}

export interface LevelData {
  number: number;
  name: string;
  eggCount: number;
  start: Vec2;
  basket: Vec2;
  stars: StarSpot[];
  fixedObjects: FixedObject[];
  tools: Partial<Record<ToolKind, number>>;
  inkLimit: number;
  parInk: number;
  parTools: number;
  timeLimit: number;
}

export interface SaveData {
  version: 1;
  unlockedLevel: number;
  bestStars: number[];
  muted: boolean;
}

export interface EggRuntime {
  id: string;
  bodyId: number;
  nested: boolean;
  broken: boolean;
  nestHold: number;
  pinConstraintId?: number;
}
