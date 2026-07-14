import { assets } from "../assets/bank";

export function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, pulse = 1) {
  const img = assets.get("star");
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pulse, pulse);
  if (img) {
    const s = 54;
    ctx.drawImage(img, -s / 2, -s / 2, s, s);
  } else {
    ctx.fillStyle = "#ffbf42";
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      const r = i % 2 === 0 ? 16 : 7;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
