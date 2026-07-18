import { AudioBus } from "./audio";
import { assets } from "./assets/bank";
import { getLevel } from "./levels";
import { PhysicsWorld, type InkStroke, type PlacedTool } from "./physics";
import { renderFrame, resizeCanvas, worldFromClient } from "./render";
import { loadSave, writeSave } from "./save";
import { TWEAKS } from "./tweaks";
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
import { appendDraftPoint, commitStroke, strokeLength } from "./systems/inkDraw";
import {
  createPlacedTool,
  hitTestTool,
  type UndoAction,
} from "./systems/selection";
import { failMessage, scoreStars } from "./systems/winLose";
import { isEditing, isSimulating, isTerminal } from "./scene/modes";
import { updateHud } from "./ui/hud";
import { refreshTray } from "./ui/tray";
import { shellHtml, showResult } from "./ui/shell";
import { bindActions } from "./ui/actions";
import { renderLevelMap } from "./ui/levelMap";

type TutorialStep = "draw" | "play" | "nest" | "done";

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
  private undoStack: UndoAction[] = [];
  private draggingToolId: string | null = null;
  private dragOffset: Vec2 = { x: 0, y: 0 };
  private dragFrom: Vec2 | null = null;
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
  private failMessageText = "";
  private failAt = 0;
  private pendingFail = false;
  private toastUntil = 0;
  private nestGlowUntil = 0;
  private tutorialStep: TutorialStep = "done";
  private raf = 0;
  private lastTs = 0;
  private drawing = false;
  private paused = false;
  private els!: {
    level: HTMLElement;
    stars: HTMLElement;
    timer: HTMLElement;
    ink: HTMLElement;
    nest: HTMLElement;
    best: HTMLElement;
    toast: HTMLElement;
    coach: HTMLElement;
    tray: HTMLElement;
    startCopy: HTMLElement;
    resultTitle: HTMLElement;
    resultStars: HTMLElement;
    resultCopy: HTMLElement;
    resultBreakdown: HTMLElement;
    resultNextBtn: HTMLElement;
    startOverlay: HTMLElement;
    resultOverlay: HTMLElement;
    mapOverlay: HTMLElement;
    mapGrid: HTMLElement;
    preload: HTMLElement;
    preloadFill: HTMLElement;
    preloadPct: HTMLElement;
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
      coach: this.root.querySelector('[data-field="coach"]')!,
      tray: this.root.querySelector('[data-field="tray"]')!,
      startCopy: this.root.querySelector('[data-field="startCopy"]')!,
      resultTitle: this.root.querySelector('[data-field="resultTitle"]')!,
      resultStars: this.root.querySelector('[data-field="resultStars"]')!,
      resultCopy: this.root.querySelector('[data-field="resultCopy"]')!,
      resultBreakdown: this.root.querySelector('[data-field="resultBreakdown"]')!,
      resultNextBtn: this.root.querySelector('[data-action="resultNext"]')!,
      startOverlay: this.root.querySelector('[data-overlay="start"]')!,
      resultOverlay: this.root.querySelector('[data-overlay="result"]')!,
      mapOverlay: this.root.querySelector('[data-overlay="map"]')!,
      mapGrid: this.root.querySelector('[data-field="mapGrid"]')!,
      preload: this.root.querySelector('[data-overlay="preload"]')!,
      preloadFill: this.root.querySelector('[data-field="preloadFill"]')!,
      preloadPct: this.root.querySelector('[data-field="preloadPct"]')!,
      muteBtn: this.root.querySelector('[data-action="mute"]')!,
      motionBtn: this.root.querySelector('[data-action="motion"]')!,
    };

    this.bindUi();
    this.loadLevel(this.save.unlockedLevel);
    this.onResize();
    window.addEventListener("resize", this.onResize);
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

    void assets
      .load((pct) => {
        this.els.preloadFill.style.width = `${Math.round(pct * 100)}%`;
        this.els.preloadPct.textContent = `Loading ${Math.round(pct * 100)}%`;
      })
      .then(() => {
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
        resultMap: () => this.openMap(),
        map: () => this.openMap(),
        openMap: () => this.openMap(),
        mapContinue: () => {
          this.closeMap();
          this.loadLevel(this.save.unlockedLevel);
          this.els.startOverlay.hidden = true;
          this.root.classList.remove("egg-intro-open");
          this.mode = "ready";
          this.maybeStartTutorial();
        },
        mapClose: () => this.closeMap(),
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
    this.maybeStartTutorial();
    this.refreshTray();
    this.updateHud();
  }

  private maybeStartTutorial() {
    if (this.level.number === 1 && !this.save.seenTutorial) {
      this.tutorialStep = "draw";
      this.updateCoach();
    } else {
      this.tutorialStep = "done";
      this.els.coach.hidden = true;
    }
  }

  private advanceTutorial(from: TutorialStep) {
    if (this.tutorialStep !== from) return;
    if (from === "draw") this.tutorialStep = "play";
    else if (from === "play") this.tutorialStep = "nest";
    else if (from === "nest") {
      this.tutorialStep = "done";
      this.save.seenTutorial = true;
      writeSave(this.save);
      this.nestGlowUntil = this.clock + 2.2;
    }
    this.updateCoach();
  }

  private updateCoach() {
    if (this.save.reduceMotion && this.tutorialStep !== "done") {
      /* still show text */
    }
    const messages: Record<TutorialStep, string> = {
      draw: "Draw a path from the hen toward the nest",
      play: "Tap Play to lay the egg",
      nest: "Watch it settle in the nest",
      done: "",
    };
    const msg = messages[this.tutorialStep];
    if (!msg) {
      this.els.coach.hidden = true;
      return;
    }
    this.els.coach.hidden = false;
    this.els.coach.textContent = msg;
    this.els.coach.classList.toggle("is-pulse", !this.save.reduceMotion);
  }

  private openMap() {
    this.els.resultOverlay.hidden = true;
    renderLevelMap(this.els.mapGrid, {
      unlockedLevel: this.save.unlockedLevel,
      bestStars: this.save.bestStars,
      current: this.level.number,
      onPick: (n) => {
        this.closeMap();
        this.loadLevel(n);
        this.els.startOverlay.hidden = true;
        this.root.classList.remove("egg-intro-open");
        this.mode = "ready";
        this.canvas.hidden = false;
        this.maybeStartTutorial();
        this.showToast(`Level ${n}`);
      },
    });
    this.els.mapOverlay.hidden = false;
    this.mode = "map";
  }

  private closeMap() {
    this.els.mapOverlay.hidden = true;
    if (this.mode === "map") this.mode = "ready";
  }

  private loadLevel(n: number) {
    this.level = getLevel(n);
    this.strokes = [];
    this.draft = null;
    this.inkUsed = 0;
    this.placed = [];
    this.undoStack = [];
    this.remainingTools = { ...this.level.tools };
    this.selectedTool = "draw";
    this.selectedPlacedId = null;
    this.draggingToolId = null;
    this.elapsed = 0;
    this.nestedCount = 0;
    this.eggsLaid = 0;
    this.eggsToLay = this.level.eggCount;
    this.collectedStars.clear();
    this.crackedPositions = [];
    this.failMessageText = "";
    this.pendingFail = false;
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
    this.els.mapOverlay.hidden = true;
    this.root.classList.remove("egg-intro-open");
    this.mode = "ready";
    this.canvas.hidden = false;
    this.maybeStartTutorial();
    this.refreshTray();
  }

  private nextLevel() {
    if (this.level.number >= 50) {
      this.openMap();
      return;
    }
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
    if (this.inkUsed <= 0 && this.placed.length === 0) {
      this.showToast("Draw a path or place a tool first");
      return;
    }
    this.advanceTutorial("play");
    this.physics.resetLevel(this.level, this.strokes, this.placed);
    this.nestedCount = 0;
    this.eggsLaid = 0;
    this.eggsToLay = this.level.eggCount;
    this.elapsed = 0;
    this.crackedPositions = [];
    this.pendingFail = false;
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
      {
        x: this.level.start.x - 10 + (Math.random() * 10 - 5),
        y: this.level.start.y + 40 + jitter,
      },
      `egg-${this.eggsLaid}`,
    );
    this.audio.play("lay");
    this.updateHud();
  }

  private handleNested(_id: string) {
    this.nestedCount += 1;
    this.audio.play("plop");
    this.fx.impulse(3);
    this.nestGlowUntil = this.clock + 0.8;
    this.showToast(`Nested ${this.nestedCount}/${this.eggsToLay}`);
    this.updateHud();
    if (this.tutorialStep === "nest") this.advanceTutorial("nest");
    if (this.nestedCount >= this.eggsToLay && this.eggsLaid >= this.eggsToLay) this.win();
  }

  private handleBroken(id: string, reason: FailReason, at: Vec2) {
    if (isTerminal(this.mode) || this.pendingFail) return;
    this.failMessageText = failMessage(reason, id.replace("egg-", "Egg "));
    this.crackedPositions.push({ ...at });
    this.audio.play("crack");
    this.fx.impulse(10);
    this.pendingFail = true;
    this.failAt = this.clock + TWEAKS.failDelaySec;
  }

  private win() {
    if (isTerminal(this.mode)) return;
    this.mode = "won";
    this.pendingFail = false;
    this.audio.play("win");
    this.fx.burst(this.level.basket.x, this.level.basket.y);

    const breakdown = scoreStars({
      inkUsed: this.inkUsed,
      parInk: this.level.parInk,
      placedCount: this.placed.length,
      parTools: this.level.parTools,
      elapsed: this.elapsed,
      timeLimit: this.level.timeLimit,
      starsCollected: this.collectedStars.size,
    });
    const idx = this.level.number - 1;
    this.save.bestStars[idx] = Math.max(this.save.bestStars[idx] ?? 0, breakdown.total);
    this.save.unlockedLevel = Math.max(this.save.unlockedLevel, Math.min(50, this.level.number + 1));
    writeSave(this.save);

    const farmComplete = this.level.number >= 50;
    showResult(this.els, {
      won: true,
      stars: breakdown.total,
      title: farmComplete ? "Farm complete!" : breakdown.total >= 3 ? "Perfect nest!" : "Eggs home!",
      copy: farmComplete
        ? "Every nest on the farm is full. Replay any level from the map."
        : this.eggsToLay === 1
          ? "The egg settled safely in the nest."
          : `All ${this.eggsToLay} eggs settled in the nest.`,
      breakdown,
      showNext: !farmComplete,
      farmComplete,
    });
    this.updateHud();
  }

  private fail() {
    if (this.mode === "won" || this.mode === "failed") return;
    this.mode = "failed";
    this.pendingFail = false;
    this.audio.play("fail");
    showResult(this.els, {
      won: false,
      stars: 0,
      title: "Oh no!",
      copy: this.failMessageText || "Try a softer path.",
      breakdown: null,
      showNext: false,
    });
  }

  private pushUndo(action: UndoAction) {
    this.undoStack.push(action);
    if (this.undoStack.length > 80) this.undoStack.shift();
  }

  private undo() {
    if (!isEditing(this.mode)) return;
    const action = this.undoStack.pop();
    if (!action) {
      // legacy: pop last stroke if stack empty
      if (this.strokes.length) {
        const last = this.strokes.pop()!;
        this.inkUsed = Math.max(0, this.inkUsed - strokeLength(last.points));
      }
      this.updateHud();
      return;
    }
    switch (action.type) {
      case "stroke":
        if (this.strokes.length) {
          this.strokes.pop();
          this.inkUsed = Math.max(0, this.inkUsed - action.inkDelta);
        }
        break;
      case "place": {
        const idx = this.placed.findIndex((p) => p.id === action.toolId);
        if (idx >= 0) {
          this.placed.splice(idx, 1);
          this.remainingTools[action.kind] = (this.remainingTools[action.kind] ?? 0) + 1;
        }
        if (this.selectedPlacedId === action.toolId) this.selectedPlacedId = null;
        this.refreshTray();
        break;
      }
      case "delete": {
        this.placed.push(action.tool);
        const kind = action.tool.type as ToolKind;
        if (kind in TOOL_META) {
          this.remainingTools[kind] = Math.max(0, (this.remainingTools[kind] ?? 0) - 1);
        }
        this.refreshTray();
        break;
      }
      case "move": {
        const t = this.placed.find((p) => p.id === action.toolId);
        if (t) {
          t.x = action.from.x;
          t.y = action.from.y;
        }
        break;
      }
      case "rotate": {
        const t = this.placed.find((p) => p.id === action.toolId);
        if (t) t.angle = action.fromAngle;
        break;
      }
    }
    this.updateHud();
  }

  private clearInk() {
    if (!isEditing(this.mode)) return;
    if (!this.strokes.length) return;
    this.strokes = [];
    this.inkUsed = 0;
    this.undoStack = this.undoStack.filter((a) => a.type !== "stroke");
    this.updateHud();
  }

  private rotateSelected(dir: number) {
    if (!isEditing(this.mode) || !this.selectedPlacedId) return;
    const obj = this.placed.find((p) => p.id === this.selectedPlacedId);
    if (!obj) return;
    const fromAngle = obj.angle;
    obj.angle += (dir * Math.PI) / 12;
    this.pushUndo({ type: "rotate", toolId: obj.id, fromAngle, toAngle: obj.angle });
  }

  private deleteSelected() {
    if (!isEditing(this.mode) || !this.selectedPlacedId) return;
    const idx = this.placed.findIndex((p) => p.id === this.selectedPlacedId);
    if (idx < 0) return;
    const [obj] = this.placed.splice(idx, 1);
    const kind = obj.type as ToolKind;
    if (kind in TOOL_META) this.remainingTools[kind] = (this.remainingTools[kind] ?? 0) + 1;
    this.pushUndo({ type: "delete", tool: { ...obj } });
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
      mode: this.mode === "map" ? "ready" : this.mode,
      selectedTool: this.selectedTool,
      levelTools: this.level.tools,
      remaining: this.remainingTools,
      onSelect: (tool) => {
        this.selectedTool = tool;
        this.selectedPlacedId = null;
        this.audio.play("tap");
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

  private onPointerDown = (e: PointerEvent) => {
    if (!isEditing(this.mode)) return;
    void this.audio.unlock();
    const p = worldFromClient(this.canvas, e.clientX, e.clientY, this.view);
    this.canvas.setPointerCapture(e.pointerId);

    // Always allow selecting / moving placed tools
    const hit = hitTestTool(this.placed, p);
    if (hit) {
      this.selectedPlacedId = hit.id;
      this.selectedTool = "draw";
      this.draggingToolId = hit.id;
      this.dragOffset = { x: p.x - hit.x, y: p.y - hit.y };
      this.dragFrom = { x: hit.x, y: hit.y };
      this.refreshTray();
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
    const obj = createPlacedTool(kind, p);
    this.placed.push(obj);
    this.remainingTools[kind] = left - 1;
    this.selectedPlacedId = obj.id;
    this.pushUndo({ type: "place", toolId: obj.id, kind });
    this.refreshTray();
  };

  private onPointerMove = (e: PointerEvent) => {
    if (this.draggingToolId && isEditing(this.mode)) {
      const p = worldFromClient(this.canvas, e.clientX, e.clientY, this.view);
      const t = this.placed.find((x) => x.id === this.draggingToolId);
      if (t) {
        t.x = p.x - this.dragOffset.x;
        t.y = p.y - this.dragOffset.y;
      }
      return;
    }
    if (!this.drawing || !this.draft) return;
    const p = worldFromClient(this.canvas, e.clientX, e.clientY, this.view);
    const result = appendDraftPoint(
      this.draft,
      p,
      this.inkUsed,
      this.level.inkLimit * TWEAKS.inkBudgetScale,
    );
    if (result.reason) this.showToast(result.reason);
  };

  private onPointerUp = () => {
    if (this.draggingToolId) {
      const t = this.placed.find((x) => x.id === this.draggingToolId);
      if (t && this.dragFrom) {
        const moved = Math.hypot(t.x - this.dragFrom.x, t.y - this.dragFrom.y) > 4;
        if (moved) {
          this.pushUndo({
            type: "move",
            toolId: t.id,
            from: this.dragFrom,
            to: { x: t.x, y: t.y },
          });
        }
      }
      this.draggingToolId = null;
      this.dragFrom = null;
      return;
    }
    if (!this.drawing || !this.draft) {
      this.drawing = false;
      return;
    }
    this.drawing = false;
    const before = this.inkUsed;
    this.inkUsed += commitStroke(this.strokes, this.draft);
    const delta = this.inkUsed - before;
    if (delta > 0) {
      this.pushUndo({ type: "stroke", inkDelta: delta });
      this.advanceTutorial("draw");
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
    const dt = this.paused ? 0 : Math.min(0.033, Math.max(0, (ts - this.lastTs) / 1000));
    this.lastTs = ts;
    this.clock += dt;
    this.fx.update(dt);

    if (this.clock > this.toastUntil) this.els.toast.hidden = true;

    if (this.pendingFail && this.clock >= this.failAt) {
      this.fail();
    }

    if (this.mode === "laying" && !this.paused) {
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
    } else if (this.mode === "running" && !this.paused && !this.pendingFail) {
      this.elapsed += dt;
      if (this.elapsed > this.level.timeLimit) {
        this.failMessageText = failMessage("timeout");
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
    } else if (isSimulating(this.mode) && this.pendingFail && !this.paused) {
      this.physics.step(dt * 1000);
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
      nestGlow: this.clock < this.nestGlowUntil,
    });

    this.raf = requestAnimationFrame(this.tick);
  };
}
