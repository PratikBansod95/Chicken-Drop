export const WORLD = {
  width: 1000,
  height: 1180,
} as const;

export const EGG_RADIUS = 22;

export type ToolKind = "spring" | "pad" | "fan" | "conveyor" | "sticky";
export type HazardKind = "spike" | "fire" | "pan";
export type PlacedKind = ToolKind | HazardKind;
export type GameMode =
  | "intro"
  | "map"
  | "ready"
  | "laying"
  | "running"
  | "won"
  | "failed";
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
  reduceMotion: boolean;
  seenTutorial: boolean;
}

export interface EggRuntime {
  id: string;
  bodyId: number;
  nested: boolean;
  broken: boolean;
  nestHold: number;
}

export interface InkStroke {
  points: Vec2[];
}

export interface PlacedTool {
  id: string;
  type: PlacedKind;
  x: number;
  y: number;
  angle: number;
  w: number;
  h: number;
  dir: number;
  bodyIds: number[];
}

export type FailReason = "crack" | "fire" | "pan" | "spike" | "fell" | "timeout";

export const TOOL_META: Record<
  ToolKind,
  { label: string; unlock: number; w: number; h: number; color: string }
> = {
  spring: { label: "Spring", unlock: 2, w: 84, h: 90, color: "#6bcf7f" },
  pad: { label: "Pad", unlock: 4, w: 110, h: 62, color: "#7ec8ff" },
  fan: { label: "Fan", unlock: 8, w: 84, h: 92, color: "#9be7ff" },
  conveyor: { label: "Belt", unlock: 13, w: 145, h: 54, color: "#c9a66b" },
  sticky: { label: "Sticky", unlock: 18, w: 135, h: 62, color: "#d4a5ff" },
};
