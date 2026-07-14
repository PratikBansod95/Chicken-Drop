import type { Vec2 } from "../types";

export function drawChicken(
  ctx: CanvasRenderingContext2D,
  pos: Vec2,
  phase: "idle" | "lay",
  t: number,
  reduceMotion: boolean,
) {
  const bob = reduceMotion ? 0 : phase === "lay" ? Math.sin(t * 12) * 4 : Math.sin(t * 3) * 2;
  ctx.save();
  ctx.translate(pos.x, pos.y + bob);

  ctx.fillStyle = "#f4f1ea";
  ctx.beginPath();
  ctx.ellipse(0, 8, 38, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2b3a59";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#e8e0d4";
  ctx.beginPath();
  ctx.ellipse(-18, 10, 16, 12, -0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff8f0";
  ctx.beginPath();
  ctx.ellipse(28, -10, 20, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#e85d5d";
  ctx.beginPath();
  ctx.ellipse(24, -28, 7, 8, 0, 0, Math.PI * 2);
  ctx.ellipse(34, -30, 7, 9, 0, 0, Math.PI * 2);
  ctx.ellipse(42, -24, 6, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f0a04b";
  ctx.beginPath();
  ctx.moveTo(46, -8);
  ctx.lineTo(62, -4);
  ctx.lineTo(46, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#21304a";
  ctx.beginPath();
  ctx.arc(36, -12, 3.2, 0, Math.PI * 2);
  ctx.fill();

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
