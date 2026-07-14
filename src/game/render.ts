import { WORLD } from "./types";
import type { LevelData, Vec2 } from "./types";
import type { InkStroke, PlacedTool, PhysicsWorld } from "./physics";
import { drawChicken } from "./entities/chicken";
import { drawEgg } from "./entities/egg";
import { drawBasket } from "./entities/basket";
import { drawTool } from "./entities/tools";
import { drawHazard } from "./entities/hazards";
import type { CameraFx } from "./systems/cameraFx";

export function resizeCanvas(canvas: HTMLCanvasElement) {
  const parent = canvas.parentElement!;
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

function drawBackdrop(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, 0, WORLD.height);
  g.addColorStop(0, "#bfeefa");
  g.addColorStop(0.55, "#d9f6ff");
  g.addColorStop(1, "#fff0c9");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  ctx.fillStyle = "#8fd48a";
  ctx.beginPath();
  ctx.moveTo(0, 980);
  ctx.quadraticCurveTo(250, 920, 500, 970);
  ctx.quadraticCurveTo(750, 1020, 1000, 950);
  ctx.lineTo(1000, WORLD.height);
  ctx.lineTo(0, WORLD.height);
  ctx.fill();

  ctx.fillStyle = "#ffffffcc";
  for (const c of [
    [160, 160, 50],
    [420, 120, 40],
    [780, 150, 55],
  ] as const) {
    ctx.beginPath();
    ctx.ellipse(c[0], c[1], c[2] * 1.6, c[2] * 0.7, 0, 0, Math.PI * 2);
    ctx.ellipse(c[0] + 30, c[1] + 8, c[2], c[2] * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawInk(ctx: CanvasRenderingContext2D, strokes: InkStroke[], draft?: Vec2[]) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const all = draft ? [...strokes, { points: draft }] : strokes;
  for (const s of all) {
    if (s.points.length < 2) continue;
    ctx.strokeStyle = "#574032";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
    ctx.stroke();
    ctx.strokeStyle = "#e9a744";
    ctx.lineWidth = 5;
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
    ctx.save();
    ctx.translate(star.x, star.y);
    ctx.fillStyle = "#ffbf42";
    ctx.strokeStyle = "#d59943";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      const r = i % 2 === 0 ? 16 : 7;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
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
