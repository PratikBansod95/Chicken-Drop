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
  if (!["spring", "pad", "fan", "conveyor", "sticky"].includes(obj.type)) return;

  ctx.save();
  ctx.translate(obj.x, obj.y);
  ctx.rotate(obj.angle);

  ctx.fillStyle = "rgba(40,50,70,0.15)";
  roundRect(ctx, -obj.w / 2 + 3, -obj.h / 2 + 5, obj.w, obj.h * 0.7, 12);
  ctx.fill();

  if (obj.type === "spring") {
    ctx.strokeStyle = "#2f8f4e";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const y = -obj.h / 2 + 12 + i * 13;
      ctx.moveTo(-obj.w / 3, y);
      ctx.lineTo(obj.w / 3, y + 8);
    }
    ctx.stroke();
    const g = ctx.createLinearGradient(0, -obj.h / 2, 0, obj.h / 2);
    g.addColorStop(0, "#9aebab");
    g.addColorStop(1, "#3da85a");
    ctx.fillStyle = g;
    roundRect(ctx, -obj.w / 3, obj.h / 3 - 6, (obj.w * 2) / 3, 16, 8);
    ctx.fill();
  } else if (obj.type === "fan") {
    const g = ctx.createLinearGradient(0, -obj.h / 2, 0, obj.h / 2);
    g.addColorStop(0, "#d7f7ff");
    g.addColorStop(1, "#5eb4c9");
    ctx.fillStyle = g;
    roundRect(ctx, -obj.w / 2, -obj.h / 2, obj.w, obj.h, 14);
    ctx.fill();
    ctx.strokeStyle = "rgba(30,60,80,0.25)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#1e3a4a";
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1e3a4a";
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3 + 0.2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * 28, Math.sin(a) * 28);
      ctx.stroke();
    }
  } else {
    const top = obj.type === "pad" ? "#b8e2ff" : obj.type === "sticky" ? "#edc8ff" : "#efc890";
    const bot = obj.type === "pad" ? "#4e9ad0" : obj.type === "sticky" ? "#9b6bc7" : "#a87438";
    const g = ctx.createLinearGradient(0, -obj.h / 2, 0, obj.h / 2);
    g.addColorStop(0, top);
    g.addColorStop(1, bot);
    ctx.fillStyle = g;
    roundRect(ctx, -obj.w / 2, -obj.h / 2, obj.w, obj.h * 0.7, 12);
    ctx.fill();
    ctx.strokeStyle = "rgba(40,50,70,0.2)";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    if (obj.type === "conveyor") {
      ctx.fillStyle = "rgba(40,50,70,0.28)";
      for (let i = -obj.w / 2 + 12; i < obj.w / 2; i += 22) ctx.fillRect(i, -8, 10, 16);
    }
  }
  ctx.restore();
}
