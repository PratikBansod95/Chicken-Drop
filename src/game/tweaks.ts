import type { SaveData } from "./types";

/** Live gameplay tunables (also usable as a debug/tweaks panel). */
export const TWEAKS = {
  gravity: 1.05,
  breakImpulse: 0.085,
  nestSettleSpeed: 2.8,
  nestHoldFrames: 8,
  bounceScale: 1,
  fanForce: 0.0042,
  eggLaySpacingMs: 420,
  inkBudgetScale: 1,
  musicVolume: 0.12,
  shakeDecay: 0.86,
};

export type TweakKey = keyof typeof TWEAKS;

export function defaultSave(): SaveData {
  return {
    version: 2,
    unlockedLevel: 1,
    selectedLevel: 1,
    bestStars: Array.from({ length: 50 }, () => 0),
    muted: false,
    sfxMuted: false,
    musicMuted: false,
    reduceMotion: false,
    tutorialsSeen: [],
    failures: Array.from({ length: 50 }, () => 0),
  };
}

const KEY = "chicken-nest-run-v2";
const LEGACY_KEY = "chicken-nest-run-v1";

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Partial<Omit<SaveData, "version">> & {
      version?: number;
    };
    const base = defaultSave();
    if (parsed.version !== 1 && parsed.version !== 2) return base;
    const unlockedLevel = Math.max(1, Math.min(50, Math.floor(parsed.unlockedLevel || 1)));
    return {
      ...base,
      ...parsed,
      version: 2,
      bestStars: Array.from({ length: 50 }, (_, i) =>
        Math.max(0, Math.min(3, Math.floor(parsed.bestStars?.[i] ?? 0))),
      ),
      unlockedLevel,
      selectedLevel: Math.max(
        1,
        Math.min(unlockedLevel, Math.floor(("selectedLevel" in parsed ? parsed.selectedLevel : unlockedLevel) || 1)),
      ),
      muted: !!parsed.muted,
      sfxMuted: "sfxMuted" in parsed ? !!parsed.sfxMuted : !!parsed.muted,
      musicMuted: "musicMuted" in parsed ? !!parsed.musicMuted : !!parsed.muted,
      reduceMotion: !!parsed.reduceMotion,
      tutorialsSeen: Array.isArray(parsed.tutorialsSeen)
        ? parsed.tutorialsSeen.filter((value): value is string => typeof value === "string")
        : [],
      failures: Array.from({ length: 50 }, (_, i) =>
        Math.max(0, Math.floor(parsed.failures?.[i] ?? 0)),
      ),
    };
  } catch {
    return defaultSave();
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* Storage can be unavailable in private mode or when quota is exhausted. */
  }
}
