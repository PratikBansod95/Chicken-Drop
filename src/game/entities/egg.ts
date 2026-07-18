import { assets } from "../assets/bank";
import { EGG_SPEC } from "../config/geometry";

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
    ctx.ellipse(0, EGG_SPEC.radius * 0.88, EGG_SPEC.radius * 0.72, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (broken) {
    const cracked = assets.get("eggCracked");
    if (cracked) {
      ctx.drawImage(cracked, -34, -34, 68, 68);
    } else {
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
    }
  } else {
    const img = assets.get("egg");
    if (img) {
      ctx.drawImage(
        img,
        -EGG_SPEC.renderWidth / 2,
        -EGG_SPEC.renderHeight / 2,
        EGG_SPEC.renderWidth,
        EGG_SPEC.renderHeight,
      );
      if (nested) {
        ctx.fillStyle = "rgba(255, 206, 85, 0.12)";
        ctx.beginPath();
        ctx.ellipse(0, 1, EGG_SPEC.radius * 0.88, EGG_SPEC.radius, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      const g = ctx.createRadialGradient(-7, -10, 3, 0, 2, EGG_SPEC.radius + 6);
      g.addColorStop(0, "#fffdf6");
      g.addColorStop(0.55, nested ? "#ffe9b0" : "#f7e8c8");
      g.addColorStop(1, nested ? "#f0c96a" : "#e6cfa0");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, EGG_SPEC.radius * 0.86, EGG_SPEC.radius, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(160, 120, 70, 0.55)";
      ctx.lineWidth = 2.4;
      ctx.stroke();
    }
  }
  ctx.restore();
}
