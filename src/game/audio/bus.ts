import { TWEAKS } from "../tweaks";

type Sfx =
  | "tap"
  | "lay"
  | "plop"
  | "bounce"
  | "crack"
  | "star"
  | "win"
  | "fail"
  | "cluck";

/** Web Audio SFX + soft farm music loop (no external files required). */
export class AudioBus {
  private ctx: AudioContext | null = null;
  private muted = false;
  private unlocked = false;
  private musicTimer: number | null = null;
  private musicOn = false;

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) this.stopMusic();
    else if (this.unlocked && this.musicOn) this.startMusic();
  }

  async unlock() {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.unlocked = true;
  }

  async enableMusic() {
    this.musicOn = true;
    await this.unlock();
    if (!this.muted) this.startMusic();
  }

  play(kind: Sfx) {
    if (this.muted || !this.unlocked || !this.ctx) return;
    const t = this.ctx.currentTime;
    switch (kind) {
      case "tap":
        this.blip(880, 0.04, "triangle", 0.03, t);
        break;
      case "lay":
        this.blip(260, 0.08, "sine", 0.05, t);
        this.blip(320, 0.07, "sine", 0.04, t + 0.06);
        break;
      case "plop":
        this.blip(180, 0.1, "sine", 0.06, t);
        this.blip(140, 0.12, "triangle", 0.04, t + 0.05);
        break;
      case "bounce":
        this.blip(420, 0.07, "triangle", 0.04, t);
        break;
      case "crack":
        this.noise(0.18, 0.08, t);
        this.blip(90, 0.2, "sawtooth", 0.07, t);
        break;
      case "star":
        this.blip(720, 0.07, "sine", 0.05, t);
        this.blip(960, 0.1, "sine", 0.04, t + 0.07);
        break;
      case "win":
        this.blip(540, 0.1, "sine", 0.06, t);
        this.blip(720, 0.11, "sine", 0.05, t + 0.1);
        this.blip(960, 0.16, "sine", 0.05, t + 0.2);
        break;
      case "fail":
        this.blip(160, 0.22, "sawtooth", 0.07, t);
        this.blip(110, 0.28, "triangle", 0.05, t + 0.12);
        break;
      case "cluck":
        this.blip(310, 0.05, "square", 0.025, t);
        this.blip(270, 0.06, "square", 0.02, t + 0.05);
        break;
    }
  }

  private startMusic() {
    if (!this.ctx || this.musicTimer != null || this.muted) return;
    const prefs = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefs) return;

    const tick = () => {
      if (!this.ctx || this.muted || !this.musicOn) return;
      const t = this.ctx.currentTime;
      const notes = [196, 247, 294, 330, 294, 247];
      notes.forEach((f, i) => {
        this.blip(f, 0.35, "sine", TWEAKS.musicVolume * 0.35, t + i * 0.45);
      });
      this.musicTimer = window.setTimeout(tick, 2800);
    };
    tick();
  }

  private stopMusic() {
    if (this.musicTimer != null) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private blip(
    freq: number,
    dur: number,
    type: OscillatorType,
    gain: number,
    when: number,
  ) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(0.001, when);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    o.connect(g).connect(ctx.destination);
    o.start(when);
    o.stop(when + dur + 0.03);
  }

  private noise(dur: number, gain: number, when: number) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    src.buffer = buf;
    g.gain.value = gain;
    src.connect(g).connect(ctx.destination);
    src.start(when);
  }
}

export { TOOL_META } from "../types";
