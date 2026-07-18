import { starString } from "./hud";

export function levelMapHtml(): string {
  return `
    <div class="egg-overlay egg-map" data-overlay="map" hidden>
      <div class="egg-panel egg-panel--map">
        <header class="map-head">
          <h2>Level Map</h2>
          <p>Replay any unlocked nest.</p>
        </header>
        <div class="map-grid" data-field="mapGrid"></div>
        <div class="egg-actions-row">
          <button type="button" class="btn btn-cta" data-action="mapContinue">Continue</button>
          <button type="button" class="btn btn-ghost" data-action="mapClose">Close</button>
        </div>
      </div>
    </div>
  `;
}

export function renderLevelMap(
  grid: HTMLElement,
  opts: {
    unlockedLevel: number;
    bestStars: number[];
    current: number;
    onPick: (level: number) => void;
  },
) {
  grid.replaceChildren();
  for (let n = 1; n <= 50; n++) {
    const unlocked = n <= opts.unlockedLevel;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "map-cell";
    btn.dataset.level = String(n);
    if (!unlocked) btn.classList.add("is-locked");
    if (n === opts.current) btn.classList.add("is-current");
    if (opts.bestStars[n - 1] >= 3) btn.classList.add("is-perfect");
    btn.disabled = !unlocked;
    btn.innerHTML = unlocked
      ? `<span class="map-num">${n}</span><span class="map-stars">${starString(opts.bestStars[n - 1] || 0)}</span>`
      : `<span class="map-num">${n}</span><span class="map-lock" aria-hidden="true"></span>`;
    btn.setAttribute("aria-label", unlocked ? `Level ${n}` : `Level ${n} locked`);
    if (unlocked) {
      btn.addEventListener("click", () => opts.onPick(n));
    }
    grid.appendChild(btn);
  }
}
