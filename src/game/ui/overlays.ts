import { starString } from "./hud";

export function shellHtml(): string {
  return `
    <div class="egg-preload" data-overlay="preload">
      <div class="egg-panel">
        <h1>Chicken Nest Run</h1>
        <p>All eggs must come home.<br/>Loading farm…</p>
      </div>
    </div>
    <canvas class="egg-canvas" hidden aria-label="Chicken Nest Run playfield"></canvas>
    <div class="egg-hud">
      <div class="egg-hud-main">
        <span data-field="level">Level 1</span>
        <span data-field="stars">☆☆☆</span>
      </div>
      <div class="egg-hud-sub">
        <span data-field="timer">0:00</span>
        <span data-field="ink">Ink 100%</span>
        <span data-field="nest">Nest 0/1</span>
        <span data-field="best">Best ☆☆☆</span>
      </div>
    </div>
    <div class="egg-top-actions">
      <button type="button" class="egg-icon" data-action="motion" aria-label="Toggle motion" title="Motion">💫</button>
      <button type="button" class="egg-icon" data-action="mute" aria-label="Mute">🔊</button>
      <button type="button" class="egg-icon egg-icon-wide" data-action="reset" aria-label="Reset level">↻</button>
      <button type="button" class="egg-play" data-action="play" aria-label="Run the eggs">Play</button>
    </div>
    <div class="egg-toast" data-field="toast" hidden></div>
    <div class="egg-tray" data-field="tray"></div>
    <div class="egg-editbar">
      <button type="button" class="egg-small" data-action="undo">Undo</button>
      <button type="button" class="egg-small" data-action="clear">Clear</button>
      <button type="button" class="egg-small" data-action="rotateLeft">⟲</button>
      <button type="button" class="egg-small" data-action="rotateRight">⟳</button>
      <button type="button" class="egg-small" data-action="delete">Delete</button>
    </div>
    <div class="egg-overlay" data-overlay="start" hidden>
      <div class="egg-panel">
        <h1>Chicken Nest Run</h1>
        <p data-field="startCopy">The hen lays eggs. Guide every egg safely into the nest.</p>
        <button type="button" class="egg-primary" data-action="start">Tap to Start</button>
      </div>
    </div>
    <div class="egg-overlay" data-overlay="result" hidden>
      <div class="egg-panel">
        <h2 data-field="resultTitle">Nice catch!</h2>
        <div class="egg-result-stars" data-field="resultStars">★★★</div>
        <p data-field="resultCopy">Every egg made it home.</p>
        <div class="egg-actions-row">
          <button type="button" class="egg-primary" data-action="resultNext">Next</button>
          <button type="button" class="egg-secondary" data-action="resultRetry">Retry</button>
        </div>
      </div>
    </div>
  `;
}

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
