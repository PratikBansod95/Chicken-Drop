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

const CHAPTER_PROPS: readonly FixedObject["type"][] = [
  "ramp",
  "spring",
  "pad",
  "fan",
  "conveyor",
  "sticky",
  "ramp",
  "pad",
  "spring",
  "conveyor",
];

const SEEDS: readonly Seed[] = [
  ["The First Roll", 180, 530, 138],
  ["A Gentle Turn", 770, 420, 162],
  ["Three Little Drops", 280, 630, 186],
  ["Crossing Paths", 670, 320, 210],
  ["Home Stretch", 380, 730, 150],
  ["Coil Practice", 820, 470, 176],
  ["Soft Launch", 230, 580, 204],
  ["Silver Spring", 720, 370, 232],
  ["Double Bounce", 330, 680, 158],
  ["Spring Fling", 620, 270, 190],
  ["Red Button", 430, 780, 220],
  ["Bounce Timing", 770, 420, 145],
  ["Pad Patrol", 180, 530, 198],
  ["Five on the Fly", 670, 320, 240],
  ["Perfect Bounce", 280, 630, 168],
  ["First Breeze", 820, 470, 214],
  ["Tailwind", 380, 730, 246],
  ["Fan Club", 720, 370, 154],
  ["Crosswind", 230, 580, 188],
  ["Wind Rider", 620, 270, 224],
  ["Moving Day", 330, 680, 142],
  ["Belt Direction", 770, 420, 202],
  ["Conveyor Crossing", 430, 780, 234],
  ["Factory Farm", 670, 320, 172],
  ["Express Delivery", 180, 530, 218],
  ["Sticky Landing", 820, 470, 152],
  ["Slow and Steady", 280, 630, 196],
  ["Puddle Jump", 720, 370, 238],
  ["Gentle Grip", 380, 730, 164],
  ["Sticky Situation", 620, 270, 208],
  ["Warm Welcome", 230, 580, 248],
  ["Fire Lane", 770, 420, 178],
  ["Hot Route", 330, 680, 212],
  ["Flame Detour", 670, 320, 148],
  ["Cool Finish", 430, 780, 192],
  ["Pan Handle", 820, 470, 226],
  ["Kitchen Spin", 180, 530, 156],
  ["Frying High", 720, 370, 200],
  ["Pan and Fan", 280, 630, 242],
  ["Breakfast Rush", 620, 270, 170],
  ["First Spikes", 380, 730, 216],
  ["Needle Thread", 770, 420, 250],
  ["Triple Trouble", 230, 580, 182],
  ["Hazard Harvest", 670, 320, 222],
  ["Safe Passage", 330, 680, 146],
  ["Master Route", 820, 470, 194],
  ["All Tools", 430, 780, 236],
  ["Egg Gauntlet", 720, 370, 166],
  ["Golden Run", 180, 530, 206],
  ["The Final Nest", 620, 270, 244],
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

function courseLayout(
  level: number,
  chapter: number,
  start: Vec2,
  basket: Vec2,
): FixedObject[] {
  if (level === 1) return [];
  const movingRight = basket.x > start.x;
  const x = movingRight ? 900 : 100;
  const type = CHAPTER_PROPS[chapter - 1];
  const sizes: Record<FixedObject["type"], readonly [number, number]> = {
    ramp: [120, 100],
    spring: [84, 90],
    pad: [110, 62],
    fan: [84, 92],
    conveyor: [145, 54],
    sticky: [135, 62],
    spike: [132, 66],
    fire: [118, 88],
    pan: [172, 72],
  };
  const [w, h] = sizes[type];
  const outwardAngle =
    type === "fan" ? (movingRight ? 0 : Math.PI) : ((level % 5) - 2) * 0.08;
  const objects = [
    fixedObject(type, x, 390 + (level % 4) * 105, w, h, outwardAngle),
  ];

  if (level % 3 === 0) {
    const supportType: FixedObject["type"] = chapter <= 2 ? "ramp" : "pad";
    const [supportW, supportH] = sizes[supportType];
    objects.push(
      fixedObject(
        supportType,
        x + (movingRight ? -45 : 45),
        820 - (level % 4) * 55,
        supportW,
        supportH,
        movingRight ? -0.1 : 0.1,
      ),
    );
  }
  return objects;
}

function hazardLayout(
  level: number,
  chapter: number,
  basket: Vec2,
  start: Vec2,
): FixedObject[] {
  const awayX = basket.x > start.x ? 930 : 70;
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
    fixedObjects: [
      ...courseLayout(level, chapter, start, basket),
      ...hazardLayout(level, chapter, basket, start),
    ],
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
