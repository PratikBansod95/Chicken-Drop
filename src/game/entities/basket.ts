import type { Vec2 } from "../types";

export function drawBasket(ctx: CanvasRenderingContext2D, pos: Vec2) {
  ctx.save();
  ctx.translate(pos.x, pos.y);
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
  ctx.strokeStyle = "#e0a45a";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(0, 2, 62, 16, 0, Math.PI * 1.05, Math.PI * 1.95);
  ctx.stroke();
  ctx.restore();
}
