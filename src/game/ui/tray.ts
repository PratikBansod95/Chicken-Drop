import { icons } from "./icons";
import { TOOL_META, type GameMode, type SelectedTool, type ToolKind } from "../types";

export function refreshTray(
  tray: HTMLElement,
  opts: {
    mode: GameMode;
    selectedTool: SelectedTool;
    levelTools: Partial<Record<ToolKind, number>>;
    remaining: Partial<Record<ToolKind, number>>;
    onSelect: (tool: SelectedTool) => void;
  },
) {
  tray.replaceChildren();

  const drawBtn = document.createElement("button");
  drawBtn.type = "button";
  drawBtn.className = `tool-card${opts.selectedTool === "draw" ? " is-selected" : ""}`;
  drawBtn.disabled = opts.mode !== "ready";
  drawBtn.innerHTML = `${icons.draw}<span class="tool-card__label">Draw</span>`;
  drawBtn.addEventListener("click", () => opts.onSelect("draw"));
  tray.append(drawBtn);

  for (const [kind, total] of Object.entries(opts.levelTools) as [ToolKind, number][]) {
    const left = opts.remaining[kind] ?? 0;
    const meta = TOOL_META[kind];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `tool-card${opts.selectedTool === kind ? " is-selected" : ""}`;
    btn.disabled = opts.mode !== "ready" || left <= 0;
    btn.innerHTML = `<span class="tool-card__swatch" style="--swatch:${meta.color}"></span>
      <span class="tool-card__label">${meta.label}</span>
      <strong class="tool-card__count">${left}/${total}</strong>`;
    btn.addEventListener("click", () => {
      if (left <= 0 || opts.mode !== "ready") return;
      opts.onSelect(kind);
    });
    tray.append(btn);
  }
}
