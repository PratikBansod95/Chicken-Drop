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
  return { w, h, scale: Math.min(w / WORLD.width, h / WORLD.height) };
}

export function worldFromClient(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
  view: { w: number; h: number; scale: number },
): Vec2 {
  const rect = canvas.getBoundingClientRect();
  const sx = (clientX - rect.left - (view.w - WORLD.width * view.scale) / 2) / view.scale;
  const sy = (clientY - rect.top - (view.h - WORLD.height * view.scale) / 2) / view.scale;
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

export function renderFrame(opts: {
  canvas: HTMLCanvasElement;
  view: { w: number; h: number; scale: number };
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
}) {
  const { canvas, view, level, physics, strokes, draft, placed, chickenPhase, time, fx } = opts;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, view.w, view.h);
  const shake = fx.offset();
  ctx.save();
  ctx.translate(
    (view.w - WORLD.width * view.scale) / 2 + shake.x,
    (view.h - WORLD.height * view.scale) / 2 + shake.y,
  );
  ctx.scale(view.scale, view.scale);

  drawBackdrop(ctx);
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
  }
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
