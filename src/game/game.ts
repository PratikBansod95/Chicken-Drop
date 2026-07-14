import { AudioBus, TOOL_META } from "./audio";
import { generateLevel } from "./levels";
import { PhysicsWorld, type InkStroke, type PlacedTool } from "./physics";
import { renderFrame, resizeCanvas, worldFromClient } from "./render";
import { loadSave, writeSave } from "./save";
import { TWEAKS } from "./types";
import type {
  GameMode,
  LevelData,
  SaveData,
  SelectedTool,
  ToolKind,
  Vec2,
} from "./types";

function starString(n: number) {
  return "★".repeat(n) + "☆".repeat(3 - n);
}

function strokeLength(points: Vec2[]) {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return len;
}

export class Game {
  private root: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private physics = new PhysicsWorld();
  private audio = new AudioBus();
  private save: SaveData;
  private level!: LevelData;
  private mode: GameMode = "intro";
  private strokes: InkStroke[] = [];
  private draft: Vec2[] | null = null;
  private inkUsed = 0;
  private placed: PlacedTool[] = [];
  private remainingTools: Partial<Record<ToolKind, number>> = {};
  private selectedTool: SelectedTool = "draw";
  private selectedPlacedId: string | null = null;
  private view = { w: 0, h: 0, scale: 1 };
  private clock = 0;
  private elapsed = 0;
  private chickenPhase: "idle" | "lay" = "idle";
  private eggsToLay = 0;
  private eggsLaid = 0;
  private layTimer = 0;
  private nestedCount = 0;
  private collectedStars = new Set<number>();
  private crackedPositions: Vec2[] = [];
  private failMessage = "";
  private toast = "";
  private toastUntil = 0;
  private raf = 0;
  private lastTs = 0;
  private drawing = false;
  private els!: {
    level: HTMLElement;
    stars: HTMLElement;
    timer: HTMLElement;
    ink: HTMLElement;
    nest: HTMLElement;
    best: HTMLElement;
    toast: HTMLElement;
    tray: HTMLElement;
    startCopy: HTMLElement;
    resultTitle: HTMLElement;
    resultStars: HTMLElement;
    resultCopy: HTMLElement;
    startOverlay: HTMLElement;
    resultOverlay: HTMLElement;
    muteBtn: HTMLElement;
  };

  constructor(root: HTMLElement) {
    this.root = root;
    this.save = loadSave();
    this.audio.setMuted(this.save.muted);
  }

