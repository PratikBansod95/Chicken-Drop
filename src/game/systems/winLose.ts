import type { FailReason } from "../types";

export function failMessage(reason: FailReason, eggLabel?: string): string {
  const who = eggLabel ? `${eggLabel} ` : "An egg ";
  switch (reason) {
    case "fire":
      return `${who}was cooked by the fire.`;
    case "pan":
      return `${who}hit the frying pan.`;
    case "spike":
      return `${who}hit spikes.`;
    case "fell":
      return `${who}fell out of the map.`;
    case "timeout":
      return "Time ran out before every egg reached the nest.";
    case "crack":
    default:
      return `${who}cracked on impact.`;
  }
}

export function scoreStars(opts: {
  inkUsed: number;
  parInk: number;
  placedCount: number;
  parTools: number;
  elapsed: number;
  timeLimit: number;
  starsCollected: number;
}): number {
  let stars = 1;
  if (opts.inkUsed <= opts.parInk) stars += 1;
  if (opts.placedCount <= opts.parTools && opts.elapsed <= opts.timeLimit * 0.78) stars += 1;
  if (opts.starsCollected >= 2) stars = Math.min(3, stars + 1);
  return Math.max(1, Math.min(3, stars));
}
