import { icons } from "./icons";

export function starString(n: number) {
  return "★".repeat(n) + "☆".repeat(Math.max(0, 3 - n));
}

export interface HudEls {
  level: HTMLElement;
  stars: HTMLElement;
  timer: HTMLElement;
  ink: HTMLElement;
  nest: HTMLElement;
  best: HTMLElement;
  muteBtn: HTMLElement;
  musicBtn: HTMLElement;
  motionBtn: HTMLElement;
}

export function updateHud(
  els: HudEls,
  opts: {
    levelNumber: number;
    starsCollected: number;
    timeLeft: number;
    inkPct: number;
    nested: number;
    totalEggs: number;
    best: number;
    sfxMuted: boolean;
    musicMuted: boolean;
    reduceMotion: boolean;
  },
) {
  els.level.textContent = String(opts.levelNumber);
  els.stars.textContent = starString(opts.starsCollected);
  els.timer.textContent = `${Math.floor(opts.timeLeft / 60)}:${String(opts.timeLeft % 60).padStart(2, "0")}`;
  els.ink.textContent = `Ink ${opts.inkPct}%`;
  els.nest.textContent = `Nest ${opts.nested}/${opts.totalEggs}`;
  els.best.textContent = `Best ${starString(opts.best)}`;
  els.muteBtn.innerHTML = opts.sfxMuted ? icons.mute : icons.unmute;
  els.muteBtn.setAttribute("aria-label", opts.sfxMuted ? "Enable sound effects" : "Mute sound effects");
  els.musicBtn.textContent = opts.musicMuted ? "♩" : "♫";
  els.musicBtn.setAttribute("aria-label", opts.musicMuted ? "Enable music" : "Mute music");
  els.motionBtn.classList.toggle("is-active", !opts.reduceMotion);
  els.motionBtn.setAttribute(
    "aria-label",
    opts.reduceMotion ? "Enable full motion" : "Reduce motion",
  );
}
