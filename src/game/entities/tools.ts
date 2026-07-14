import type { FixedObject, PlacedTool } from "../types";

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function drawTool(ctx: CanvasRenderingContext2D, obj: FixedObject | PlacedTool) {
  const colors: Record<string, string> = {
    spring: "#6bcf7f",
    pad: "#7ec8ff",
    fan: "#9be7ff",
    conveyor: "#c9a66b",
    sticky: "#d4a5ff",
  };
  if (!(obj.type in colors)) return;
  ctx.save();
  ctx.translate(obj.x, obj.y);
  ctx.rotate(obj.angle);
  ctx.fillStyle = colors[obj.type];
  ctx.strokeStyle = "#21304a88";
  ctx.lineWidth = 3;

  if (obj.type === "spring") {
    ctx.strokeStyle = "#2f8f4e";
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const y = -obj.h / 2 + 10 + i * 14;
      ctx.moveTo(-obj.w / 3, y);
      ctx.lineTo(obj.w / 3, y + 7);
    }
    ctx.stroke();
    roundRect(ctx, -obj.w / 3, obj.h / 3 - 6, (obj.w * 2) / 3, 14, 6);
    ctx.fill();
  } else if (obj.type === "fan") {
    roundRect(ctx, -obj.w / 2, -obj.h / 2, obj.w, obj.h, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#21304a";
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#21304a";
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * 28, Math.sin(a) * 28);
      ctx.stroke();
    }
  } else {
    roundRect(ctx, -obj.w / 2, -obj.h / 2, obj.w, obj.h * 0.7, 10);
    ctx.fill();
    ctx.stroke();
    if (obj.type === "conveyor") {
      ctx.fillStyle = "#21304a55";
      for (let i = -obj.w / 2 + 12; i < obj.w / 2; i += 22) ctx.fillRect(i, -8, 10, 16);
    }
  }
  ctx.restore();
}