  start() {
    this.root.className = "egg-game";
    this.root.innerHTML = `
      <canvas class="egg-canvas" aria-label="Chicken Nest Run playfield"></canvas>
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
      <div class="egg-overlay" data-overlay="start">
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

    this.canvas = this.root.querySelector(".egg-canvas")!;
    this.els = {
      level: this.root.querySelector('[data-field="level"]')!,
      stars: this.root.querySelector('[data-field="stars"]')!,
      timer: this.root.querySelector('[data-field="timer"]')!,
      ink: this.root.querySelector('[data-field="ink"]')!,
      nest: this.root.querySelector('[data-field="nest"]')!,
      best: this.root.querySelector('[data-field="best"]')!,
      toast: this.root.querySelector('[data-field="toast"]')!,
      tray: this.root.querySelector('[data-field="tray"]')!,
      startCopy: this.root.querySelector('[data-field="startCopy"]')!,
      resultTitle: this.root.querySelector('[data-field="resultTitle"]')!,
      resultStars: this.root.querySelector('[data-field="resultStars"]')!,
      resultCopy: this.root.querySelector('[data-field="resultCopy"]')!,
      startOverlay: this.root.querySelector('[data-overlay="start"]')!,
      resultOverlay: this.root.querySelector('[data-overlay="result"]')!,
      muteBtn: this.root.querySelector('[data-action="mute"]')!,
    };

    this.bindUi();
    this.loadLevel(this.save.unlockedLevel);
    this.onResize();
    window.addEventListener("resize", this.onResize);
    window.addEventListener("keydown", this.onKey);
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerUp);

    this.physics.onEggNested = (id) => this.handleNested(id);
    this.physics.onEggBroken = (id, reason) => this.handleBroken(id, reason);
    this.physics.onBounce = () => this.audio.play("bounce");

    this.lastTs = performance.now();
    this.raf = requestAnimationFrame(this.tick);
    this.updateHud();
    this.refreshTray();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("keydown", this.onKey);
    this.physics.destroy();
    this.root.replaceChildren();
  }

  private bindUi() {
    const act = (name: string, fn: () => void) => {
      this.root.querySelector(`[data-action="${name}"]`)?.addEventListener("click", async () => {
        await this.audio.unlock();
        this.audio.play("tap");
        fn();
      });
    };
    act("start", () => this.beginPlaySession());
    act("play", () => this.startRun());
    act("reset", () => this.resetLevel());
    act("undo", () => this.undo());
    act("clear", () => this.clearInk());
    act("rotateLeft", () => this.rotateSelected(-1));
    act("rotateRight", () => this.rotateSelected(1));
    act("delete", () => this.deleteSelected());
    act("resultNext", () => this.nextLevel());
    act("resultRetry", () => this.resetLevel());
    act("mute", () => {
      this.save.muted = !this.save.muted;
      this.audio.setMuted(this.save.muted);
      writeSave(this.save);
      this.els.muteBtn.textContent = this.save.muted ? "🔇" : "🔊";
    });
  }

  private beginPlaySession() {
    this.root.classList.remove("egg-intro-open");
    this.els.startOverlay.hidden = true;
    this.mode = "ready";
    this.canvas.hidden = false;
    this.audio.play("cluck");
    this.showToast(this.level.eggCount === 1 ? "Guide the egg to the nest" : `Get all ${this.level.eggCount} eggs in the nest`);
    this.updateHud();
  }

  private loadLevel(n: number) {
    this.level = generateLevel(n);
    this.strokes = [];
    this.draft = null;
    this.inkUsed = 0;
    this.placed = [];
    this.remainingTools = { ...this.level.tools };
    this.selectedTool = "draw";
    this.selectedPlacedId = null;
    this.elapsed = 0;
    this.nestedCount = 0;
    this.eggsLaid = 0;
    this.eggsToLay = this.level.eggCount;
    this.collectedStars.clear();
    this.crackedPositions = [];
    this.failMessage = "";
    this.chickenPhase = "idle";
    this.mode = this.els?.startOverlay && !this.els.startOverlay.hidden ? "intro" : "ready";
    this.physics.resetLevel(this.level, [], []);
    this.els.resultOverlay.hidden = true;
    this.refreshTray();
    this.updateHud();
  }

  private resetLevel() {
    const n = this.level.number;
    const keepIntro = false;
    this.loadLevel(n);
    if (!keepIntro) {
      this.els.startOverlay.hidden = true;
      this.root.classList.remove("egg-intro-open");
      this.mode = "ready";
      this.canvas.hidden = false;
    }
  }

  private nextLevel() {
    const next = Math.min(50, this.level.number + 1);
    this.save.unlockedLevel = Math.max(this.save.unlockedLevel, next);
    writeSave(this.save);
    this.loadLevel(next);
    this.els.startOverlay.hidden = true;
    this.root.classList.remove("egg-intro-open");
    this.mode = "ready";
    this.canvas.hidden = false;
    this.showToast(this.level.eggCount === 1 ? "One egg this time" : `${this.level.eggCount} eggs — nest them all`);
  }

  private startRun() {
    if (this.mode !== "ready") {
      if (this.mode === "intro") this.showToast("Tap Start first");
      return;
    }
    if (this.inkUsed <= 0 && this.placed.length === 0) {
      this.showToast("Draw a path or place a tool first");
      return;
    }
    this.physics.resetLevel(this.level, this.strokes, this.placed);
    this.nestedCount = 0;
    this.eggsLaid = 0;
    this.eggsToLay = this.level.eggCount;
    this.elapsed = 0;
    this.crackedPositions = [];
    this.collectedStars.clear();
    this.level.stars.forEach((s) => (s.collected = false));
    this.mode = "laying";
    this.chickenPhase = "lay";
    this.layTimer = 0;
    this.audio.play("cluck");
    this.showToast(this.eggsToLay === 1 ? "Egg incoming!" : `Laying ${this.eggsToLay} eggs…`);
    this.updateHud();
  }

  private layNextEgg() {
    if (this.eggsLaid >= this.eggsToLay) {
      this.mode = "running";
      this.chickenPhase = "idle";
      return;
    }
    this.eggsLaid += 1;
    const jitter = (this.eggsLaid - 1) * 8;
    this.physics.spawnEgg(
      { x: this.level.start.x - 10 + (Math.random() * 10 - 5), y: this.level.start.y + 40 + jitter },
      `egg-${this.eggsLaid}`,
    );
    this.audio.play("lay");
    this.updateHud();
  }

  private handleNested(_id: string) {
    this.nestedCount += 1;
    this.audio.play("plop");
    this.showToast(`Nested ${this.nestedCount}/${this.eggsToLay}`);
    this.updateHud();
    if (this.nestedCount >= this.eggsToLay && this.eggsLaid >= this.eggsToLay) {
      this.win();
    }
  }

  private handleBroken(_id: string, reason: string) {
    const bodyHint =
      reason === "fire"
        ? "An egg was cooked by the fire."
        : reason === "pan"
          ? "An egg hit the frying pan."
          : reason === "spike"
            ? "An egg hit spikes."
            : reason === "fell"
              ? "An egg fell out of the map."
              : "An egg cracked on impact.";
    this.failMessage = bodyHint;
    this.audio.play("crack");
    // capture last positions roughly from physics already removed — skip
    this.fail();
  }

  private win() {
    if (this.mode === "won" || this.mode === "failed") return;
    this.mode = "won";
    this.audio.play("win");

    let stars = 1;
    if (this.inkUsed <= this.level.parInk) stars += 1;
    if (this.placed.length <= this.level.parTools && this.elapsed <= this.level.timeLimit * 0.78)
      stars += 1;
    stars = Math.min(3, stars + (this.collectedStars.size === 3 ? 0 : 0));
    if (this.collectedStars.size >= 2) stars = Math.min(3, stars + 1);
    stars = Math.max(1, Math.min(3, stars));

    const idx = this.level.number - 1;
    this.save.bestStars[idx] = Math.max(this.save.bestStars[idx] ?? 0, stars);
    this.save.unlockedLevel = Math.max(this.save.unlockedLevel, Math.min(50, this.level.number + 1));
    writeSave(this.save);

    this.els.resultTitle.textContent = stars >= 3 ? "Perfect nest!" : "Eggs home!";
    this.els.resultStars.textContent = starString(stars);
    this.els.resultCopy.textContent =
      this.eggsToLay === 1
        ? "The egg settled safely in the nest."
        : `All ${this.eggsToLay} eggs settled in the nest.`;
    this.els.resultOverlay.hidden = false;
    this.updateHud();
  }

  private fail() {
    if (this.mode === "won" || this.mode === "failed") return;
    this.mode = "failed";
    this.audio.play("fail");
    this.els.resultTitle.textContent = "Oh no!";
    this.els.resultStars.textContent = "☆☆☆";
    this.els.resultCopy.textContent = this.failMessage || "Try a softer path.";
    this.els.resultOverlay.hidden = false;
  }

  private undo() {
    if (this.mode !== "ready") return;
    if (this.strokes.length) {
      const last = this.strokes.pop()!;
      this.inkUsed = Math.max(0, this.inkUsed - strokeLength(last.points));
    }
    this.updateHud();
  }

  private clearInk() {
    if (this.mode !== "ready") return;
    this.strokes = [];
    this.inkUsed = 0;
    this.updateHud();
  }

  private rotateSelected(dir: number) {
    if (this.mode !== "ready" || !this.selectedPlacedId) return;
    const obj = this.placed.find((p) => p.id === this.selectedPlacedId);
    if (!obj) return;
    obj.angle += (dir * Math.PI) / 12;
  }

  private deleteSelected() {
    if (this.mode !== "ready" || !this.selectedPlacedId) return;
    const idx = this.placed.findIndex((p) => p.id === this.selectedPlacedId);
    if (idx < 0) return;
    const [obj] = this.placed.splice(idx, 1);
    const kind = obj.type as ToolKind;
    if (kind in TOOL_META) {
      this.remainingTools[kind] = (this.remainingTools[kind] ?? 0) + 1;
    }
    this.selectedPlacedId = null;
    this.refreshTray();
  }

  private showToast(msg: string) {
    this.toast = msg;
    this.toastUntil = this.clock + 1.8;
    this.els.toast.hidden = false;
    this.els.toast.textContent = msg;
  }

  private refreshTray() {
    const tray = this.els.tray;
    tray.replaceChildren();

    const drawBtn = document.createElement("button");
    drawBtn.type = "button";
    drawBtn.className = `egg-tool${this.selectedTool === "draw" ? " is-selected" : ""}`;
    drawBtn.innerHTML = `<span>✎ Draw</span><strong></strong>`;
    drawBtn.addEventListener("click", () => {
      this.selectedTool = "draw";
      this.selectedPlacedId = null;
      this.refreshTray();
      this.audio.play("tap");
    });
    tray.append(drawBtn);

    for (const [kind, total] of Object.entries(this.level.tools) as [ToolKind, number][]) {
      const left = this.remainingTools[kind] ?? 0;
      const meta = TOOL_META[kind];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `egg-tool${this.selectedTool === kind ? " is-selected" : ""}`;
      btn.disabled = this.mode !== "ready" || left <= 0;
      btn.innerHTML = `<span>${meta.label}</span><strong>${left}/${total}</strong>`;
      btn.addEventListener("click", () => {
        if (left <= 0 || this.mode !== "ready") return;
        this.selectedTool = kind;
        this.selectedPlacedId = null;
        this.refreshTray();
        this.audio.play("tap");
      });
      tray.append(btn);
    }
  }

  private updateHud() {
    this.els.level.textContent = `Level ${this.level.number}`;
    this.els.stars.textContent = starString(this.collectedStars.size);
    const left = Math.max(0, Math.ceil(this.level.timeLimit - this.elapsed));
    this.els.timer.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
    const inkPct = Math.max(0, Math.round((1 - this.inkUsed / this.level.inkLimit) * 100));
    this.els.ink.textContent = `Ink ${inkPct}%`;
    this.els.nest.textContent = `Nest ${this.nestedCount}/${this.eggsToLay || this.level.eggCount}`;
    this.els.best.textContent = `Best ${starString(this.save.bestStars[this.level.number - 1] || 0)}`;
    this.els.muteBtn.textContent = this.save.muted ? "🔇" : "🔊";
    this.els.startCopy.textContent =
      this.level.eggCount === 1
        ? "Level 1: the hen lays one egg.\nDraw a path to the nest, then tap Play."
        : `This level: ${this.level.eggCount} eggs.\nEvery egg must settle in the nest.`;
  }

  private onResize = () => {
    this.view = resizeCanvas(this.canvas);
  };

  private onKey = (e: KeyboardEvent) => {
    if (e.code === "KeyR") {
      e.preventDefault();
      this.resetLevel();
    }
    if (e.code === "KeyQ") this.rotateSelected(-1);
    if (e.code === "KeyE") this.rotateSelected(1);
    if (e.code === "Delete" || e.code === "Backspace") this.deleteSelected();
  };

  private onPointerDown = (e: PointerEvent) => {
    if (this.mode !== "ready") return;
    this.audio.unlock();
    const p = worldFromClient(this.canvas, e.clientX, e.clientY, this.view);
    this.canvas.setPointerCapture(e.pointerId);

    if (this.selectedTool === "draw") {
      this.drawing = true;
      this.draft = [p];
      return;
    }

    // place tool
    const kind = this.selectedTool;
    const left = this.remainingTools[kind] ?? 0;
    if (left <= 0) return;
    const meta = TOOL_META[kind];
    const obj: PlacedTool = {
      id: `${kind}-${Date.now()}`,
      type: kind,
      x: p.x,
      y: p.y,
      angle: 0,
      w: meta.w,
      h: meta.h,
      dir: 1,
      bodyIds: [],
    };
    this.placed.push(obj);
    this.remainingTools[kind] = left - 1;
    this.selectedPlacedId = obj.id;
    this.refreshTray();
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.drawing || !this.draft) return;
    const p = worldFromClient(this.canvas, e.clientX, e.clientY, this.view);
    const last = this.draft[this.draft.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) < 6) return;
    const nextLen = this.inkUsed + strokeLength([...this.draft, p]);
    if (nextLen > this.level.inkLimit * TWEAKS.inkBudgetScale) {
      this.showToast("Out of ink — undo or clear a line.");
      return;
    }
    this.draft.push(p);
  };

  private onPointerUp = () => {
    if (!this.drawing || !this.draft) {
      this.drawing = false;
      return;
    }
    this.drawing = false;
    if (this.draft.length >= 2) {
      const len = strokeLength(this.draft);
      this.strokes.push({ points: this.draft });
      this.inkUsed += len;
    }
    this.draft = null;
    this.updateHud();
  };

  private collectStars() {
    for (const egg of this.physics.eggs) {
      if (egg.broken) continue;
      const body = this.physics.getEggBody(egg);
      if (!body) continue;
      this.level.stars.forEach((star, i) => {
        if (this.collectedStars.has(i) || star.collected) return;
        if (Math.hypot(body.position.x - star.x, body.position.y - star.y) < 42) {
          star.collected = true;
          this.collectedStars.add(i);
          this.audio.play("star");
        }
      });
    }
  }

  private tick = (ts: number) => {
    const dt = Math.min(0.033, Math.max(0, (ts - this.lastTs) / 1000));
    this.lastTs = ts;
    this.clock += dt;

    if (this.toast && this.clock > this.toastUntil) {
      this.toast = "";
      this.els.toast.hidden = true;
    }

    if (this.mode === "laying") {
      this.layTimer -= dt;
      if (this.layTimer <= 0) {
        this.layNextEgg();
        this.layTimer = TWEAKS.eggLaySpacingMs / 1000;
        if (this.eggsLaid >= this.eggsToLay) {
          this.mode = "running";
          this.chickenPhase = "idle";
        }
      }
      this.physics.step(dt * 1000);
      this.collectStars();
    } else if (this.mode === "running") {
      this.elapsed += dt;
      if (this.elapsed > this.level.timeLimit) {
        this.failMessage = "Time ran out before every egg reached the nest.";
        this.fail();
      } else {
        this.physics.step(dt * 1000);
        this.collectStars();
        if (
          this.nestedCount >= this.eggsToLay &&
          this.eggsLaid >= this.eggsToLay &&
          this.physics.eggs.every((e) => e.broken || e.nested)
        ) {
          this.win();
        }
      }
      this.updateHud();
    }

    renderFrame({
      canvas: this.canvas,
      view: this.view,
      level: this.level,
      physics: this.physics,
      strokes: this.strokes,
      draft: this.draft,
      placed: this.placed,
      chickenPhase: this.chickenPhase,
      time: this.clock,
      crackedPositions: this.crackedPositions,
    });

    this.raf = requestAnimationFrame(this.tick);
  };
}
