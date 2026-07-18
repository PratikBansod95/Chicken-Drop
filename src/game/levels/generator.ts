import { WORLD, TOOL_META, type FixedObject, type LevelData, type StarSpot, type ToolKind, type Vec2 } from "../types";
import { EGG_SPEC, NEST_SPEC } from "../config/geometry";
import { eggCountFor, timeLimitFor } from "./recipes";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const STAR_CLEARANCE = 54;
const BASKET_Y = WORLD.height - NEST_SPEC.safeMarginBottom - 52;
const HEN_SIDE_MARGIN = 180;

function pointOverlapsNest(point: Vec2, basket: Vec2, padding = STAR_CLEARANCE): boolean {
  const rx = NEST_SPEC.spriteWidth / 2 + padding;
  const ry = NEST_SPEC.spriteHeight / 2 + padding;
  const centerY = basket.y + NEST_SPEC.spriteOffsetY + NEST_SPEC.spriteHeight / 2;
  const dx = (point.x - basket.x) / rx;
  const dy = (point.y - centerY) / ry;
  return dx * dx + dy * dy < 1;
}

function pointOverlapsObject(point: Vec2, object: FixedObject, padding = STAR_CLEARANCE): boolean {
  const dx = point.x - object.x;
  const dy = point.y - object.y;
  const cos = Math.cos(-object.angle);
  const sin = Math.sin(-object.angle);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;
  return (
    Math.abs(localX) < object.w / 2 + padding &&
    Math.abs(localY) < object.h / 2 + padding
  );
}

function placeStars(
  preferred: Vec2[],
  start: Vec2,
  basket: Vec2,
  fixed: FixedObject[],
): StarSpot[] {
  const placed: StarSpot[] = [];
  for (const target of preferred) {
    const grid: Vec2[] = [];
    for (let y = 230; y <= WORLD.height - 170; y += 120) {
      for (let x = 100; x <= WORLD.width - 100; x += 125) grid.push({ x, y });
    }
    grid.sort(
      (a, b) =>
        Math.hypot(a.x - target.x, a.y - target.y) -
        Math.hypot(b.x - target.x, b.y - target.y),
    );
    const point = [target, ...grid].find(
      (candidate) =>
        candidate.x >= STAR_CLEARANCE &&
        candidate.x <= WORLD.width - STAR_CLEARANCE &&
        candidate.y >= STAR_CLEARANCE &&
        candidate.y <= WORLD.height - STAR_CLEARANCE &&
        Math.hypot(candidate.x - start.x, candidate.y - start.y) >=
          EGG_SPEC.spawnClearance + STAR_CLEARANCE &&
        !pointOverlapsNest(candidate, basket) &&
        !fixed.some((object) => pointOverlapsObject(candidate, object)) &&
        !placed.some(
          (star) =>
            Math.hypot(candidate.x - star.x, candidate.y - star.y) < STAR_CLEARANCE * 2.4,
        ),
    );
    if (point) placed.push({ ...point, collected: false });
  }
  return placed;
}

const STARTS: Vec2[] = [
  { x: 240, y: 140 },
  { x: 760, y: 140 },
  { x: 320, y: 175 },
  { x: 680, y: 170 },
  { x: 500, y: 125 },
  { x: 280, y: 195 },
  { x: 720, y: 190 },
  { x: 400, y: 150 },
  { x: 600, y: 150 },
  { x: 500, y: 200 },
];

const BASKETS: Vec2[] = [
  { x: 830, y: 1025 },
  { x: 170, y: 985 },
  { x: 720, y: 890 },
  { x: 300, y: 1040 },
  { x: 520, y: 940 },
  { x: 880, y: 775 },
  { x: 120, y: 830 },
  { x: 640, y: 1060 },
  { x: 390, y: 800 },
  { x: 760, y: 690 },
];

function toolBudget(level: number): Partial<Record<ToolKind, number>> {
  const t: Partial<Record<ToolKind, number>> = {};
  if (level >= TOOL_META.ramp.unlock) t.ramp = 1 + +(level % 6 === 0);
  if (level >= TOOL_META.spring.unlock) t.spring = 1 + +(level % 5 === 0);
  if (level >= TOOL_META.pad.unlock) t.pad = 1 + +(level % 4 === 1);
  if (level >= TOOL_META.fan.unlock) t.fan = 1 + +(level % 7 === 0);
  if (level >= TOOL_META.conveyor.unlock) t.conveyor = 1 + +(level % 6 === 0);
  if (level >= TOOL_META.sticky.unlock) t.sticky = 1 + +(level % 9 === 0);
  if (level >= 40 && t.pad != null) t.pad += 1;
  return t;
}

