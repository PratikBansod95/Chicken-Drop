import { WORLD } from "../types";
import { assets } from "../assets/bank";

export function drawBackdrop(ctx: CanvasRenderingContext2D) {
  const img = assets.get("backdrop");
  if (img) {
    // Cover the world while keeping the quiet sky centered behind gameplay.
    const scale = Math.max(WORLD.width / img.width, WORLD.height / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (WORLD.width - w) / 2, (WORLD.height - h) / 2, w, h);

    // A cool translucent wash calms the saturated photo and improves contrast.
    const wash = ctx.createLinearGradient(0, 0, 0, WORLD.height);
    wash.addColorStop(0, "rgba(225, 246, 251, 0.28)");
    wash.addColorStop(0.55, "rgba(247, 244, 218, 0.18)");
    wash.addColorStop(1, "rgba(113, 149, 87, 0.2)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    // Soft sunlight gives the scene one intentional focal point.
    const sun = ctx.createRadialGradient(790, 170, 20, 790, 170, 360);
    sun.addColorStop(0, "rgba(255, 248, 205, 0.34)");
    sun.addColorStop(0.45, "rgba(255, 239, 180, 0.12)");
    sun.addColorStop(1, "rgba(255, 239, 180, 0)");
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, WORLD.width, 620);

    // Edge vignette frames the playfield without making it feel dark.
    const vignette = ctx.createRadialGradient(
      WORLD.width / 2,
      WORLD.height * 0.46,
      WORLD.width * 0.22,
      WORLD.width / 2,
      WORLD.height * 0.5,
      WORLD.width * 0.78,
    );
    vignette.addColorStop(0, "rgba(255, 255, 255, 0)");
    vignette.addColorStop(0.72, "rgba(39, 80, 80, 0.035)");
    vignette.addColorStop(1, "rgba(31, 57, 55, 0.16)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    // A subtle foreground haze separates the dock area from active objects.
    const foreground = ctx.createLinearGradient(0, WORLD.height * 0.76, 0, WORLD.height);
    foreground.addColorStop(0, "rgba(62, 105, 65, 0)");
    foreground.addColorStop(1, "rgba(48, 77, 44, 0.2)");
    ctx.fillStyle = foreground;
    ctx.fillRect(0, WORLD.height * 0.76, WORLD.width, WORLD.height * 0.24);

    // Blend the letterboxed world into the surrounding canvas without hard seams.
    const topBlend = ctx.createLinearGradient(0, 0, 0, 110);
    topBlend.addColorStop(0, "rgba(131, 205, 221, 0.88)");
    topBlend.addColorStop(1, "rgba(131, 205, 221, 0)");
    ctx.fillStyle = topBlend;
    ctx.fillRect(0, 0, WORLD.width, 110);

    const bottomBlend = ctx.createLinearGradient(0, WORLD.height - 130, 0, WORLD.height);
    bottomBlend.addColorStop(0, "rgba(212, 182, 108, 0)");
    bottomBlend.addColorStop(1, "rgba(212, 182, 108, 0.72)");
    ctx.fillStyle = bottomBlend;
    ctx.fillRect(0, WORLD.height - 130, WORLD.width, 130);
    return;
  }

  const g = ctx.createLinearGradient(0, 0, 0, WORLD.height);
  g.addColorStop(0, "#9ddbed");
  g.addColorStop(0.52, "#dcefdc");
  g.addColorStop(1, "#e8d692");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  ctx.fillStyle = "#77b867";
  ctx.beginPath();
  ctx.moveTo(0, 960);
  ctx.quadraticCurveTo(280, 900, 520, 955);
  ctx.quadraticCurveTo(760, 1015, 1000, 930);
  ctx.lineTo(1000, WORLD.height);
  ctx.lineTo(0, WORLD.height);
  ctx.fill();
}
