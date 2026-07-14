import type { SaveData } from "./types";

const KEY = "chicken-nest-run-v1";

export function defaultSave(): SaveData {
  return {
    version: 1,
    unlockedLevel: 1,
    bestStars: Array.from({ length: 50 }, () => 0),
    muted: false,
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as SaveData;
    if (parsed.version !== 1) return defaultSave();
    return {
      ...defaultSave(),
      ...parsed,
      bestStars: Array.from({ length: 50 }, (_, i) =>
        Math.max(0, Math.min(3, Math.floor(parsed.bestStars?.[i] ?? 0))),
      ),
      unlockedLevel: Math.max(1, Math.min(50, Math.floor(parsed.unlockedLevel || 1))),
    };
  } catch {
    return defaultSave();
  }
}

export function writeSave(data: SaveData): void {
  localStorage.setItem(KEY, JSON.stringify(data));
}
