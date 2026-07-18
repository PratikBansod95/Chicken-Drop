import type { GameMode } from "../types";

export function isEditing(mode: GameMode): boolean {
  return mode === "ready";
}

export function isSimulating(mode: GameMode): boolean {
  return mode === "laying" || mode === "running";
}

export function isTerminal(mode: GameMode): boolean {
  return mode === "won" || mode === "failed";
}
