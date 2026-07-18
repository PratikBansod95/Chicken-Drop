export const WORLD = {
  width: 1000,
  height: 1180,
} as const;

export type ToolKind = "spring" | "ramp" | "pad" | "fan" | "conveyor" | "sticky";
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
  bodyIds?: number[];
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
  chapter?: number;
  chapterName?: string;
  mechanic?: ToolKind | HazardKind | "draw" | "mastery";
  tutorial?: string;
  referenceSolution?: ReferenceSolution;
}

export interface SaveData {
  version: 2;
  unlockedLevel: number;
  selectedLevel: number;
  bestStars: number[];
  muted: boolean;
  sfxMuted: boolean;
  musicMuted: boolean;
  reduceMotion: boolean;
  tutorialsSeen: string[];
  failures: number[];
}

export type NestCaptureState = "outside" | "entered" | "supported" | "settled" | "captured";

export interface EggRuntime {
  id: string;
  bodyId: number;
  nested: boolean;
  broken: boolean;
  nestState: NestCaptureState;
  settleTime: number;
}

export interface InkStroke {
  points: Vec2[];
}

export interface ReferenceSolution {
  strokes: InkStroke[];
  tools: PlacedTool[];
  maxTimeSec: number;
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
  spring: { label: "Spring", unlock: 6, w: 84, h: 90, color: "#6bcf7f" },
  ramp: { label: "Ramp", unlock: 1, w: 120, h: 100, color: "#e2a354" },
  pad: { label: "Pad", unlock: 11, w: 110, h: 62, color: "#7ec8ff" },
  fan: { label: "Fan", unlock: 16, w: 84, h: 92, color: "#9be7ff" },
  conveyor: { label: "Belt", unlock: 21, w: 145, h: 54, color: "#c9a66b" },
  sticky: { label: "Sticky", unlock: 26, w: 135, h: 62, color: "#d4a5ff" },
};
