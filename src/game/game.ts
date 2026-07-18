import { AudioBus } from "./audio";
import { assets } from "./assets/bank";
import { generateLevel } from "./levels";
import { PhysicsWorld, type InkStroke, type PlacedTool } from "./physics";
import { renderFrame, resizeCanvas, worldFromClient, type ViewState } from "./render";
import { loadSave, writeSave } from "./save";
import { TWEAKS } from "./tweaks";
import { EGG_SPEC, NEST_SPEC, SIMULATION } from "./config/geometry";
import { TOOL_META } from "./types";
import type {
  FailReason,
  GameMode,
  LevelData,
  SaveData,
  SelectedTool,
  ToolKind,
  Vec2,
} from "./types";
import { CameraFx } from "./systems/cameraFx";
import { FixedStepClock } from "./systems/fixedStep";
import { hitTestPlacedTool } from "./systems/selection";
import { appendDraftPoint, commitStroke, strokeLength } from "./systems/inkDraw";
import { failMessage, scoreStars } from "./systems/winLose";
import { updateHud } from "./ui/hud";
import { refreshTray } from "./ui/tray";
import { shellHtml, showResult } from "./ui/shell";
import { bindActions } from "./ui/actions";

const INK_PROTECTED_PADDING = 14;

export class Game {
  private root: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private physics = new PhysicsWorld();
  private audio = new AudioBus();
  private fx = new CameraFx();
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
  private draggingPlacedId: string | null = null;
  private dragOffset: Vec2 = { x: 0, y: 0 };
  private view: ViewState = { w: 0, h: 0, scale: 1, offsetX: 0, offsetY: 0 };
  private clock = 0;
  private fixedClock = new FixedStepClock();
  private elapsed = 0;
  private chickenPhase: "idle" | "lay" = "idle";
  private eggsToLay = 0;
  private eggsLaid = 0;
  private layTimer = 0;
  private nestedCount = 0;
  private collectedStars = new Set<number>();
  private crackedPositions: Vec2[] = [];
  private failMessageText = "";
  private failAt = 0;
  private toastUntil = 0;
  private raf = 0;
  private lastTs = 0;
  private drawing = false;
  private paused = false;
  private resizeObserver: ResizeObserver | null = null;
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
    preload: HTMLElement;
    muteBtn: HTMLElement;
    motionBtn: HTMLElement;
  };

  constructor(root: HTMLElement) {
    this.root = root;
    this.save = loadSave();
    const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduce) this.save.reduceMotion = true;
    this.audio.setMuted(this.save.muted);
    this.fx.reduceMotion = this.save.reduceMotion;
  }

  start() {
    this.root.className = "egg-game egg-intro-open";
    this.root.innerHTML = shellHtml();
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
      preload: this.root.querySelector('[data-overlay="preload"]')!,
      muteBtn: this.root.querySelector('[data-action="mute"]')!,
      motionBtn: this.root.querySelector('[data-action="motion"]')!,
    };

    this.bindUi();
    this.loadLevel(this.save.unlockedLevel);
    this.onResize();
    window.addEventListener("resize", this.onResize);
    window.visualViewport?.addEventListener("resize", this.onResize);
    this.resizeObserver = new ResizeObserver(this.onResize);
    this.resizeObserver.observe(this.root);
    window.addEventListener("keydown", this.onKey);
    document.addEventListener("visibilitychange", this.onVisibility);
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerUp);

    this.physics.onEggNested = (id) => this.handleNested(id);
    this.physics.onEggBroken = (id, reason, at) => this.handleBroken(id, reason, at);
    this.physics.onBounce = (s) => {
      this.audio.play("bounce");
      this.fx.impulse(Math.min(8, s * 0.35));
    };

    const preloadFill = this.root.querySelector<HTMLElement>(".preload-bar span");
    void assets.load((loaded, total) => {
      if (preloadFill) preloadFill.style.width = `${Math.round((loaded / total) * 100)}%`;
    }).then(() => {
      this.els.preload.hidden = true;
      this.els.startOverlay.hidden = false;
      this.canvas.hidden = false;
      this.refreshTray();
      this.updateHud();
    });

    this.lastTs = performance.now();
    this.raf = requestAnimationFrame(this.tick);
    this.refreshTray();
    this.updateHud();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    window.visualViewport?.removeEventListener("resize", this.onResize);
    this.resizeObserver?.disconnect();
    window.removeEventListener("keydown", this.onKey);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.physics.destroy();
    this.root.replaceChildren();
  }

  private bindUi() {
    bindActions(
      this.root,
      () => this.audio.unlock(),
      () => this.audio.play("tap"),
      {
        start: () => this.beginPlaySession(),
        play: () => this.startRun(),
        reset: () => this.resetLevel(),
        undo: () => this.undo(),
        clear: () => this.clearInk(),
        rotateLeft: () => this.rotateSelected(-1),
        rotateRight: () => this.rotateSelected(1),
        delete: () => this.deleteSelected(),
        resultNext: () => this.nextLevel(),
        resultRetry: () => this.resetLevel(),
        mute: () => {
          this.save.muted = !this.save.muted;
          this.audio.setMuted(this.save.muted);
          writeSave(this.save);
          this.updateHud();
        },
        motion: () => {
          this.save.reduceMotion = !this.save.reduceMotion;
          this.fx.reduceMotion = this.save.reduceMotion;
          writeSave(this.save);
          this.updateHud();
        },
      },
    );
  }

  private async beginPlaySession() {
    this.root.classList.remove("egg-intro-open");
    this.els.startOverlay.hidden = true;
    this.mode = "ready";
    this.canvas.hidden = false;
    await this.audio.enableMusic();
    this.audio.play("cluck");
    this.showToast(
      this.level.eggCount === 1
        ? "Guide the egg to the nest"
        : `Get all ${this.level.eggCount} eggs in the nest`,
    );
    this.refreshTray();
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
    this.draggingPlacedId = null;
    this.elapsed = 0;
    this.fixedClock.reset();
    this.nestedCount = 0;
    this.eggsLaid = 0;
    this.eggsToLay = this.level.eggCount;
    this.collectedStars.clear();
    this.crackedPositions = [];
    this.failMessageText = "";
    this.failAt = 0;
    this.chickenPhase = "idle";
    this.mode = this.els.startOverlay.hidden ? "ready" : "intro";
    this.physics.resetLevel(this.level, [], []);
    this.els.resultOverlay.hidden = true;
    this.els.startCopy.textContent =
      this.level.eggCount === 1
        ? "Level 1: the hen lays one egg.\nDraw a path to the nest, then tap Play."
        : `This level: ${this.level.eggCount} eggs.\nEvery egg must settle in the nest.`;
    this.refreshTray();
    this.updateHud();
  }

  private resetLevel() {
    this.loadLevel(this.level.number);
    this.els.startOverlay.hidden = true;
    this.root.classList.remove("egg-intro-open");
    this.mode = "ready";
    this.canvas.hidden = false;
    this.refreshTray();
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
    this.showToast(
      this.level.eggCount === 1 ? "One egg this time" : `${this.level.eggCount} eggs — nest them all`,
    );
  }

  private startRun() {
    if (this.mode !== "ready") {
      if (this.mode === "intro") this.showToast("Tap Start first");
      return;
    }
    this.physics.resetLevel(this.level, this.strokes, this.placed);
    this.nestedCount = 0;
    this.eggsLaid = 0;
    this.eggsToLay = this.level.eggCount;
    this.elapsed = 0;
    this.fixedClock.reset();
    this.crackedPositions = [];
    this.failAt = 0;
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
    const base = {
      x: this.level.start.x + EGG_SPEC.spawnOffset.x,
      y: this.level.start.y + EGG_SPEC.spawnOffset.y,
    };
    const candidates = [
      base,
      { x: base.x - 34, y: base.y - 8 },
      { x: base.x + 34, y: base.y - 8 },
      { x: base.x, y: base.y - 34 },
    ];
    const spawn = candidates.find((point) => this.physics.canSpawnEgg(point));
    if (!spawn) {
      this.layTimer = 0.12;
      this.showToast("Clear a little space below the hen");
      return;
    }

    this.eggsLaid += 1;
    this.physics.spawnEgg(spawn, `egg-${this.eggsLaid}`);
    this.audio.play("lay");
    if (this.eggsLaid >= this.eggsToLay) {
      this.mode = "running";
      this.chickenPhase = "idle";
    }
    this.updateHud();
  }

  private handleNested(_id: string) {
    this.nestedCount += 1;
    this.audio.play("plop");
    this.fx.impulse(3);
    this.showToast(`Nested ${this.nestedCount}/${this.eggsToLay}`);
    this.updateHud();
    if (this.nestedCount >= this.eggsToLay && this.eggsLaid >= this.eggsToLay) this.win();
  }

  private handleBroken(id: string, reason: FailReason, at: Vec2) {
    this.failMessageText = failMessage(reason, id.replace("egg-", "Egg "));
    this.crackedPositions.push(at);
    this.audio.play("crack");
    this.fx.impulse(10);
    this.failAt = this.clock + 0.5;
  }

  private win() {
    if (this.mode === "won" || this.mode === "failed") return;
    this.mode = "won";
    this.audio.play("win");
    this.fx.burst(this.level.basket.x, this.level.basket.y);

    const stars = scoreStars({
      inkUsed: this.inkUsed,
      parInk: this.level.parInk,
      placedCount: this.placed.length,
      parTools: this.level.parTools,
      elapsed: this.elapsed,
      timeLimit: this.level.timeLimit,
      starsCollected: this.collectedStars.size,
    });

    const idx = this.level.number - 1;
    this.save.bestStars[idx] = Math.max(this.save.bestStars[idx] ?? 0, stars);
    this.save.unlockedLevel = Math.max(this.save.unlockedLevel, Math.min(50, this.level.number + 1));
    writeSave(this.save);

    showResult(this.els, {
      won: true,
      stars,
      title: stars >= 3 ? "Perfect nest!" : "Eggs home!",
      copy:
        this.eggsToLay === 1
          ? "The egg settled safely in the nest."
          : `All ${this.eggsToLay} eggs settled in the nest.`,
    });
    this.updateHud();
  }

  private fail() {
    if (this.mode === "won" || this.mode === "failed") return;
    this.mode = "failed";
    this.audio.play("fail");
    showResult(this.els, {
      won: false,
      stars: 0,
      title: "Oh no!",
      copy: this.failMessageText || "Try a softer path.",
    });
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
    if (kind in TOOL_META) this.remainingTools[kind] = (this.remainingTools[kind] ?? 0) + 1;
    this.selectedPlacedId = null;
    this.refreshTray();
  }

  private showToast(msg: string) {
    this.toastUntil = this.clock + 1.8;
    this.els.toast.hidden = false;
    this.els.toast.textContent = msg;
  }

  private refreshTray() {
    refreshTray(this.els.tray, {
      mode: this.mode,
      selectedTool: this.selectedTool,
      levelTools: this.level.tools,
      remaining: this.remainingTools,
      onSelect: (tool) => {
        this.selectedTool = tool;
        this.selectedPlacedId = null;
        this.audio.play("tap");
        if (tool === "spring") {
          this.showToast("Spring: place the green top plate under an egg; rotate with Q / E");
        }
        this.refreshTray();
      },
    });
  }

  private updateHud() {
    const left = Math.max(0, Math.ceil(this.level.timeLimit - this.elapsed));
    const inkPct = Math.max(0, Math.round((1 - this.inkUsed / this.level.inkLimit) * 100));
    updateHud(this.els, {
      levelNumber: this.level.number,
      starsCollected: this.collectedStars.size,
      timeLeft: left,
      inkPct,
      nested: this.nestedCount,
      totalEggs: this.eggsToLay || this.level.eggCount,
      best: this.save.bestStars[this.level.number - 1] || 0,
      muted: this.save.muted,
      reduceMotion: this.save.reduceMotion,
    });
  }

  private onResize = () => {
    this.view = resizeCanvas(this.canvas);
  };

  private onVisibility = () => {
    this.paused = document.hidden;
    if (!document.hidden) this.lastTs = performance.now();
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

  private isProtectedBuildPoint(point: Vec2, ignorePlacedId?: string): boolean {
    const spawn = {
      x: this.level.start.x + EGG_SPEC.spawnOffset.x,
      y: this.level.start.y + EGG_SPEC.spawnOffset.y,
    };
    if (
      Math.hypot(point.x - spawn.x, point.y - spawn.y) <
      EGG_SPEC.spawnClearance + 24
    ) {
      return true;
    }
    const nestX = (point.x - this.level.basket.x) / (NEST_SPEC.outerWidth / 2 + 16);
    const nestY = (point.y - this.level.basket.y) / (NEST_SPEC.wallHeight / 2 + 24);
    if (nestX * nestX + nestY * nestY < 1) return true;

    const objects = [
      ...this.level.fixedObjects,
      ...this.placed.filter((placed) => placed.id !== ignorePlacedId),
    ];
    return objects.some((object) => {
      const dx = point.x - object.x;
      const dy = point.y - object.y;
      const cos = Math.cos(-object.angle);
      const sin = Math.sin(-object.angle);
      const localX = dx * cos - dy * sin;
      const localY = dx * sin + dy * cos;
      const padding = INK_PROTECTED_PADDING;
      return (
        Math.abs(localX) <= object.w / 2 + padding &&
        Math.abs(localY) <= object.h / 2 + padding
      );
    });
  }

  private segmentCrossesProtected(from: Vec2, to: Vec2): boolean {
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const samples = Math.max(1, Math.ceil(distance / 8));
    for (let index = 1; index <= samples; index++) {
      const t = index / samples;
      if (
        this.isProtectedBuildPoint({
          x: from.x + (to.x - from.x) * t,
          y: from.y + (to.y - from.y) * t,
        })
      ) {
        return true;
      }
    }
    return false;
  }

  private onPointerDown = (e: PointerEvent) => {
    if (this.mode !== "ready") return;
    void this.audio.unlock();
    const p = worldFromClient(this.canvas, e.clientX, e.clientY, this.view);
    if (!p) return;
    this.canvas.setPointerCapture(e.pointerId);

    const placedHit = hitTestPlacedTool(this.placed, p);
    if (placedHit) {
      this.selectedPlacedId = placedHit.id;
      this.draggingPlacedId = placedHit.id;
      this.dragOffset = { x: p.x - placedHit.x, y: p.y - placedHit.y };
      this.selectedTool = "draw";
      this.refreshTray();
      return;
    }

    if (this.isProtectedBuildPoint(p)) {
      this.showToast("Keep the hen and nest openings clear");
      return;
    }

    if (this.selectedTool === "draw") {
      this.selectedPlacedId = null;
      this.drawing = true;
      this.draft = [p];
      return;
    }

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
    if (kind === "spring") {
      this.showToast("Spring armed — its top plate launches eggs in the direction it faces");
    }
    this.refreshTray();
  };

  private onPointerMove = (e: PointerEvent) => {
    const p = worldFromClient(this.canvas, e.clientX, e.clientY, this.view);
    if (!p) return;
    if (this.draggingPlacedId) {
      const tool = this.placed.find((placed) => placed.id === this.draggingPlacedId);
      if (!tool || this.isProtectedBuildPoint(p, tool.id)) return;
      tool.x = p.x - this.dragOffset.x;
      tool.y = p.y - this.dragOffset.y;
      return;
    }
    if (!this.drawing || !this.draft) return;
    const previous = this.draft[this.draft.length - 1];
    if (this.segmentCrossesProtected(previous, p)) {
      this.inkUsed += commitStroke(this.strokes, this.draft);
      this.draft = null;
      this.drawing = false;
      this.showToast("Ink cannot cross tools or hazards");
      this.updateHud();
      return;
    }
    const result = appendDraftPoint(
      this.draft,
      p,
      this.inkUsed,
      this.level.inkLimit * TWEAKS.inkBudgetScale,
    );
    if (result.reason) this.showToast(result.reason);
  };

  private onPointerUp = () => {
    if (this.draggingPlacedId) {
      this.draggingPlacedId = null;
      return;
    }
    if (!this.drawing || !this.draft) {
      this.drawing = false;
      return;
    }
    this.drawing = false;
    this.inkUsed += commitStroke(this.strokes, this.draft);
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

  private simulateFixedStep() {
    const dtSec = SIMULATION.fixedStepMs / 1000;

    if (this.mode === "laying") {
      this.layTimer -= dtSec;
      if (this.layTimer <= 0) {
        this.layNextEgg();
        if (this.mode === "laying") this.layTimer = EGG_SPEC.laySpacingSec;
      }
    } else if (this.mode === "running") {
      this.elapsed += dtSec;
      if (this.elapsed > this.level.timeLimit) {
        this.failMessageText = failMessage("timeout");
        this.fail();
        return;
      }
    } else {
      return;
    }

    this.physics.step(SIMULATION.fixedStepMs);
    this.collectStars();

    if (
      this.mode === "running" &&
      this.nestedCount >= this.eggsToLay &&
      this.eggsLaid >= this.eggsToLay &&
      this.physics.eggs.every((egg) => egg.broken || egg.nested)
    ) {
      this.win();
    }
  }

  private tick = (ts: number) => {
    const frameMs = this.paused
      ? 0
      : Math.min(SIMULATION.maxFrameMs, Math.max(0, ts - this.lastTs));
    const dt = frameMs / 1000;
    this.lastTs = ts;
    this.clock += dt;
    this.fx.update(dt);

    if (this.clock > this.toastUntil) this.els.toast.hidden = true;

    if (this.failAt > 0 && this.clock >= this.failAt) {
      this.failAt = 0;
      this.fail();
    }

    if (!this.paused && (this.mode === "laying" || this.mode === "running")) {
      this.fixedClock.advance(frameMs, () => {
        if (this.mode === "laying" || this.mode === "running") {
          this.simulateFixedStep();
        }
      });
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
      fx: this.fx,
      reduceMotion: this.save.reduceMotion,
      selectedPlacedId: this.selectedPlacedId,
    });

    this.raf = requestAnimationFrame(this.tick);
  };
}
