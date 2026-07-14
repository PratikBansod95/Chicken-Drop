import { starString } from "./hud";

export function showResult(
  els: {
    resultOverlay: HTMLElement;
    resultTitle: HTMLElement;
    resultStars: HTMLElement;
    resultCopy: HTMLElement;
  },
  opts: { won: boolean; stars: number; copy: string; title: string },
) {
  els.resultTitle.textContent = opts.title;
  els.resultStars.textContent = starString(opts.stars);
  els.resultCopy.textContent = opts.copy;
  els.resultOverlay.hidden = false;
}
