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
      <canvas class="egg-canvas" hidden tabindex="0" aria-label="Chicken Nest Run playfield"></canvas>

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
          <button type="button" class="btn btn-icon" data-action="previous" aria-label="Previous level" title="Previous level">‹</button>
          <button type="button" class="btn btn-icon" data-action="map" aria-label="Open level map" title="Levels">50</button>
          <button type="button" class="btn btn-icon" data-action="help" aria-label="Open help" title="Help">?</button>
          <button type="button" class="btn btn-icon" data-action="motion" aria-label="Toggle motion" title="Motion">${icons.spark}</button>
          <button type="button" class="btn btn-icon" data-action="music" aria-label="Mute music" title="Music">♫</button>
          <button type="button" class="btn btn-icon" data-action="mute" aria-label="Mute sound effects" title="Sound effects">${icons.unmute}</button>
          <button type="button" class="btn btn-icon" data-action="reset" aria-label="Reset level">${icons.reset}</button>
          <button type="button" class="btn btn-play" data-action="play" aria-label="Run the eggs">${icons.play}<span>Play</span></button>
        </div>
      </header>

      <div class="egg-toast" data-field="toast" role="status" aria-live="polite" aria-atomic="true" hidden></div>

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
      <div class="egg-panel" role="dialog" aria-modal="true" aria-labelledby="result-heading">
        <h2 id="result-heading" data-field="resultTitle">Nice catch!</h2>
        <div class="egg-result-stars" data-field="resultStars">★★★</div>
        <p data-field="resultCopy">Every egg made it home.</p>
        <div class="objective-list" data-field="resultObjectives"></div>
        <div class="egg-actions-row">
          <button type="button" class="btn btn-cta" data-action="resultNext" data-field="resultNext">Next</button>
          <button type="button" class="btn btn-cta" data-action="resultEdit" data-field="resultEdit" hidden>Edit Build</button>
          <button type="button" class="btn btn-ghost" data-action="resultHint" data-field="resultHint" hidden>Hint</button>
          <button type="button" class="btn btn-ghost" data-action="resultRetry">Retry</button>
        </div>
      </div>
    </div>

    <div class="egg-overlay" data-overlay="map" hidden>
      <div class="egg-panel egg-panel--map" role="dialog" aria-modal="true" aria-labelledby="map-heading">
        <div class="overlay-heading">
          <h2 id="map-heading">Level Map</h2>
          <button type="button" class="btn btn-icon" data-action="closeMap" aria-label="Close level map">×</button>
        </div>
        <p data-field="campaignProgress"></p>
        <div class="level-map-grid" data-field="levelMap"></div>
      </div>
    </div>

    <div class="egg-overlay" data-overlay="help" hidden>
      <div class="egg-panel egg-panel--help" role="dialog" aria-modal="true" aria-labelledby="help-heading">
        <div class="overlay-heading">
          <h2 id="help-heading">How to Play</h2>
          <button type="button" class="btn btn-icon" data-action="closeHelp" aria-label="Close help">×</button>
        </div>
        <p>Draw rails or place tools, then press Play. Every egg must settle inside the nest.</p>
        <ul>
          <li>Tap a tool, then tap the field to place it.</li>
          <li>Drag a placed tool to move it. Select it before rotating or deleting.</li>
          <li>Ink and tools cannot cross the hen, nest, hazards, or other tools.</li>
          <li>Avoid hard impacts, fire, pans, and spikes.</li>
        </ul>
      </div>
    </div>

    <div class="egg-overlay" data-overlay="campaign" hidden>
      <div class="egg-panel egg-panel--hero" role="dialog" aria-modal="true" aria-labelledby="campaign-heading">
        <div class="brand-mark" aria-hidden="true"></div>
        <h2 id="campaign-heading">Master Nesters!</h2>
        <div class="egg-result-stars" data-field="campaignStars">★★★</div>
        <p>All 50 nests are complete. Replay levels to perfect every objective.</p>
        <div class="egg-actions-row">
          <button type="button" class="btn btn-cta" data-action="map">Replay Levels</button>
          <button type="button" class="btn btn-ghost" data-action="closeCampaign">Keep Playing</button>
        </div>
      </div>
    </div>
  `;
}

export { showResult } from "./result";
