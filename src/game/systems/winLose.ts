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
  const complete = 1;
  const inkObjective = opts.inkUsed <= opts.parInk ? 1 : 0;
  const routeObjective = opts.starsCollected >= 3 ? 1 : 0;
  return complete + inkObjective + routeObjective;
}
