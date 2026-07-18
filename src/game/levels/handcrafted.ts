import { EGG_SPEC } from "../config/geometry";
import {
  TOOL_META,
  type FixedObject,
  type HazardKind,
  type LevelData,
  type ReferenceSolution,
  type ToolKind,
  type Vec2,
} from "../types";

type Mechanic = LevelData["mechanic"];
type Seed = readonly [name: string, startX: number, basketX: number, startY: number];

const CHAPTERS = [
  "First Feathers",
  "Spring Training",
  "Bounce Yard",
  "Windmill Fields",
  "Belt Barn",
  "Sticky Business",
  "Heat Wave",
  "Pan Parade",
  "Danger Run",
  "Master Nesters",
] as const;

const CHAPTER_MECHANICS: readonly Mechanic[] = [
  "draw",
  "spring",
  "pad",
  "fan",
  "conveyor",
  "sticky",
  "fire",
  "pan",
  "spike",
  "mastery",
];

const SEEDS: readonly Seed[] = [
  ["The First Roll", 280, 630, 138],
  ["A Gentle Turn", 720, 370, 145],
  ["Three Little Drops", 300, 650, 160],
  ["Crossing Paths", 700, 350, 172],
  ["Home Stretch", 260, 610, 150],
  ["Coil Practice", 740, 390, 142],
  ["Soft Launch", 300, 650, 180],
  ["Silver Spring", 700, 350, 155],
  ["Double Bounce", 260, 610, 190],
  ["Spring Fling", 740, 390, 168],
  ["Red Button", 300, 650, 145],
  ["Bounce Timing", 700, 350, 184],
  ["Pad Patrol", 260, 610, 158],
  ["Five on the Fly", 740, 390, 175],
  ["Perfect Bounce", 300, 650, 150],
  ["First Breeze", 700, 350, 195],
  ["Tailwind", 260, 610, 160],
  ["Fan Club", 740, 390, 145],
  ["Crosswind", 300, 650, 188],
  ["Wind Rider", 700, 350, 172],
  ["Moving Day", 260, 610, 152],
  ["Belt Direction", 740, 390, 195],
  ["Conveyor Crossing", 300, 650, 168],
  ["Factory Farm", 700, 350, 148],
  ["Express Delivery", 260, 610, 184],
  ["Sticky Landing", 740, 390, 160],
  ["Slow and Steady", 300, 650, 195],
  ["Puddle Jump", 700, 350, 175],
  ["Gentle Grip", 260, 610, 150],
  ["Sticky Situation", 740, 390, 185],
  ["Warm Welcome", 300, 650, 160],
  ["Fire Lane", 700, 350, 198],
  ["Hot Route", 260, 610, 172],
  ["Flame Detour", 740, 390, 150],
  ["Cool Finish", 300, 650, 188],
  ["Pan Handle", 700, 350, 165],
  ["Kitchen Spin", 260, 610, 198],
  ["Frying High", 740, 390, 178],
  ["Pan and Fan", 300, 650, 150],
  ["Breakfast Rush", 700, 350, 190],
  ["First Spikes", 260, 610, 168],
  ["Needle Thread", 740, 390, 198],
  ["Triple Trouble", 300, 650, 180],
  ["Hazard Harvest", 700, 350, 155],
  ["Safe Passage", 260, 610, 190],
  ["Master Route", 740, 390, 170],
  ["All Tools", 300, 650, 200],
  ["Egg Gauntlet", 700, 350, 182],
  ["Golden Run", 260, 610, 158],
  ["The Final Nest", 740, 390, 195],
] as const;

function fixedObject(
  type: FixedObject["type"],
  x: number,
  y: number,
  w: number,
  h: number,
  angle = 0,
  rotating = false,
): FixedObject {
  return {
    id: `${type}-${Math.round(x)}-${Math.round(y)}`,
    type,
    x,
    y,
    w,
    h,
    angle,
    fixed: true,
    rotating,
    rotateSpeed: rotating ? (14 * Math.PI) / 180 : undefined,
    dir: 1,
  };
}

function toolBudget(chapter: number): Partial<Record<ToolKind, number>> {
  const tools: Partial<Record<ToolKind, number>> = { ramp: 1 };
  if (chapter >= 2) tools.spring = 1;
  if (chapter >= 3) tools.pad = 1;
  if (chapter >= 4) tools.fan = 1;
  if (chapter >= 5) tools.conveyor = 1;
  if (chapter >= 6) tools.sticky = 1;
  if (chapter >= 10) {
    tools.spring = 2;
    tools.pad = 2;
  }
  return tools;
}

