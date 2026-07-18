import { describe, expect, it } from "vitest";
import { SIMULATION } from "../config/geometry";
import { PhysicsWorld } from "../engine";
import { generateLevel, validateLevelGeometry } from "../levels/generator";
import { FixedStepClock } from "../systems/fixedStep";
import type { LevelData } from "../types";

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
});

describe("generated levels", () => {
  it("keeps all 50 nests, spawns, and hazards inside shared safe geometry", () => {
    for (let level = 1; level <= 50; level++) {
      expect(validateLevelGeometry(generateLevel(level)), `level ${level}`).toEqual([]);
    }
  });
});