function makeObj(
  type: FixedObject["type"],
  x: number,
  y: number,
  extra: Partial<FixedObject> = {},
): FixedObject {
  return {
    id: `${type}-${Math.round(x)}-${Math.round(y)}`,
    type,
    x,
    y,
    angle: ((extra.angle ?? 0) * Math.PI) / 180,
    w: extra.w ?? 100,
    h: extra.h ?? 70,
    fixed: true,
    rotating: extra.rotating,
    rotateSpeed: extra.rotateSpeed != null ? (extra.rotateSpeed * Math.PI) / 180 : undefined,
    dir: extra.dir ?? 1,
  };
}

function placeHazardNearPath(
  level: number,
  kind: "fire" | "pan",
  start: Vec2,
  basket: Vec2,
  stars: Vec2[],
  fixed: FixedObject[],
  margin: number,
): Vec2 | null {
  const dx = basket.x - start.x;
  const dy = basket.y - start.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const along = kind === "fire" ? 0.55 : 0.42;
  const side = level % 2 ? 1 : -1;
  const starDistance =
    kind === "fire"
      ? Math.hypot(59 + STAR_CLEARANCE, 43 + STAR_CLEARANCE)
      : Math.hypot(88 + STAR_CLEARANCE, 36 + STAR_CLEARANCE);
  for (const t of [along, along - 0.1, along + 0.1]) {
    for (const s of [220, 300, 160]) {
      const p = {
        x: clamp(start.x + dx * t + nx * side * s, margin + 45, WORLD.width - margin - 45),
        y: clamp(start.y + dy * t + ny * side * s, 300, WORLD.height - margin - 90),
      };
      const ok =
        Math.hypot(start.x - p.x, start.y - p.y) >= EGG_SPEC.spawnClearance + 90 &&
        Math.hypot(basket.x - p.x, basket.y - p.y) >= NEST_SPEC.safeMarginX &&
        !stars.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < starDistance) &&
        !fixed.some((f) => Math.hypot(f.x - p.x, f.y - p.y) < 100);
      if (ok) return p;
    }
  }
  return null;
}