function hazardLayout(level: number, chapter: number, basket: Vec2): FixedObject[] {
  const awayX = basket.x < 500 ? 930 : 70;
  const objects: FixedObject[] = [];
  const add = (kind: HazardKind, y: number, angle = 0) => {
    const size =
      kind === "spike" ? [132, 66] : kind === "fire" ? [118, 88] : [172, 72];
    objects.push(
      fixedObject(kind, awayX + ((level % 3) - 1) * 34, y, size[0], size[1], angle, kind === "pan"),
    );
  };

  if (chapter >= 7) add("fire", 560 + (level % 2) * 75);
  if (chapter >= 8) add("pan", 730 - (level % 3) * 60, level % 2 ? -0.28 : 0.28);
  if (chapter >= 9) {
    add("spike", 880 - (level % 2) * 70);
    if (level >= 44) {
      objects.push(
        fixedObject("spike", awayX, 690, 118, 62, level % 2 ? 0.1 : -0.1),
      );
    }
  }
  if (chapter >= 10) {
    objects.push(
      fixedObject("conveyor", awayX, 430, 160, 52, level % 2 ? 0.08 : -0.08),
    );
    if (level % 2 === 0) objects.push(fixedObject("sticky", awayX, 970, 145, 60));
  }
  return objects;
}

function referenceSolution(start: Vec2, basket: Vec2): ReferenceSolution {
  const spawnX = start.x + EGG_SPEC.spawnOffset.x;
  const movingRight = basket.x > spawnX;
  const horizontal = Math.abs(basket.x - spawnX);
  const drop = movingRight ? 300 : 100;
  const slope = movingRight ? 0.22 : 0.12;
  const lead = movingRight ? -90 : 90;
  return {
    strokes: [
      {
        points: [
          { x: spawnX + lead, y: start.y + EGG_SPEC.spawnOffset.y + drop },
          {
            x: movingRight ? basket.x : basket.x + 150,
            y: start.y + EGG_SPEC.spawnOffset.y + drop + horizontal * slope,
          },
        ],
      },
    ],
    tools: [],
    maxTimeSec: 35,
  };
}

function eggCount(level: number): number {
  if (level <= 2) return 1;
  if (level <= 5) return level - 1;
  if (level < 16) return 3;
  if (level < 31) return level % 4 === 0 ? 5 : 3;
  return 5;
}

function tutorialFor(level: number, mechanic: Mechanic): string | undefined {
  if (level === 1) return "Draw a gentle rail below the hen, then press Play.";
  if (level === 2) return "Use Undo to replace a rail and try a smoother angle.";
  if (level === 3) return "Collect route stars while keeping every egg safe.";
  if ([6, 11, 16, 21, 26].includes(level)) {
    const label = mechanic && mechanic in TOOL_META ? TOOL_META[mechanic as ToolKind].label : mechanic;
    return `New tool: ${label}. Place it, drag it into position, and use the rotate buttons.`;
  }
  if ([31, 36, 41].includes(level)) return `New hazard: ${mechanic}. Ink and tools cannot overlap hazards.`;
  return undefined;
}

function createLevel(seed: Seed, index: number): LevelData {
  const level = index + 1;
  const chapter = Math.floor(index / 5) + 1;
  const [name, startX, basketX, startY] = seed;
  const start = { x: startX, y: startY };
  const basket = { x: basketX, y: 1016 };
  const solution = referenceSolution(start, basket);
  const solutionInk = Math.ceil(
    Math.hypot(
      solution.strokes[0].points[1].x - solution.strokes[0].points[0].x,
      solution.strokes[0].points[1].y - solution.strokes[0].points[0].y,
    ),
  );
  const tools = toolBudget(chapter);
  const mechanic = CHAPTER_MECHANICS[chapter - 1];
  const [railStart, railEnd] = solution.strokes[0].points;
  const routeStars = [0.25, 0.55, 0.84].map((t) => ({
    x: railStart.x + (railEnd.x - railStart.x) * t,
    y: railStart.y + (railEnd.y - railStart.y) * t - EGG_SPEC.radius - 4,
    collected: false,
  }));

  return {
    number: level,
    name,
    chapter,
    chapterName: CHAPTERS[chapter - 1],
    mechanic,
    tutorial: tutorialFor(level, mechanic),
    eggCount: eggCount(level),
    start,
    basket,
    stars: routeStars,
    fixedObjects: hazardLayout(level, chapter, basket),
    tools,
    inkLimit: Math.ceil(solutionInk * 1.38 + 80),
    parInk: Math.ceil(solutionInk * 1.08),
    parTools: 0,
    timeLimit: chapter <= 2 ? 75 : chapter <= 6 ? 68 : 62,
    referenceSolution: solution,
  };
}

const CAMPAIGN = SEEDS.map(createLevel);

export function getCampaignLevel(levelNumber: number): LevelData {
  const index = Math.max(0, Math.min(CAMPAIGN.length - 1, Math.floor(levelNumber) - 1));
  return structuredClone(CAMPAIGN[index]);
}

export function getCampaignLevels(): LevelData[] {
  return CAMPAIGN.map((level) => structuredClone(level));
}
