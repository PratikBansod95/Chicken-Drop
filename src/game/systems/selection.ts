import type { PlacedTool, ToolKind, Vec2 } from "../types";
import { TOOL_META } from "../types";

export function hitTestTool(placed: PlacedTool[], p: Vec2): PlacedTool | null {
  for (let i = placed.length - 1; i >= 0; i--) {
    const t = placed[i];
    const hw = t.w * 0.55;
    const hh = t.h * 0.55;
    // rotate point into local space
    const dx = p.x - t.x;
    const dy = p.y - t.y;
    const c = Math.cos(-t.angle);
    const s = Math.sin(-t.angle);
    const lx = dx * c - dy * s;
    const ly = dx * s + dy * c;
    if (Math.abs(lx) <= hw && Math.abs(ly) <= hh) return t;
  }
  return null;
}

export function createPlacedTool(kind: ToolKind, p: Vec2): PlacedTool {
  const meta = TOOL_META[kind];
  return {
    id: `${kind}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    type: kind,
    x: p.x,
    y: p.y,
    angle: 0,
    w: meta.w,
    h: meta.h,
    dir: 1,
    bodyIds: [],
  };
}

export type UndoAction =
  | { type: "stroke"; inkDelta: number }
  | { type: "place"; toolId: string; kind: ToolKind }
  | { type: "delete"; tool: PlacedTool }
  | { type: "move"; toolId: string; from: Vec2; to: Vec2 }
  | { type: "rotate"; toolId: string; fromAngle: number; toAngle: number };
