import { EGG_SPEC, INK_SPEC, NEST_SPEC } from "../config/geometry";
import { WORLD, type FixedObject, type InkStroke, type LevelData, type PlacedTool, type Vec2 } from "../types";

export const BUILD_PADDING = 14;

type RectObject = Pick<FixedObject | PlacedTool, "x" | "y" | "w" | "h" | "angle">;

function toLocal(point: Vec2, rect: RectObject): Vec2 {
  const dx = point.x - rect.x;
  const dy = point.y - rect.y;
  const cos = Math.cos(-rect.angle);
  const sin = Math.sin(-rect.angle);
  return { x: dx * cos - dy * sin, y: dx * sin + dy * cos };
}

function rectCorners(rect: RectObject, padding = 0): Vec2[] {
  const hw = rect.w / 2 + padding;
  const hh = rect.h / 2 + padding;
  const cos = Math.cos(rect.angle);
  const sin = Math.sin(rect.angle);
  return [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ].map((point) => ({
    x: rect.x + point.x * cos - point.y * sin,
    y: rect.y + point.x * sin + point.y * cos,
  }));
}

export function pointInRotatedRect(point: Vec2, rect: RectObject, padding = 0): boolean {
  const local = toLocal(point, rect);
  return (
    Math.abs(local.x) <= rect.w / 2 + padding &&
    Math.abs(local.y) <= rect.h / 2 + padding
  );
}

function segmentIntersectsAabb(from: Vec2, to: Vec2, hw: number, hh: number): boolean {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  let near = 0;
  let far = 1;
  for (const [origin, delta, min, max] of [
    [from.x, dx, -hw, hw],
    [from.y, dy, -hh, hh],
  ] as const) {
    if (Math.abs(delta) < 1e-8) {
      if (origin < min || origin > max) return false;
      continue;
    }
    const t1 = (min - origin) / delta;
    const t2 = (max - origin) / delta;
    near = Math.max(near, Math.min(t1, t2));
    far = Math.min(far, Math.max(t1, t2));
    if (near > far) return false;
  }
  return true;
}

export function segmentIntersectsRotatedRect(
  from: Vec2,
  to: Vec2,
  rect: RectObject,
  padding = 0,
): boolean {
  return segmentIntersectsAabb(
    toLocal(from, rect),
    toLocal(to, rect),
    rect.w / 2 + padding,
    rect.h / 2 + padding,
  );
}

function segmentIntersectsEllipse(
  from: Vec2,
  to: Vec2,
  center: Vec2,
  rx: number,
  ry: number,
): boolean {
  const a = { x: (from.x - center.x) / rx, y: (from.y - center.y) / ry };
  const b = { x: (to.x - center.x) / rx, y: (to.y - center.y) / ry };
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq > 0 ? Math.max(0, Math.min(1, -(a.x * dx + a.y * dy) / lengthSq)) : 0;
  const x = a.x + dx * t;
  const y = a.y + dy * t;
  return x * x + y * y <= 1;
}

function rectIntersectsEllipse(rect: RectObject, center: Vec2, rx: number, ry: number): boolean {
  const corners = rectCorners(rect);
  if (
    corners.some((point) => {
      const x = (point.x - center.x) / rx;
      const y = (point.y - center.y) / ry;
      return x * x + y * y <= 1;
    }) ||
    pointInRotatedRect(center, rect)
  ) {
    return true;
  }
  return corners.some((point, index) =>
    segmentIntersectsEllipse(point, corners[(index + 1) % corners.length], center, rx, ry),
  );
}

function rectsIntersect(a: RectObject, b: RectObject, padding = 0): boolean {
  const aCorners = rectCorners(a, padding / 2);
  const bCorners = rectCorners(b, padding / 2);
  const axes = [a.angle, a.angle + Math.PI / 2, b.angle, b.angle + Math.PI / 2];
  return axes.every((angle) => {
    const axis = { x: Math.cos(angle), y: Math.sin(angle) };
    const project = (points: Vec2[]) => points.map((point) => point.x * axis.x + point.y * axis.y);
    const ap = project(aCorners);
    const bp = project(bCorners);
    return Math.max(...ap) >= Math.min(...bp) && Math.max(...bp) >= Math.min(...ap);
  });
}

function spawnCenter(level: LevelData): Vec2 {
  return {
    x: level.start.x + EGG_SPEC.spawnOffset.x,
    y: level.start.y + EGG_SPEC.spawnOffset.y,
  };
}

function nestZone(level: LevelData) {
  return {
    center: { x: level.basket.x, y: level.basket.y },
    rx: NEST_SPEC.outerWidth / 2 + 16,
    ry: NEST_SPEC.wallHeight / 2 + 24,
  };
}

export function pointIsProtected(
  point: Vec2,
  level: LevelData,
  placed: PlacedTool[],
  ignorePlacedId?: string,
): boolean {
  const spawn = spawnCenter(level);
  if (Math.hypot(point.x - spawn.x, point.y - spawn.y) <= EGG_SPEC.spawnClearance + 10) {
    return true;
  }
  const nest = nestZone(level);
  if (segmentIntersectsEllipse(point, point, nest.center, nest.rx, nest.ry)) return true;
  return [...level.fixedObjects, ...placed.filter((tool) => tool.id !== ignorePlacedId)].some(
    (object) => pointInRotatedRect(point, object, BUILD_PADDING),
  );
}

export function inkSegmentIsBlocked(
  from: Vec2,
  to: Vec2,
  level: LevelData,
  placed: PlacedTool[],
): boolean {
  const spawn = spawnCenter(level);
  if (
    segmentIntersectsEllipse(
      from,
      to,
      spawn,
      EGG_SPEC.spawnClearance + 10,
      EGG_SPEC.spawnClearance + 10,
    )
  ) {
    return true;
  }
  const nest = nestZone(level);
  if (segmentIntersectsEllipse(from, to, nest.center, nest.rx, nest.ry)) return true;
  return [...level.fixedObjects, ...placed].some((object) =>
    segmentIntersectsRotatedRect(from, to, object, BUILD_PADDING),
  );
}

function toolIntersectsStroke(tool: PlacedTool, stroke: InkStroke): boolean {
  for (let index = 1; index < stroke.points.length; index++) {
    if (
      segmentIntersectsRotatedRect(
        stroke.points[index - 1],
        stroke.points[index],
        tool,
        INK_SPEC.outerStroke / 2 + BUILD_PADDING,
      )
    ) {
      return true;
    }
  }
  return false;
}

export function toolPlacementIsBlocked(
  tool: PlacedTool,
  level: LevelData,
  placed: PlacedTool[],
  strokes: InkStroke[],
  ignorePlacedId?: string,
): boolean {
  if (
    rectCorners(tool).some(
      (point) => point.x < 0 || point.x > WORLD.width || point.y < 0 || point.y > WORLD.height,
    )
  ) {
    return true;
  }

  const spawn = spawnCenter(level);
  if (
    rectIntersectsEllipse(
      tool,
      spawn,
      EGG_SPEC.spawnClearance + 10,
      EGG_SPEC.spawnClearance + 10,
    )
  ) {
    return true;
  }
  const nest = nestZone(level);
  if (rectIntersectsEllipse(tool, nest.center, nest.rx, nest.ry)) return true;

  const obstacles = [
    ...level.fixedObjects,
    ...placed.filter((other) => other.id !== ignorePlacedId),
  ];
  if (obstacles.some((obstacle) => rectsIntersect(tool, obstacle, BUILD_PADDING))) return true;
  return strokes.some((stroke) => toolIntersectsStroke(tool, stroke));
}
