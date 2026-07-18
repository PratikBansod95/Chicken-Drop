import { describe, expect, it } from "vitest";
import Matter from "matter-js";
import { SIMULATION } from "../config/geometry";
import { PhysicsWorld } from "../engine";
import { generateLevel, validateLevelGeometry } from "../levels/generator";
import { inkSegmentIsBlocked, toolPlacementIsBlocked } from "../systems/buildProtection";
import { FixedStepClock } from "../systems/fixedStep";
import type { FixedObject, LevelData, PlacedTool } from "../types";

function emptyLevel(eggCount = 1): LevelData {
  return {
    number: 1,
    name: "Physics test",
    eggCount,
    start: { x: 180, y: 140 },
    basket: { x: 500, y: 900 },
    stars: [],
    fixedObjects: [],
    tools: {},
    inkLimit: 1400,
    parInk: 1000,
    parTools: 0,
    timeLimit: 90,
  };
}

function step(world: PhysicsWorld, frames: number) {
  for (let i = 0; i < frames; i++) world.step(SIMULATION.fixedStepMs);
}

describe("fixed-step redesign", () => {
  it("builds physics bodies for every production tool and hazard", () => {
    const kinds: FixedObject["type"][] = [
      "spring",
      "ramp",
      "pad",
      "fan",
      "conveyor",
      "sticky",
      "spike",
      "fire",
      "pan",
    ];
    const level = emptyLevel();
    level.fixedObjects = kinds.map((type, index) => ({
      id: `${type}-test`,
      type,
      x: 100 + index * 90,
      y: 520,
      w: type === "pan" ? 170 : 100,
      h: type === "spring" ? 90 : 64,
      angle: 0,
      fixed: true,
      dir: 1,
    }));
    const world = new PhysicsWorld();
    world.resetLevel(level, [], []);
    for (const object of level.fixedObjects) {
      expect(object.bodyIds, object.type).toHaveLength(1);
      expect(world.getBodyById(object.bodyIds![0])?.label).toBe(object.type);
    }
    world.destroy();
  });

  it.each([30, 60, 120])("produces 60 physics steps per second at %i Hz", (hz) => {
    const clock = new FixedStepClock();
    let steps = 0;
    for (let frame = 0; frame < hz; frame++) {
      clock.advance(1000 / hz, () => {
        steps += 1;
      });
    }
    expect(steps).toBeGreaterThanOrEqual(59);
    expect(steps).toBeLessThanOrEqual(60);
  });

  it("drops an unobstructed egg under gravity", () => {
    const world = new PhysicsWorld();
    world.resetLevel(emptyLevel(), [], []);
    const egg = world.spawnEgg({ x: 180, y: 150 }, "egg-1");
    const startY = world.getEggBody(egg)!.position.y;
    step(world, 45);
    expect(world.getEggBody(egg)!.position.y).toBeGreaterThan(startY + 80);
    world.destroy();
  });

  it("rolls and rotates an egg on a sloped ink ramp", () => {
    const world = new PhysicsWorld();
    world.resetLevel(
      emptyLevel(),
      [{ points: [{ x: 120, y: 360 }, { x: 780, y: 650 }] }],
      [],
    );
    const egg = world.spawnEgg({ x: 190, y: 290 }, "egg-1");
    step(world, 150);
    const body = world.getEggBody(egg)!;
    expect(body.position.x).toBeGreaterThan(240);
    expect(Math.abs(body.angle)).toBeGreaterThan(0.15);
    world.destroy();
  });

  it("rolls an egg down the wooden ramp tool", () => {
    const world = new PhysicsWorld();
    world.resetLevel(
      emptyLevel(),
      [],
      [
        {
          id: "ramp-test",
          type: "ramp",
          x: 420,
          y: 470,
          angle: 0,
          w: 120,
          h: 100,
          dir: 1,
          bodyIds: [],
        },
      ],
    );
    const egg = world.spawnEgg({ x: 445, y: 365 }, "egg-1");
    step(world, 100);
    expect(world.getEggBody(egg)!.position.x).toBeLessThan(405);
    world.destroy();
  });

  it("launches an egg from the visible top of a spring", () => {
    const world = new PhysicsWorld();
    world.resetLevel(
      emptyLevel(),
      [],
      [
        {
          id: "spring-test",
          type: "spring",
          x: 500,
          y: 500,
          angle: 0,
          w: 84,
          h: 90,
          dir: 1,
          bodyIds: [],
        },
      ],
    );
    const egg = world.spawnEgg({ x: 500, y: 380 }, "egg-1");
    let launched = false;
    for (let frame = 0; frame < 120; frame++) {
      world.step(SIMULATION.fixedStepMs);
      const body = world.getEggBody(egg);
      if (body && body.velocity.y < -8) launched = true;
    }
    expect(launched).toBe(true);
    world.destroy();
  });

  it("does not capture an unsupported egg in mid-air", () => {
    const world = new PhysicsWorld();
    world.resetLevel(emptyLevel(), [], []);
    const egg = world.spawnEgg({ x: 500, y: 870 }, "egg-1");
    step(world, 4);
    expect(egg.nested).toBe(false);
    expect(egg.nestState).not.toBe("captured");
    world.destroy();
  });

  it.each([1, 3, 5])("contains and captures %i stable eggs", (count) => {
    const world = new PhysicsWorld();
    world.resetLevel(emptyLevel(count), [], []);
    const spacing = 52;
    const eggs = Array.from({ length: count }, (_, index) =>
      world.spawnEgg(
        {
          x: 500 + (index - (count - 1) / 2) * spacing,
          y: 900,
        },
        `egg-${index + 1}`,
      ),
    );
    step(world, 240);
    expect(eggs.every((egg) => egg.nested)).toBe(true);
    world.destroy();
  });

  it("keeps captured eggs inside the visible nest", () => {
    const world = new PhysicsWorld();
    world.resetLevel(emptyLevel(), [], []);
    const egg = world.spawnEgg({ x: 500, y: 900 }, "egg-1");
    step(world, 240);
    const body = world.getEggBody(egg)!;
    Matter.Sleeping.set(body, false);
    Matter.Body.setVelocity(body, { x: 24, y: -8 });
    step(world, 20);
    expect(egg.nested).toBe(true);
    expect(Math.abs(body.position.x - 500)).toBeLessThanOrEqual(122);
    world.destroy();
  });
});

