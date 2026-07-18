import type { Vec2 } from "../types";
import { assets } from "../assets/bank";

export function drawChicken(
  ctx: CanvasRenderingContext2D,
  pos: Vec2,
  phase: "idle" | "lay",
  t: number,
  reduceMotion: boolean,
) {
  const bob = reduceMotion ? 0 : phase === "lay" ? Math.sin(t * 12) * 5 : Math.sin(t * 2.4) * 2.5;
  const img = assets.get("chicken");
  ctx.save();
  ctx.translate(pos.x, pos.y + bob);
  const squish = phase === "lay" && !reduceMotion ? 1 + Math.sin(t * 14) * 0.04 : 1;
  ctx.scale(1 / Math.sqrt(squish), squish);

  if (img) {
    const w = 118;
    const h = 118;
    ctx.drawImage(img, -w * 0.42, -h * 0.62, w, h);
  } else {
    // fallback silhouette
    ctx.fillStyle = "#f7f1e6";
    ctx.beginPath();
    ctx.ellipse(0, 8, 38, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#2b3a59";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  if (phase === "lay") {
    ctx.fillStyle = "rgba(255, 232, 163, 0.95)";
    ctx.beginPath();
    ctx.ellipse(-18, 42, 11, 13, 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(180, 140, 70, 0.55)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}
