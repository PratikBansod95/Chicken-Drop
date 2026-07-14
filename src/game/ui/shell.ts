import { icons } from "./icons";

export function shellHtml(): string {
  return `
    <div class="stage-veil" aria-hidden="true"></div>
    <div class="egg-preload" data-overlay="preload">
      <div class="egg-panel egg-panel--hero">
        <div class="brand-mark" aria-hidden="true"></div>
        <h1>Chicken Nest Run</h1>
        <p>All eggs must come home.</p>
        <div class="preload-bar"><span></span></div>
      </div>
    </div>

    <div class="stage">
      <canvas class="egg-canvas" hidden aria-label="Chicken Nest Run playfield"></canvas>

      <header class="hud">
        <div class="hud-card hud-card--level">
          <p class="hud-kicker">Level</p>
          <div class="hud-level-row">
            <span data-field="level">1</span>
            <span class="hud-stars" data-field="stars">☆☆☆</span>
          </div>
          <div class="hud-pills">
            <span class="pill" data-field="timer" title="Time left">1:10</span>
            <span class="pill" data-field="ink" title="Ink remaining">Ink 100%</span>
            <span class="pill pill--accent" data-field="nest" title="Eggs in nest">Nest 0/1</span>
            <span class="pill" data-field="best" title="Best stars">Best ☆☆☆</span>
          </div>
        </div>

        <div class="hud-actions">
          <button type="button" class="btn btn-icon" data-action="motion" aria-label="Toggle motion" title="Motion">${icons.spark}</button>
          <button type="button" class="btn btn-icon" data-action="mute" aria-label="Mute">${icons.unmute}</button>
          <button type="button" class="btn btn-icon" data-action="reset" aria-label="Reset level">${icons.reset}</button>
          <button type="button" class="btn btn-play" data-action="play" aria-label="Run the eggs">${icons.play}<span>Play</span></button>
        </div>
      </header>

      <div class="egg-toast" data-field="toast" hidden></div>

      <footer class="dock">
        <div class="dock-edit">
          <button type="button" class="btn btn-chip" data-action="undo">${icons.undo}<span>Undo</span></button>
          <button type="button" class="btn btn-chip" data-action="clear">${icons.clear}<span>Clear</span></button>
          <button type="button" class="btn btn-chip" data-action="rotateLeft" aria-label="Rotate left">${icons.rotL}</button>
          <button type="button" class="btn btn-chip" data-action="rotateRight" aria-label="Rotate right">${icons.rotR}</button>
          <button type="button" class="btn btn-chip" data-action="delete" aria-label="Delete">${icons.trash}</button>
        </div>
        <div class="dock-tools" data-field="tray"></div>
      </footer>
    </div>

    <div class="egg-overlay" data-overlay="start" hidden>
      <div class="egg-panel egg-panel--hero">
        <div class="brand-mark" aria-hidden="true"></div>
        <h1>Chicken Nest Run</h1>
        <p data-field="startCopy">The hen lays eggs. Guide every egg safely into the nest.</p>
        <button type="button" class="btn btn-cta" data-action="start">Tap to Start</button>
      </div>
    </div>

    <div class="egg-overlay" data-overlay="result" hidden>
      <div class="egg-panel">
        <h2 data-field="resultTitle">Nice catch!</h2>
        <div class="egg-result-stars" data-field="resultStars">★★★</div>
        <p data-field="resultCopy">Every egg made it home.</p>
        <div class="egg-actions-row">
          <button type="button" class="btn btn-cta" data-action="resultNext">Next</button>
          <button type="button" class="btn btn-ghost" data-action="resultRetry">Retry</button>
        </div>
      </div>
    </div>
  `;
}

export { showResult } from "./result";
