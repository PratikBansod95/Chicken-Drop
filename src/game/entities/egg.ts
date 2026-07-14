import { EGG_RADIUS } from "../types";

export function drawEgg(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  nested: boolean,
  broken: boolean,
  squash = 1,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(1 / Math.sqrt(squash), squash);
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
