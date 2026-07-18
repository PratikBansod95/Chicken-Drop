import { WORLD } from "./types";
import type { LevelData, Vec2 } from "./types";
import type { InkStroke, PlacedTool, PhysicsWorld } from "./physics";
import { EGG_SPEC, INK_SPEC } from "./config/geometry";
import { drawChicken } from "./entities/chicken";
import { drawEgg } from "./entities/egg";
import { drawNestBack, drawNestFront } from "./entities/nest";
import { drawStar } from "./entities/star";
import { drawTool } from "./entities/tools";
import { drawHazard } from "./entities/hazards";
import { drawBackdrop } from "./world/backdrop";
import type { CameraFx } from "./systems/cameraFx";

export interface ViewState {
  w: number;
  h: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function resizeCanvas(canvas: HTMLCanvasElement) {
  const parent = canvas.closest(".stage") as HTMLElement | null ?? canvas.parentElement!;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = parent.clientWidth;
  const h = parent.clientHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const gameRoot = canvas.closest(".egg-game");
  const rootRect = gameRoot?.getBoundingClientRect();
  const hudRect = gameRoot?.querySelector(".hud")?.getBoundingClientRect();
  const dockRect = gameRoot?.querySelector(".bottom-dock")?.getBoundingClientRect();
  const topUi = rootRect && hudRect ? Math.max(0, hudRect.bottom - rootRect.top + 8) : 112;
  const bottomUi =
    rootRect && dockRect ? Math.max(0, rootRect.bottom - dockRect.top + 8) : 146;
  const playHeight = Math.max(320, h - topUi - bottomUi);
  const scale = Math.min(w / WORLD.width, playHeight / WORLD.height);
  return {
    w,
    h,
    scale,
    offsetX: (w - WORLD.width * scale) / 2,
    offsetY: topUi + (playHeight - WORLD.height * scale) / 2,
  } satisfies ViewState;
}

export function worldFromClient(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
  view: ViewState,
): Vec2 | null {
  const rect = canvas.getBoundingClientRect();
  const sx = (clientX - rect.left - view.offsetX) / view.scale;
  const sy = (clientY - rect.top - view.offsetY) / view.scale;
  if (sx < 0 || sx > WORLD.width || sy < 0 || sy > WORLD.height) return null;
  return { x: sx, y: sy };
}

function drawInk(ctx: CanvasRenderingContext2D, strokes: InkStroke[], draft?: Vec2[]) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const all = draft ? [...strokes, { points: draft }] : strokes;
  for (const s of all) {
    if (s.points.length < 2) continue;
    ctx.strokeStyle = "rgba(87, 58, 44, 0.92)";
    ctx.lineWidth = INK_SPEC.outerStroke;
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
    ctx.stroke();
    ctx.strokeStyle = "#f0b84a";
    ctx.lineWidth = INK_SPEC.innerStroke;
    ctx.stroke();
  }
}

function drawSelection(ctx: CanvasRenderingContext2D, tool: PlacedTool, time: number) {
  ctx.save();
  ctx.translate(tool.x, tool.y);
  ctx.rotate(tool.angle);
  const pulse = 1 + Math.sin(time * 5) * 0.035;
  ctx.strokeStyle = "rgba(255, 210, 86, 0.95)";
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 7]);
  ctx.strokeRect(
    (-tool.w / 2 - 9) * pulse,
    (-tool.h / 2 - 9) * pulse,
    (tool.w + 18) * pulse,
    (tool.h + 18) * pulse,
  );
  ctx.restore();
}

function drawNestGlow(
  ctx: CanvasRenderingContext2D,
  position: Vec2,
  strength: number,
  time: number,
  reduceMotion: boolean,
) {
  if (strength <= 0) return;
  const pulse = reduceMotion ? 1 : 0.92 + Math.sin(time * 5) * 0.08;
  const glow = ctx.createRadialGradient(
    position.x,
    position.y,
    24,
    position.x,
    position.y,
    190 * pulse,
  );
  glow.addColorStop(0, `rgba(255, 223, 110, ${0.2 + strength * 0.12})`);
  glow.addColorStop(1, "rgba(255, 223, 110, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(position.x, position.y + 12, 190 * pulse, 92 * pulse, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawWind(
  ctx: CanvasRenderingContext2D,
  level: LevelData,
  placed: PlacedTool[],
  time: number,
  reduceMotion: boolean,
) {
  if (reduceMotion) return;
  for (const fan of [...level.fixedObjects, ...placed].filter((object) => object.type === "fan")) {
    for (let index = 0; index < 5; index++) {
      const distance = 30 + ((time * 95 + index * 46) % 220);
      const drift = Math.sin(time * 3 + index * 1.7) * 13;
      const x = fan.x + Math.cos(fan.angle) * distance - Math.sin(fan.angle) * drift;
      const y = fan.y + Math.sin(fan.angle) * distance + Math.cos(fan.angle) * drift;
      ctx.strokeStyle = `rgba(220, 247, 255, ${0.34 - index * 0.045})`;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(fan.angle) * 22, y + Math.sin(fan.angle) * 22);
      ctx.stroke();
    }
  }
}

