import { EGG_RADIUS, WORLD } from "./types";
import type { LevelData, Vec2 } from "./types";
import type { InkStroke, PlacedTool, PhysicsWorld } from "./physics";
import type { FixedObject } from "./types";

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

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
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

function drawChicken(
  ctx: CanvasRenderingContext2D,
  pos: Vec2,
  phase: "idle" | "lay",
  t: number,
) {
  const bob = phase === "lay" ? Math.sin(t * 12) * 4 : Math.sin(t * 3) * 2;
  ctx.save();
  ctx.translate(pos.x, pos.y + bob);

  // body
  ctx.fillStyle = "#f4f1ea";
  ctx.beginPath();
  ctx.ellipse(0, 8, 38, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2b3a59";
  ctx.lineWidth = 3;
  ctx.stroke();

  // wing
  ctx.fillStyle = "#e8e0d4";
  ctx.beginPath();
  ctx.ellipse(-18, 10, 16, 12, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // head
  ctx.fillStyle = "#fff8f0";
  ctx.beginPath();
  ctx.ellipse(28, -10, 20, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // comb
  ctx.fillStyle = "#e85d5d";
  ctx.beginPath();
  ctx.ellipse(24, -28, 7, 8, 0, 0, Math.PI * 2);
  ctx.ellipse(34, -30, 7, 9, 0, 0, Math.PI * 2);
  ctx.ellipse(42, -24, 6, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // beak
  ctx.fillStyle = "#f0a04b";
  ctx.beginPath();
  ctx.moveTo(46, -8);
  ctx.lineTo(62, -4);
  ctx.lineTo(46, 0);
  ctx.closePath();
  ctx.fill();

  // eye
  ctx.fillStyle = "#21304a";
  ctx.beginPath();
  ctx.arc(36, -12, 3.2, 0, Math.PI * 2);
  ctx.fill();

  // legs
  ctx.strokeStyle = "#e2a04a";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-8, 34);
  ctx.lineTo(-8, 48);
  ctx.moveTo(10, 34);
  ctx.lineTo(10, 48);
  ctx.stroke();

  if (phase === "lay") {
    ctx.fillStyle = "#ffe8a3";
    ctx.beginPath();
    ctx.ellipse(-6, 36, 10, 12, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawEgg(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  nested: boolean,
  broken: boolean,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  if (broken) {
    ctx.fillStyle = "#f3e6c8";
    ctx.strokeStyle = "#8a6a3a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-14, -6);
    ctx.lineTo(-4, 16);
    ctx.lineTo(-18, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(6, -10);
    ctx.lineTo(18, 12);
    ctx.lineTo(2, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f6d96a88";
    ctx.beginPath();
    ctx.arc(0, 8, 8, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const g = ctx.createRadialGradient(-6, -8, 4, 0, 0, EGG_RADIUS + 4);
    g.addColorStop(0, "#fffaf0");
    g.addColorStop(1, nested ? "#ffe4a3" : "#f5e6c8");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, EGG_RADIUS * 0.82, EGG_RADIUS, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#c9a66b";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = "#ffffffaa";
    ctx.beginPath();
    ctx.ellipse(-6, -8, 5, 7, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBasket(ctx: CanvasRenderingContext2D, pos: Vec2) {
  ctx.save();
  ctx.translate(pos.x, pos.y);
  // nest
  ctx.fillStyle = "#c4843a";
  ctx.beginPath();
  ctx.ellipse(0, 18, 68, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#a66a2d";
  ctx.beginPath();
  ctx.ellipse(0, 10, 58, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#7a4a1c";
  ctx.lineWidth = 3;
  for (let i = -50; i <= 50; i += 14) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.quadraticCurveTo(i + 8, 22, i + 4, 36);
    ctx.stroke();
  }
  // rim highlights
  ctx.strokeStyle = "#e0a45a";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(0, 2, 62, 16, 0, Math.PI * 1.05, Math.PI * 1.95);
  ctx.stroke();
  ctx.restore();
}

function drawProp(ctx: CanvasRenderingContext2D, obj: FixedObject | PlacedTool) {
  ctx.save();
  ctx.translate(obj.x, obj.y);
  ctx.rotate(obj.angle);
  const colors: Record<string, string> = {
    spring: "#6bcf7f",
    pad: "#7ec8ff",
    fan: "#9be7ff",
    conveyor: "#c9a66b",
    sticky: "#d4a5ff",
    spike: "#8b7355",
    fire: "#ff7a3c",
    pan: "#6b7280",
  };
  ctx.fillStyle = colors[obj.type] ?? "#999";
  ctx.strokeStyle = "#21304a88";
  ctx.lineWidth = 3;

  if (obj.type === "fire") {
    ctx.beginPath();
    ctx.moveTo(0, obj.h / 2);
    ctx.quadraticCurveTo(-obj.w / 2, 0, -10, -obj.h / 2);
    ctx.quadraticCurveTo(0, -obj.h / 4, 10, -obj.h / 2);
    ctx.quadraticCurveTo(obj.w / 2, 0, 0, obj.h / 2);
    ctx.fill();
    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.moveTo(0, obj.h / 3);
    ctx.quadraticCurveTo(-16, 0, 0, -obj.h / 4);
    ctx.quadraticCurveTo(16, 0, 0, obj.h / 3);
    ctx.fill();
  } else if (obj.type === "spike") {
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 22 - 10, obj.h / 3);
      ctx.lineTo(i * 22, -obj.h / 2);
      ctx.lineTo(i * 22 + 10, obj.h / 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (obj.type === "spring") {
    ctx.strokeStyle = "#2f8f4e";
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const y = -obj.h / 2 + 10 + i * 14;
      ctx.moveTo(-obj.w / 3, y);
      ctx.lineTo(obj.w / 3, y + 7);
    }
    ctx.stroke();
    roundRect(ctx, -obj.w / 3, obj.h / 3 - 6, (obj.w * 2) / 3, 14, 6);
    ctx.fill();
  } else if (obj.type === "fan") {
    roundRect(ctx, -obj.w / 2, -obj.h / 2, obj.w, obj.h, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#21304a";
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#21304a";
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * 28, Math.sin(a) * 28);
      ctx.stroke();
    }
  } else {
    roundRect(ctx, -obj.w / 2, -obj.h / 2, obj.w, obj.h * 0.7, 10);
    ctx.fill();
    ctx.stroke();
    if (obj.type === "conveyor") {
      ctx.fillStyle = "#21304a55";
      for (let i = -obj.w / 2 + 12; i < obj.w / 2; i += 22) {
        ctx.fillRect(i, -8, 10, 16);
      }
    }
  }
  ctx.restore();
}

function drawInk(ctx: CanvasRenderingContext2D, strokes: InkStroke[], draft?: Vec2[]) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#574032";
  ctx.lineWidth = 10;
  const all = draft ? [...strokes, { points: draft }] : strokes;
  for (const s of all) {
    if (s.points.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
    ctx.stroke();
    ctx.strokeStyle = "#e9a744";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.strokeStyle = "#574032";
    ctx.lineWidth = 10;
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
}) {
  const { canvas, view, level, physics, strokes, draft, placed, chickenPhase, time } = opts;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, view.w, view.h);
  ctx.save();
  ctx.translate((view.w - WORLD.width * view.scale) / 2, (view.h - WORLD.height * view.scale) / 2);
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

  for (const obj of level.fixedObjects) drawProp(ctx, obj);
  for (const obj of placed) drawProp(ctx, obj);
  drawInk(ctx, strokes, draft ?? undefined);
  drawChicken(ctx, level.start, chickenPhase, time);

  for (const egg of physics.eggs) {
    if (egg.broken) continue;
    const body = physics.getEggBody(egg);
    if (!body) continue;
    drawEgg(ctx, body.position.x, body.position.y, body.angle, egg.nested, false);
  }
  for (const p of opts.crackedPositions) drawEgg(ctx, p.x, p.y, 0, false, true);

  ctx.restore();
}
