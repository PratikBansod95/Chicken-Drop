import type { Vec2 } from "../types";
import { assets } from "../assets/bank";

export function drawBasket(ctx: CanvasRenderingContext2D, pos: Vec2) {
  const img = assets.get("nest");
  ctx.save();
  ctx.translate(pos.x, pos.y);
  // soft ground shadow
  ctx.fillStyle = "rgba(60, 40, 20, 0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 36, 70, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  if (img) {
    const w = 160;
    const h = 160;
    ctx.drawImage(img, -w / 2, -h / 2 + 8, w, h);
  } else {
    ctx.fillStyle = "#c4843a";
    ctx.beginPath();
    ctx.ellipse(0, 18, 68, 28, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
