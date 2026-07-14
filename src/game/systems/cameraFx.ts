import { TWEAKS } from "../tweaks";

/** Screen shake + confetti juice. */
export class CameraFx {
  shake = 0;
  private confetti: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] =
    [];
  reduceMotion = false;

  impulse(amount: number) {
    if (this.reduceMotion) return;
    this.shake = Math.min(14, this.shake + amount);
  }

  burst(x: number, y: number) {
    if (this.reduceMotion) return;
    const colors = ["#ffca66", "#ffbf42", "#6bcf7f", "#7ec8ff", "#e85d5d"];
    for (let i = 0; i < 28; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 80 + Math.random() * 160;
      this.confetti.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 60,
        life: 0.8 + Math.random() * 0.6,
        color: colors[i % colors.length],
      });
    }
  }

  update(dt: number) {
    this.shake *= TWEAKS.shakeDecay;
    if (this.shake < 0.15) this.shake = 0;
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const c = this.confetti[i];
      c.life -= dt;
      c.vy += 420 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      if (c.life <= 0) this.confetti.splice(i, 1);
    }
  }

  offset(): { x: number; y: number } {
    if (!this.shake) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * this.shake * 2,
      y: (Math.random() - 0.5) * this.shake * 2,
    };
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const c of this.confetti) {
      ctx.globalAlpha = Math.max(0, c.life);
      ctx.fillStyle = c.color;
      ctx.fillRect(c.x, c.y, 6, 6);
      ctx.globalAlpha = 1;
    }
  }
}
