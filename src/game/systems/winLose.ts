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

export interface StarBreakdown {
  total: number;
  ink: boolean;
  toolsOrSpeed: boolean;
  collectibles: boolean;
}

export function scoreStars(opts: {
  inkUsed: number;
  parInk: number;
  placedCount: number;
  parTools: number;
  elapsed: number;
  timeLimit: number;
  starsCollected: number;
}): StarBreakdown {
  const ink = opts.inkUsed <= opts.parInk;
  const toolsOrSpeed = opts.placedCount <= opts.parTools && opts.elapsed <= opts.timeLimit * 0.78;
  const collectibles = opts.starsCollected >= 2;
  let total = 1;
  if (ink) total += 1;
  if (toolsOrSpeed || collectibles) total += 1;
  // Prefer awarding third star from tools/speed; collectibles can substitute if tools over par but 2+ stars grabbed
  if (!toolsOrSpeed && collectibles && total < 3) {
    /* already counted */
  }
  total = Math.max(1, Math.min(3, total));
  return { total, ink, toolsOrSpeed, collectibles };
}
