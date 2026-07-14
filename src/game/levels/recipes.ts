/** Egg count recipe: L1 = 1; L2+ = 3 or 5. */
export function eggCountFor(level: number): number {
  if (level <= 1) return 1;
  if (level % 4 === 0 || level >= 20) return 5;
  return 3;
}

export function timeLimitFor(level: number): number {
  return level < 12 ? 70 : level < 32 ? 62 : 55;
}
