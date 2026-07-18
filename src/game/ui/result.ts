import { starString } from "./hud";
import type { StarBreakdown } from "../systems/winLose";

export function showResult(
  els: {
    resultOverlay: HTMLElement;
    resultTitle: HTMLElement;
    resultStars: HTMLElement;
    resultCopy: HTMLElement;
    resultBreakdown?: HTMLElement | null;
    resultNextBtn?: HTMLElement | null;
  },
  opts: {
    won: boolean;
    stars: number;
    copy: string;
    title: string;
    breakdown?: StarBreakdown | null;
    showNext: boolean;
    farmComplete?: boolean;
  },
) {
  els.resultTitle.textContent = opts.title;
  els.resultStars.textContent = starString(opts.stars);
  els.resultCopy.textContent = opts.copy;
  if (els.resultBreakdown) {
    if (opts.won && opts.breakdown) {
      const b = opts.breakdown;
      els.resultBreakdown.hidden = false;
      els.resultBreakdown.innerHTML = `
        <li class="${b.ink ? "is-ok" : ""}"><span>Ink budget</span><span>${b.ink ? "✓" : "—"}</span></li>
        <li class="${b.toolsOrSpeed ? "is-ok" : ""}"><span>Tools &amp; speed</span><span>${b.toolsOrSpeed ? "✓" : "—"}</span></li>
        <li class="${b.collectibles ? "is-ok" : ""}"><span>Collectibles</span><span>${b.collectibles ? "✓" : "—"}</span></li>
      `;
    } else {
      els.resultBreakdown.hidden = true;
      els.resultBreakdown.replaceChildren();
    }
  }
  if (els.resultNextBtn) {
    els.resultNextBtn.hidden = !opts.showNext;
    if (opts.farmComplete) els.resultNextBtn.textContent = "Farm complete";
    else els.resultNextBtn.textContent = "Next";
  }
  els.resultOverlay.hidden = false;
}
