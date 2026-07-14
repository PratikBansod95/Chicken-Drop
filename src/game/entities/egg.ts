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

  // contact shadow
  if (!broken) {
    ctx.fillStyle = "rgba(60,40,20,0.16)";
    ctx.beginPath();
    ctx.ellipse(0, EGG_RADIUS * 0.85, EGG_RADIUS * 0.7, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

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
    const g = ctx.createRadialGradient(-7, -10, 3, 0, 2, EGG_RADIUS + 6);
    g.addColorStop(0, "#fffdf6");
    g.addColorStop(0.55, nested ? "#ffe9b0" : "#f7e8c8");
    g.addColorStop(1, nested ? "#f0c96a" : "#e6cfa0");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, EGG_RADIUS * 0.82, EGG_RADIUS, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(160, 120, 70, 0.55)";
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.ellipse(-6, -9, 5, 8, -0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
