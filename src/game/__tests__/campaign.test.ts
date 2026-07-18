import { describe, expect, it } from "vitest";
import { EGG_SPEC, SIMULATION } from "../config/geometry";
import { PhysicsWorld } from "../engine";
import { getCampaignLevels } from "../levels";
import { loadSave } from "../tweaks";

function runReference(levelNumber: number) {
  const level = getCampaignLevels()[levelNumber - 1];
  const solution = level.referenceSolution!;
  const world = new PhysicsWorld();
  world.resetLevel(level, solution.strokes, solution.tools);
  const eggs = [];
  const stars = new Set<number>();
  let nextLayFrame = 0;

  for (let frame = 0; frame < solution.maxTimeSec * 60; frame++) {
    if (eggs.length < level.eggCount && frame >= nextLayFrame) {
      const spawn = {
        x: level.start.x + EGG_SPEC.spawnOffset.x,
        y: level.start.y + EGG_SPEC.spawnOffset.y,
      };
      if (world.canSpawnEgg(spawn)) {
        eggs.push(world.spawnEgg(spawn, `cert-${eggs.length}`));
        nextLayFrame = frame + Math.round(EGG_SPEC.laySpacingSec * 60);
      }
    }
    world.step(SIMULATION.fixedStepMs);
    for (const egg of eggs) {
      const body = world.getEggBody(egg);
      if (!body || egg.broken) continue;
      level.stars.forEach((star, index) => {
        if (Math.hypot(body.position.x - star.x, body.position.y - star.y) < 42) {
          stars.add(index);
        }
      });
    }
  }

  const result = {
    spawned: eggs.length,
    nested: eggs.filter((egg) => egg.nested).length,
    broken: eggs.filter((egg) => egg.broken).length,
    stars: stars.size,
  };
  world.destroy();
  return result;
}

describe("production campaign", () => {
  it("contains fifty chaptered authored levels with certified budgets", () => {
    const levels = getCampaignLevels();
    expect(levels).toHaveLength(50);
    expect(new Set(levels.map((level) => level.number)).size).toBe(50);
    expect(new Set(levels.map((level) => level.chapter)).size).toBe(10);
    for (const level of levels) {
      expect(level.referenceSolution).toBeDefined();
      expect(level.referenceSolution!.strokes.length + level.referenceSolution!.tools.length).toBeGreaterThan(0);
      expect(level.parInk).toBeLessThanOrEqual(level.inkLimit);
      expect(level.stars).toHaveLength(3);
    }
  });

  it(
    "replays every reference solution through the fixed-step physics engine",
    () => {
      for (let level = 1; level <= 50; level++) {
        expect(runReference(level), `level ${level}`).toEqual({
          spawned: getCampaignLevels()[level - 1].eggCount,
          nested: getCampaignLevels()[level - 1].eggCount,
          broken: 0,
          stars: 3,
        });
      }
    },
    20_000,
  );

  it("does not silently auto-win any level without a build", () => {
    for (const level of getCampaignLevels()) {
      const world = new PhysicsWorld();
      world.resetLevel(level, [], []);
      const egg = world.spawnEgg(
        {
          x: level.start.x + EGG_SPEC.spawnOffset.x,
          y: level.start.y + EGG_SPEC.spawnOffset.y,
        },
        "no-input",
      );
      for (let frame = 0; frame < 900; frame++) world.step(SIMULATION.fixedStepMs);
      expect(egg.nested, `level ${level.number}`).toBe(false);
      world.destroy();
    }
  });

  it("migrates version-one saves without losing progress", () => {
    const store = new Map<string, string>();
    store.set(
      "chicken-nest-run-v1",
      JSON.stringify({
        version: 1,
        unlockedLevel: 17,
        bestStars: [3, 2, 1],
        muted: true,
        reduceMotion: true,
      }),
    );
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
      },
    });
    const save = loadSave();
    expect(save.version).toBe(2);
    expect(save.unlockedLevel).toBe(17);
    expect(save.selectedLevel).toBe(17);
    expect(save.bestStars.slice(0, 3)).toEqual([3, 2, 1]);
    expect(save.sfxMuted).toBe(true);
    expect(save.musicMuted).toBe(true);
  });
});