export function generateLevel(n: number): LevelData {
  const level = clamp(Math.floor(n), 1, 50);
  const wave = Math.sin(level * 1.7);
  const startBase = STARTS[(level - 1) % STARTS.length];
  const basketBase = BASKETS[(level * 3 + 1) % BASKETS.length];
  const loop = Math.floor((level - 1) / STARTS.length);

  const start: Vec2 = {
    x: clamp(
      startBase.x + Math.sin(level * 1.9) * 24 + loop * 8,
      HEN_SIDE_MARGIN,
      WORLD.width - HEN_SIDE_MARGIN,
    ),
    y: clamp(startBase.y + Math.cos(level * 1.4) * 18 + loop * 8, 110, 230),
  };
  const basket: Vec2 = {
    x: clamp(
      basketBase.x + Math.cos(level * 2.3) * 28 - loop * 9,
      NEST_SPEC.safeMarginX,
      WORLD.width - NEST_SPEC.safeMarginX,
    ),
    y: BASKET_Y,
  };

  const count = eggCountFor(level);
  const dist = Math.hypot(basket.x - start.x, basket.y - start.y);
  const inkLimit = clamp(Math.round(dist * 1.55 + 260 + count * 40), 1100, 2100);

  const preferredStars: Vec2[] = [
    { x: 300 + wave * 90, y: 330 + (level % 4) * 35 },
    { x: 500 - wave * 120, y: 590 + (level % 5) * 30 },
    { x: 700 + Math.sin(level) * 80, y: 800 - (level % 4) * 28 },
  ];

  const fixed: FixedObject[] = [];

  if (level >= 10) {
    fixed.push(
      makeObj("spike", 500 + Math.sin(level) * 220, 965 - (level % 4) * 40, { w: 140, h: 62 }),
    );
  }
  if (level >= 24) {
    const left = start.x < WORLD.width * 0.5;
    fixed.push(
      makeObj("fan", left ? 90 : 910, 620, {
        angle: left ? 0 : 180,
        w: 82,
        h: 90,
        dir: 1,
      }),
    );
  }
  if (level >= 30) fixed.push(makeObj("sticky", 500, 930, { w: 160, h: 66 }));
  if (level >= 38) {
    fixed.push(
      makeObj("conveyor", 500, 430, {
        angle: level % 2 ? 6 : -6,
        w: 180,
        h: 50,
        dir: level % 2 ? 1 : -1,
      }),
    );
  }
  if (level >= 44) {
    fixed.push(makeObj("spike", 250, 760, { w: 120, h: 60 }));
    fixed.push(makeObj("spike", 760, 600, { w: 120, h: 60 }));
  }

  const stars = placeStars(preferredStars, start, basket, fixed);
  const fireAt = placeHazardNearPath(level, "fire", start, basket, stars, fixed, 60);
  if (fireAt && level >= 6) fixed.push(makeObj("fire", fireAt.x, fireAt.y, { w: 118, h: 86 }));
  if (level >= 3) {
    const panAt = placeHazardNearPath(level, "pan", start, basket, stars, fixed, 88);
    if (panAt) {
      fixed.push(
        makeObj("pan", panAt.x, panAt.y, {
          angle: level % 2 ? -18 : 18,
          w: 176,
          h: 72,
          rotating: level >= 12,
          rotateSpeed: level % 2 ? 16 : -16,
        }),
      );
    }
  }

  const tools = toolBudget(level);
  const availableTools = Object.values(tools).reduce((a, b) => a + (b ?? 0), 0);
  const parTools = Math.ceil(availableTools * 0.5);
  const safeFixed = fixed.filter(
    (object) =>
      Math.hypot(object.x - basket.x, object.y - basket.y) >= NEST_SPEC.safeMarginX &&
      Math.hypot(object.x - start.x, object.y - start.y) >=
        EGG_SPEC.spawnClearance + Math.max(object.w, object.h) / 2,
  );

  return {
    number: level,
    name: `Level ${level}`,
    eggCount: count,
    start,
    basket,
    stars,
    fixedObjects: safeFixed,
    tools,
    inkLimit,
    parInk: Math.round(inkLimit * 0.78),
    parTools,
    timeLimit: timeLimitFor(level),
  };
}

export function validateLevelGeometry(level: LevelData): string[] {
  const issues: string[] = [];
  if (
    level.basket.x < NEST_SPEC.safeMarginX ||
    level.basket.x > WORLD.width - NEST_SPEC.safeMarginX
  ) {
    issues.push("nest-outside-horizontal-safe-area");
  }
  if (level.basket.y > WORLD.height - NEST_SPEC.safeMarginBottom) {
    issues.push("nest-under-dock-safe-area");
  }
  if (level.basket.y < WORLD.height * 0.8) {
    issues.push("nest-not-in-bottom-zone");
  }
  if (
    level.start.x < HEN_SIDE_MARGIN ||
    level.start.x > WORLD.width - HEN_SIDE_MARGIN
  ) {
    issues.push("spawn-outside-horizontal-safe-area");
  }
  if (level.start.y > 230) issues.push("spawn-too-low-for-drawing-corridor");
  for (const object of level.fixedObjects) {
    if (
      Math.hypot(object.x - level.basket.x, object.y - level.basket.y) <
      NEST_SPEC.safeMarginX
    ) {
      issues.push(`object-overlaps-nest:${object.id}`);
    }
    if (
      Math.hypot(object.x - level.start.x, object.y - level.start.y) <
      EGG_SPEC.spawnClearance + Math.max(object.w, object.h) / 2
    ) {
      issues.push(`object-overlaps-spawn:${object.id}`);
    }
  }
  level.stars.forEach((star, index) => {
    if (pointOverlapsNest(star, level.basket)) {
      issues.push(`star-overlaps-nest:${index}`);
    }
    if (
      Math.hypot(star.x - level.start.x, star.y - level.start.y) <
      EGG_SPEC.spawnClearance + STAR_CLEARANCE
    ) {
      issues.push(`star-overlaps-spawn:${index}`);
    }
    if (level.fixedObjects.some((object) => pointOverlapsObject(star, object))) {
      issues.push(`star-overlaps-object:${index}`);
    }
    if (
      level.stars.some(
        (other, otherIndex) =>
          otherIndex < index &&
          Math.hypot(star.x - other.x, star.y - other.y) < STAR_CLEARANCE * 2.4,
      )
    ) {
      issues.push(`stars-overlap:${index}`);
    }
  });
  return issues;
}
