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

const FILE_MAP: Record<Sfx, string> = {
  tap: "/assets/audio/ui_tap.wav",
  lay: "/assets/audio/lay.wav",
  plop: "/assets/audio/plop.wav",
  bounce: "/assets/audio/bounce.wav",
  crack: "/assets/audio/crack.wav",
  star: "/assets/audio/star.wav",
  win: "/assets/audio/win.wav",
  fail: "/assets/audio/fail.wav",
  cluck: "/assets/audio/cluck.wav",
};

/** Web Audio SFX with optional WAV files; procedural fallback always available. */
export class AudioBus {
  private ctx: AudioContext | null = null;
  private muted = false;
  private unlocked = false;
  private musicTimer: number | null = null;
  private musicOn = false;
  private buffers = new Map<Sfx, AudioBuffer>();
  private musicBuf: AudioBuffer | null = null;
  private musicSrc: AudioBufferSourceNode | null = null;

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) this.stopMusic();
    else if (this.unlocked && this.musicOn) this.startMusic();
  }

  async unlock() {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.unlocked = true;
    if (!this.buffers.size) void this.preloadFiles();
  }

  private async preloadFiles() {
    if (!this.ctx) return;
    await Promise.all(
      (Object.keys(FILE_MAP) as Sfx[]).map(async (key) => {
        try {
          const res = await fetch(FILE_MAP[key]);
          if (!res.ok) return;
          const ab = await res.arrayBuffer();
          const buf = await this.ctx!.decodeAudioData(ab.slice(0));
          this.buffers.set(key, buf);
        } catch {
          /* procedural fallback */
        }
      }),
    );
    try {
      const res = await fetch("/assets/audio/music_loop.wav");
      if (res.ok) {
        const ab = await res.arrayBuffer();
        this.musicBuf = await this.ctx.decodeAudioData(ab.slice(0));
      }
    } catch {
      /* ignore */
    }
  }

  async enableMusic() {
    this.musicOn = true;
    await this.unlock();
    if (!this.muted) this.startMusic();
  }

  play(kind: Sfx) {
    if (this.muted || !this.unlocked || !this.ctx) return;
    const file = this.buffers.get(kind);
    if (file) {
      const src = this.ctx.createBufferSource();
      const g = this.ctx.createGain();
      g.gain.value = 0.7;
      src.buffer = file;
      src.connect(g).connect(this.ctx.destination);
      src.start();
      return;
    }
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
    if (!this.ctx || this.muted) return;
    const prefs = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefs) return;

    if (this.musicBuf) {
      this.stopMusic();
      const src = this.ctx.createBufferSource();
      const g = this.ctx.createGain();
      g.gain.value = TWEAKS.musicVolume;
      src.buffer = this.musicBuf;
      src.loop = true;
      src.connect(g).connect(this.ctx.destination);
      src.start();
      this.musicSrc = src;
      return;
    }

    if (this.musicTimer != null) return;
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
    if (this.musicSrc) {
      try {
        this.musicSrc.stop();
      } catch {
        /* already stopped */
      }
      this.musicSrc = null;
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
