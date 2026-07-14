import type { Vec2 } from "../types";
import { assets } from "../assets/bank";

/** Wide shallow nest bowl — visual matches ~5-egg collision bowl. */
export function drawBasket(ctx: CanvasRenderingContext2D, pos: Vec2) {
  const img = assets.get("nest");
  ctx.save();
  ctx.translate(pos.x, pos.y);

  // Soft contact shadow
  ctx.fillStyle = "rgba(60, 40, 20, 0.2)";
  ctx.beginPath();
  ctx.ellipse(0, 34, 128, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  if (img) {
    // Stretch sprite into a wide shallow bowl aspect
    const w = 300;
    const h = 120;
    ctx.drawImage(img, -w / 2, -h / 2 + 18, w, h);
  } else {
    // Fallback vector bowl
    ctx.fillStyle = "#b8743a";
    ctx.beginPath();
    ctx.ellipse(0, 20, 140, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8a5026";
    ctx.beginPath();
    ctx.ellipse(0, 14, 118, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#6a3c1c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 4, 132, 20, 0, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
  }

  ctx.restore();
}
