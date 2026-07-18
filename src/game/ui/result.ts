import { starString } from "./hud";

export function showResult(
  els: {
    resultOverlay: HTMLElement;
    resultTitle: HTMLElement;
    resultStars: HTMLElement;
    resultCopy: HTMLElement;
    resultObjectives?: HTMLElement;
    resultNext?: HTMLButtonElement;
    resultEdit?: HTMLButtonElement;
    resultHint?: HTMLButtonElement;
  },
  opts: {
    won: boolean;
    stars: number;
    copy: string;
    title: string;
    finalLevel?: boolean;
    objectives?: { label: string; met: boolean }[];
    allowHint?: boolean;
  },
) {
  els.resultTitle.textContent = opts.title;
  els.resultStars.textContent = starString(opts.stars);
  els.resultCopy.textContent = opts.copy;
  if (els.resultObjectives) {
    els.resultObjectives.replaceChildren(
      ...(opts.objectives ?? []).map((objective) => {
        const row = document.createElement("p");
        row.className = `objective-row${objective.met ? " is-met" : ""}`;
        row.textContent = `${objective.met ? "✓" : "○"} ${objective.label}`;
        return row;
      }),
    );
  }
  if (els.resultNext) {
    els.resultNext.hidden = !opts.won;
    els.resultNext.textContent = opts.finalLevel ? "Campaign Complete" : "Next";
  }
  if (els.resultEdit) els.resultEdit.hidden = opts.won;
  if (els.resultHint) els.resultHint.hidden = opts.won || !opts.allowHint;
  els.resultOverlay.hidden = false;
  (opts.won ? els.resultNext : els.resultEdit)?.focus();
}
