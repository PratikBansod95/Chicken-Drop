import type { SaveData } from "./types";

/** Live gameplay tunables (also usable as a debug/tweaks panel). */
export const TWEAKS = {
  gravity: 1.05,
  breakImpulse: 0.085,
  nestSettleSpeed: 2.2,
  nestHoldFrames: 10,
  bounceScale: 1,
  fanForce: 0.0042,
  eggLaySpacingMs: 480,
  inkBudgetScale: 1,
  musicVolume: 0.12,
  shakeDecay: 0.86,
  failDelaySec: 0.55,
};

export type TweakKey = keyof typeof TWEAKS;

export function defaultSave(): SaveData {
  return {
    version: 1,
    unlockedLevel: 1,
    bestStars: Array.from({ length: 50 }, () => 0),
    muted: false,
    reduceMotion: false,
    seenTutorial: false,
  };
}

const KEY = "chicken-nest-run-v1";

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    if (parsed.version !== 1) return defaultSave();
    const base = defaultSave();
    return {
      ...base,
      ...parsed,
      bestStars: Array.from({ length: 50 }, (_, i) =>
        Math.max(0, Math.min(3, Math.floor(parsed.bestStars?.[i] ?? 0))),
      ),
      unlockedLevel: Math.max(1, Math.min(50, Math.floor(parsed.unlockedLevel || 1))),
      muted: !!parsed.muted,
      reduceMotion: !!parsed.reduceMotion,
      seenTutorial: !!parsed.seenTutorial,
    };
  } catch {
    return defaultSave();
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* private mode / quota */
  }
}
