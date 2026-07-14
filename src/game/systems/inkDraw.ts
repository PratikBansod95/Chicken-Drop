import type { InkStroke, Vec2 } from "../types";

export function strokeLength(points: Vec2[]) {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return len;
}

export function appendDraftPoint(
  draft: Vec2[],
  point: Vec2,
  inkUsed: number,
  inkLimit: number,
): { ok: boolean; reason?: string } {
  const last = draft[draft.length - 1];
  if (last && Math.hypot(point.x - last.x, point.y - last.y) < 6) return { ok: false };
  const nextLen = inkUsed + strokeLength([...draft, point]);
  if (nextLen > inkLimit) return { ok: false, reason: "Out of ink — undo or clear a line." };
  draft.push(point);
  return { ok: true };
}

export function commitStroke(strokes: InkStroke[], draft: Vec2[]): number {
  if (draft.length < 2) return 0;
  const len = strokeLength(draft);
  strokes.push({ points: [...draft] });
  return len;
}
