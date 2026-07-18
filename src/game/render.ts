import { WORLD } from "./types";
import type { LevelData, Vec2 } from "./types";
import type { InkStroke, PlacedTool, PhysicsWorld } from "./physics";
import { drawChicken } from "./entities/chicken";
import { drawEgg } from "./entities/egg";
import { drawBasket } from "./entities/basket";
import { drawStar } from "./entities/star";
import { drawTool } from "./entities/tools";
import { drawHazard } from "./entities/hazards";
import { drawBackdrop } from "./world/backdrop";
import type { CameraFx } from "./systems/cameraFx";

/** Reserve bottom margin so dock never covers the nest playfield. */
const DOCK_SAFE_PX = 118;

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
  const playH = Math.max(120, h - DOCK_SAFE_PX);
  return { w, h, scale: Math.min(w / WORLD.width, playH / WORLD.height), playH };
}

export function worldFromClient(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
  view: { w: number; h: number; scale: number; playH?: number },
): Vec2 {
  const rect = canvas.getBoundingClientRect();
  const playH = view.playH ?? view.h;
  const sx = (clientX - rect.left - (view.w - WORLD.width * view.scale) / 2) / view.scale;
  const sy = (clientY - rect.top - (playH - WORLD.height * view.scale) / 2) / view.scale;
  return { x: sx, y: sy };
}

function drawInk(ctx: CanvasRenderingContext2D, strokes: InkStroke[], draft?: Vec2[]) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const all = draft ? [...strokes, { points: draft }] : strokes;
  for (const s of all) {
    if (s.points.length < 2) continue;
    ctx.strokeStyle = "rgba(87, 58, 44, 0.92)";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
    ctx.stroke();
    ctx.strokeStyle = "#f0b84a";
    ctx.lineWidth = 6;
    ctx.stroke();
  }
}

function drawSelectionHalo(ctx: CanvasRenderingContext2D, obj: PlacedTool, time: number) {
  ctx.save();
  ctx.translate(obj.x, obj.y);
  ctx.rotate(obj.angle);
  const pulse = 1 + Math.sin(time * 5) * 0.04;
  ctx.strokeStyle = "rgba(240, 184, 74, 0.95)";
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 6]);
  ctx.strokeRect((-obj.w / 2 - 8) * pulse, (-obj.h / 2 - 8) * pulse, (obj.w + 16) * pulse, (obj.h + 16) * pulse);
  ctx.restore();
}

function drawNestGlow(ctx: CanvasRenderingContext2D, basket: Vec2, time: number) {
  const a = 0.25 + Math.sin(time * 6) * 0.1;
  ctx.save();
  ctx.translate(basket.x, basket.y + 10);
  const g = ctx.createRadialGradient(0, 0, 20, 0, 0, 160);
  g.addColorStop(0, `rgba(255, 220, 120, ${a})`);
  g.addColorStop(1, "rgba(255, 220, 120, 0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, 150, 55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFanWind(
  ctx: CanvasRenderingContext2D,
  level: LevelData,
  placed: PlacedTool[],
  time: number,
  reduceMotion: boolean,
) {
  if (reduceMotion) return;
  const fans = [...level.fixedObjects, ...placed].filter((o) => o.type === "fan");
  for (const fan of fans) {
    for (let i = 0; i < 5; i++) {
      const along = ((time * 80 + i * 36) % 160) + 20;
      const side = Math.sin(time * 3 + i) * 14;
      const x = fan.x + Math.cos(fan.angle) * along - Math.sin(fan.angle) * side;
      const y = fan.y + Math.sin(fan.angle) * along + Math.cos(fan.angle) * side;
      ctx.fillStyle = `rgba(180, 230, 255, ${0.35 - i * 0.05})`;
      ctx.beginPath();
      ctx.ellipse(x, y, 10, 3, fan.angle, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function renderFrame(opts: {
  canvas: HTMLCanvasElement;
  view: { w: number; h: number; scale: number; playH?: number };
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
  selectedPlacedId?: string | null;
  nestGlow?: boolean;
}) {
  const { canvas, view, level, physics, strokes, draft, placed, chickenPhase, time, fx } = opts;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, view.w, view.h);
  const shake = fx.offset();
  const playH = view.playH ?? view.h;
  ctx.save();
  ctx.translate(
    (view.w - WORLD.width * view.scale) / 2 + shake.x,
    (playH - WORLD.height * view.scale) / 2 + shake.y,
  );
  ctx.scale(view.scale, view.scale);

  drawBackdrop(ctx);
  if (opts.nestGlow && !opts.reduceMotion) drawNestGlow(ctx, level.basket, time);
  drawBasket(ctx, level.basket);

  for (const star of level.stars) {
    if (star.collected) continue;
    const pulse = opts.reduceMotion ? 1 : 1 + Math.sin(time * 4 + star.x * 0.01) * 0.06;
    drawStar(ctx, star.x, star.y, pulse);
  }

  for (const obj of level.fixedObjects) {
    drawTool(ctx, obj);
    drawHazard(ctx, obj);
  }
  for (const obj of placed) {
    drawTool(ctx, obj);
    drawHazard(ctx, obj);
    if (opts.selectedPlacedId === obj.id) drawSelectionHalo(ctx, obj, time);
  }
  drawFanWind(ctx, level, placed, time, opts.reduceMotion);
  drawInk(ctx, strokes, draft ?? undefined);
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

  fx.draw(ctx);
  ctx.restore();
}
