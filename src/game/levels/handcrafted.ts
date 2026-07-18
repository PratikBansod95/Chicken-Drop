import type { LevelData, StarSpot, Vec2 } from "../types";
import { generateLevel } from "./generator";

function starsAt(...pts: Vec2[]): StarSpot[] {
  return pts.map((p) => ({ ...p, collected: false }));
}

/** Authored overrides for early teaching levels; rest stay procedural. */
export function getLevel(n: number): LevelData {
  const base = generateLevel(n);

  if (n === 1) {
    return {
      ...base,
      name: "First Nest",
      eggCount: 1,
      start: { x: 180, y: 160 },
      basket: { x: 780, y: 980 },
      stars: starsAt({ x: 420, y: 520 }, { x: 620, y: 720 }, { x: 700, y: 860 }),
      fixedObjects: [],
      tools: {},
      inkLimit: 1400,
      parInk: 900,
      parTools: 0,
      timeLimit: 75,
    };
  }

  if (n === 2) {
    return {
      ...base,
      name: "Trio Home",
      eggCount: 3,
      start: { x: 160, y: 150 },
      basket: { x: 820, y: 1000 },
      stars: starsAt({ x: 380, y: 480 }, { x: 560, y: 640 }, { x: 700, y: 820 }),
      fixedObjects: [],
      tools: { spring: 1 },
      inkLimit: 1600,
      parInk: 1000,
      parTools: 1,
      timeLimit: 80,
    };
  }

  if (n === 5) {
    return {
      ...base,
      name: "Pad Practice",
      eggCount: 3,
      start: { x: 820, y: 150 },
      basket: { x: 200, y: 980 },
      stars: starsAt({ x: 600, y: 420 }, { x: 420, y: 620 }, { x: 280, y: 800 }),
      fixedObjects: [
        {
          id: "pad-teach",
          type: "pad",
          x: 520,
          y: 700,
          angle: -0.35,
          w: 120,
          h: 62,
          fixed: true,
          dir: 1,
        },
      ],
      tools: { spring: 1, pad: 1 },
      inkLimit: 1500,
      parInk: 950,
      parTools: 1,
      timeLimit: 85,
    };
  }

  if (n === 10) {
    return {
      ...base,
      name: "Windy Lane",
      eggCount: 5,
      start: { x: 140, y: 180 },
      basket: { x: 860, y: 940 },
      stars: starsAt({ x: 320, y: 500 }, { x: 520, y: 640 }, { x: 720, y: 760 }),
      fixedObjects: [
        {
          id: "fan-teach",
          type: "fan",
          x: 90,
          y: 620,
          angle: 0,
          w: 82,
          h: 90,
          fixed: true,
          dir: 1,
        },
        {
          id: "spike-teach",
          type: "spike",
          x: 500,
          y: 1050,
          angle: 0,
          w: 140,
          h: 40,
          fixed: true,
          dir: 1,
        },
      ],
      tools: { spring: 1, pad: 1, fan: 1 },
      inkLimit: 1800,
      parInk: 1100,
      parTools: 2,
      timeLimit: 95,
    };
  }

  return base;
}
