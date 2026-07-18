import type { FixedObject, PlacedTool } from "../types";
import { assets } from "../assets/bank";

export function drawHazard(
  ctx: CanvasRenderingContext2D,
  obj: FixedObject | PlacedTool,
  time = 0,
) {
  if (!["spike", "fire", "pan"].includes(obj.type)) return;
  ctx.save();
  ctx.translate(obj.x, obj.y);
  ctx.rotate(obj.angle);
  ctx.strokeStyle = "#21304a88";
  ctx.lineWidth = 3;

  if (obj.type === "spike") {
    const sprite = assets.get("spike");
    if (sprite) {
      ctx.drawImage(sprite, -obj.w / 2, -obj.h / 2, obj.w, obj.h);
      ctx.restore();
      return;
    }
  }

  if (obj.type === "fire") {
    const flicker = Math.sin(time * 12 + obj.x * 0.03);
    const glow = ctx.createRadialGradient(0, -5, 4, 0, -5, obj.w * 0.58);
    glow.addColorStop(0, "rgba(255, 217, 91, 0.52)");
    glow.addColorStop(0.48, "rgba(255, 108, 34, 0.22)");
    glow.addColorStop(1, "rgba(255, 87, 20, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -5, obj.w * 0.58, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = "rgba(255, 78, 20, 0.55)";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#ff542f";
    ctx.beginPath();
    ctx.moveTo(-31, 20);
    ctx.bezierCurveTo(-43, -2, -22, -14, -17, -39 - flicker * 4);
    ctx.bezierCurveTo(-4, -29, -8, -15, 1, -8);
    ctx.bezierCurveTo(10, -22, 16, -29, 19, -43 + flicker * 3);
    ctx.bezierCurveTo(39, -17, 43, 3, 30, 20);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ff9f1c";
    ctx.beginPath();
    ctx.moveTo(-20, 20);
    ctx.bezierCurveTo(-25, 3, -8, -7, -5, -25 + flicker * 2);
    ctx.bezierCurveTo(9, -14, 3, -3, 14, 1);
    ctx.bezierCurveTo(24, 7, 23, 15, 19, 20);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#fff1a8";
    ctx.beginPath();
    ctx.moveTo(-8, 20);
    ctx.quadraticCurveTo(-11, 5, 2, -9 - flicker * 2);
    ctx.quadraticCurveTo(15, 6, 10, 20);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    const metal = ctx.createLinearGradient(0, 15, 0, 43);
    metal.addColorStop(0, "#707b8d");
    metal.addColorStop(0.48, "#303846");
    metal.addColorStop(1, "#171d27");
    ctx.fillStyle = "rgba(35, 31, 28, 0.24)";
    ctx.beginPath();
    ctx.ellipse(0, 43, 47, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = metal;
    ctx.beginPath();
    ctx.moveTo(-43, 18);
    ctx.quadraticCurveTo(-37, 42, -26, 43);
    ctx.lineTo(26, 43);
    ctx.quadraticCurveTo(37, 42, 43, 18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#141a23";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#222936";
    ctx.beginPath();
    ctx.ellipse(0, 18, 44, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ff6b24";
    for (const x of [-22, -7, 10, 25]) {
      ctx.beginPath();
      ctx.arc(x, 17 + Math.sin(time * 7 + x) * 1.5, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (obj.type === "spike") {
    ctx.fillStyle = "#8b7355";
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 22 - 10, obj.h / 3);
      ctx.lineTo(i * 22, -obj.h / 2);
      ctx.lineTo(i * 22 + 10, obj.h / 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = "#6b7280";
    ctx.beginPath();
    ctx.roundRect(-obj.w / 2, -obj.h / 3, obj.w, obj.h * 0.55, 10);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
