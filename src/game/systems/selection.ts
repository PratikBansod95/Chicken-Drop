import type { PlacedTool, Vec2 } from "../types";

export function hitTestPlacedTool(tools: PlacedTool[], point: Vec2): PlacedTool | null {
  for (let index = tools.length - 1; index >= 0; index--) {
    const tool = tools[index];
    const dx = point.x - tool.x;
    const dy = point.y - tool.y;
    const cos = Math.cos(-tool.angle);
    const sin = Math.sin(-tool.angle);
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;
    if (Math.abs(localX) <= tool.w * 0.56 && Math.abs(localY) <= tool.h * 0.56) {
      return tool;
    }
  }
  return null;
}