describe("generated levels", () => {
  it("keeps all 50 nests, spawns, and hazards inside shared safe geometry", () => {
    for (let level = 1; level <= 50; level++) {
      expect(validateLevelGeometry(generateLevel(level)), `level ${level}`).toEqual([]);
    }
  });
});

describe("protected build geometry", () => {
  const hazard = {
    id: "hazard",
    type: "spike" as const,
    x: 500,
    y: 500,
    angle: Math.PI / 5,
    w: 120,
    h: 60,
    fixed: true,
  };

  it("blocks a fast pointer segment crossing a rotated hazard", () => {
    const level = { ...emptyLevel(), fixedObjects: [hazard] };
    expect(
      inkSegmentIsBlocked({ x: 250, y: 500 }, { x: 750, y: 500 }, level, []),
    ).toBe(true);
    expect(
      inkSegmentIsBlocked({ x: 250, y: 350 }, { x: 750, y: 350 }, level, []),
    ).toBe(false);
  });

  it("blocks a tool whose footprint overlaps existing ink", () => {
    const tool: PlacedTool = {
      id: "ramp",
      type: "ramp",
      x: 500,
      y: 500,
      angle: 0,
      w: 120,
      h: 100,
      dir: 1,
      bodyIds: [],
    };
    expect(
      toolPlacementIsBlocked(
        tool,
        emptyLevel(),
        [],
        [{ points: [{ x: 400, y: 500 }, { x: 600, y: 500 }] }],
      ),
    ).toBe(true);
  });

  it("checks the complete tool footprint against hazards", () => {
    const level = { ...emptyLevel(), fixedObjects: [hazard] };
    const tool: PlacedTool = {
      id: "pad",
      type: "pad",
      x: 615,
      y: 500,
      angle: 0,
      w: 110,
      h: 62,
      dir: 1,
      bodyIds: [],
    };
    expect(toolPlacementIsBlocked(tool, level, [], [])).toBe(true);
  });
});

