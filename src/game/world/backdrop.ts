import { WORLD } from "../types";
import { assets } from "../assets/bank";

export function drawBackdrop(ctx: CanvasRenderingContext2D) {
  const img = assets.get("backdrop");
  if (img) {
    // cover world bounds
    const scale = Math.max(WORLD.width / img.width, WORLD.height / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (WORLD.width - w) / 2, (WORLD.height - h) / 2, w, h);
    // soft vignette for playfield readability
    const g = ctx.createLinearGradient(0, 0, 0, WORLD.height);
    g.addColorStop(0, "rgba(255,255,255,0.05)");
    g.addColorStop(0.7, "rgba(255,255,255,0)");
    g.addColorStop(1, "rgba(246, 220, 150, 0.12)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    return;
  }

  const g = ctx.createLinearGradient(0, 0, 0, WORLD.height);
  g.addColorStop(0, "#9fdcf5");
  g.addColorStop(0.55, "#d9f0ff");
  g.addColorStop(1, "#f6e7b8");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  ctx.fillStyle = "#7ec86f";
  ctx.beginPath();
  ctx.moveTo(0, 960);
  ctx.quadraticCurveTo(280, 900, 520, 955);
  ctx.quadraticCurveTo(760, 1015, 1000, 930);
  ctx.lineTo(1000, WORLD.height);
  ctx.lineTo(0, WORLD.height);
  ctx.fill();
}
