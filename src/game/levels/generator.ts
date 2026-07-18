import { WORLD, TOOL_META, type FixedObject, type LevelData, type StarSpot, type ToolKind, type Vec2 } from "../types";
import { eggCountFor, timeLimitFor } from "./recipes";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const STARTS: Vec2[] = [
  { x: 120, y: 140 },
  { x: 840, y: 140 },
  { x: 220, y: 180 },
  { x: 740, y: 175 },
  { x: 500, y: 130 },
  { x: 105, y: 250 },
  { x: 875, y: 240 },
  { x: 360, y: 155 },
  { x: 650, y: 155 },
  { x: 500, y: 230 },
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
    id: `${type}-${x}-${y}-${Math.random().toString(16).slice(2)}`,
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
  for (const t of [along, along - 0.1, along + 0.1]) {
    for (const s of [220, 300, 160]) {
      const p = {
        x: clamp(start.x + dx * t + nx * side * s, margin + 45, WORLD.width - margin - 45),
        y: clamp(start.y + dy * t + ny * side * s, 300, WORLD.height - margin - 90),
      };
      const ok =
        ![start, basket, ...stars].some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 90) &&
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
    x: clamp(startBase.x + Math.sin(level * 1.9) * 24 + loop * 11, 80, 920),
    y: clamp(startBase.y + Math.cos(level * 1.4) * 18 + loop * 16, 100, 280),
  };
  const basket: Vec2 = {
    x: clamp(basketBase.x + Math.cos(level * 2.3) * 28 - loop * 9, 95, 905),
    y: clamp(basketBase.y + Math.sin(level * 1.2) * 24 - loop * 12, 660, 1070),
  };

  const count = eggCountFor(level);
  const dist = Math.hypot(basket.x - start.x, basket.y - start.y);
  const inkLimit = clamp(Math.round(dist * 1.55 + 260 + count * 40), 1100, 2100);

  const stars: StarSpot[] = [
    { x: 300 + wave * 90, y: 330 + (level % 4) * 35, collected: false },
    { x: 500 - wave * 120, y: 590 + (level % 5) * 30, collected: false },
    { x: 700 + Math.sin(level) * 80, y: 800 - (level % 4) * 28, collected: false },
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
        dir: left ? 1 : -1,
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
  const parTools = Object.values(tools).reduce((a, b) => a + (b ?? 0), 0);

  return {
    number: level,
    name: `Level ${level}`,
    eggCount: count,
    start,
    basket,
    stars,
    fixedObjects: fixed,
    tools,
    inkLimit,
    parInk: Math.round(inkLimit * 0.78),
    parTools,
    timeLimit: timeLimitFor(level),
  };
}