export function renderFrame(opts: {
  canvas: HTMLCanvasElement;
  view: ViewState;
  level: LevelData;
  physics: PhysicsWorld;
  strokes: InkStroke[];
  draft: Vec2[] | null;
  placed: PlacedTool[];
  chickenPhase: "idle" | "lay";
  time: number;
  crackedPositions: Vec2[];
  fx: CameraFx;
  reduceMotion: boolean;
  selectedPlacedId: string | null;
  showBuildZones?: boolean;
  invalidSpawn?: boolean;
}) {
  const { canvas, view, level, physics, strokes, draft, placed, chickenPhase, time, fx } = opts;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, view.w, view.h);
  const surround = ctx.createLinearGradient(0, 0, 0, view.h);
  surround.addColorStop(0, "#83cddd");
  surround.addColorStop(0.55, "#dce7ba");
  surround.addColorStop(1, "#d4b66c");
  ctx.fillStyle = surround;
  ctx.fillRect(0, 0, view.w, view.h);
  const shake = fx.offset();
  ctx.save();
  ctx.translate(view.offsetX + shake.x, view.offsetY + shake.y);
  ctx.scale(view.scale, view.scale);

  drawBackdrop(ctx);
  const nestProgress = physics.eggs.filter(
    (egg) => !egg.broken && egg.nestState !== "outside",
  ).length;
  drawNestGlow(
    ctx,
    level.basket,
    Math.min(1, nestProgress / Math.max(1, level.eggCount)),
    time,
    opts.reduceMotion,
  );
  drawNestBack(ctx, level.basket);

  for (const star of level.stars) {
    if (star.collected) continue;
    const pulse = opts.reduceMotion ? 1 : 1 + Math.sin(time * 4 + star.x * 0.01) * 0.06;
    drawStar(ctx, star.x, star.y, pulse);
  }

  for (const obj of level.fixedObjects) {
    const body = obj.bodyIds?.[0] != null ? physics.getBodyById(obj.bodyIds[0]) : null;
    const rendered = body ? { ...obj, angle: body.angle } : obj;
    drawTool(ctx, rendered);
    drawHazard(ctx, rendered, time);
  }
  for (const obj of placed) {
    const body = obj.bodyIds[0] != null ? physics.getBodyById(obj.bodyIds[0]) : null;
    const rendered = body ? { ...obj, angle: body.angle } : obj;
    drawTool(ctx, rendered);
    drawHazard(ctx, rendered, time);
    if (opts.selectedPlacedId === obj.id) drawSelection(ctx, obj, time);
  }
  drawWind(ctx, level, placed, time, opts.reduceMotion);
  drawInk(ctx, strokes, draft ?? undefined);
  if (opts.showBuildZones) {
    const spawn = {
      x: level.start.x + EGG_SPEC.spawnOffset.x,
      y: level.start.y + EGG_SPEC.spawnOffset.y,
    };
    ctx.save();
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = opts.invalidSpawn ? 6 : 3;
    ctx.strokeStyle = opts.invalidSpawn ? "#d33b32" : "rgba(45, 82, 112, 0.38)";
    ctx.fillStyle = opts.invalidSpawn ? "rgba(225, 60, 48, 0.16)" : "rgba(255, 255, 255, 0.08)";
    ctx.beginPath();
    ctx.arc(spawn.x, spawn.y, EGG_SPEC.spawnClearance + 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  drawChicken(ctx, level.start, chickenPhase, time, opts.reduceMotion);

  for (const egg of physics.eggs) {
    if (egg.broken) continue;
    const body = physics.getEggBody(egg);
    if (!body) continue;
    const speed = Math.hypot(body.velocity.x, body.velocity.y);
    const squash = opts.reduceMotion ? 1 : 1 + Math.min(0.18, speed * 0.02);
    drawEgg(ctx, body.position.x, body.position.y, body.angle, egg.nested, false, squash);
  }
  for (const p of opts.crackedPositions) drawEgg(ctx, p.x, p.y, 0, false, true);
  drawNestFront(ctx, level.basket);

  fx.draw(ctx);
  ctx.restore();
}
