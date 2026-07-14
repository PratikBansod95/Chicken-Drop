import type { FixedObject, PlacedTool } from "../types";

export function drawHazard(ctx: CanvasRenderingContext2D, obj: FixedObject | PlacedTool) {
  if (!["spike", "fire", "pan"].includes(obj.type)) return;
  ctx.save();
  ctx.translate(obj.x, obj.y);
  ctx.rotate(obj.angle);
  ctx.strokeStyle = "#21304a88";
  ctx.lineWidth = 3;

  if (obj.type === "fire") {
    ctx.fillStyle = "#ff7a3c";
    ctx.beginPath();
    ctx.moveTo(0, obj.h / 2);
    ctx.quadraticCurveTo(-obj.w / 2, 0, -10, -obj.h / 2);
    ctx.quadraticCurveTo(0, -obj.h / 4, 10, -obj.h / 2);
    ctx.quadraticCurveTo(obj.w / 2, 0, 0, obj.h / 2);
    ctx.fill();
    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.moveTo(0, obj.h / 3);
    ctx.quadraticCurveTo(-16, 0, 0, -obj.h / 4);
    ctx.quadraticCurveTo(16, 0, 0, obj.h / 3);
    ctx.fill();
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
