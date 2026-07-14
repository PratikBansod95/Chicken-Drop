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
  drawBtn.className = `egg-tool${opts.selectedTool === "draw" ? " is-selected" : ""}`;
  drawBtn.innerHTML = `<span>✎ Draw</span><strong></strong>`;
  drawBtn.disabled = opts.mode !== "ready";
  drawBtn.addEventListener("click", () => opts.onSelect("draw"));
  tray.append(drawBtn);

  for (const [kind, total] of Object.entries(opts.levelTools) as [ToolKind, number][]) {
    const left = opts.remaining[kind] ?? 0;
    const meta = TOOL_META[kind];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `egg-tool${opts.selectedTool === kind ? " is-selected" : ""}`;
    btn.disabled = opts.mode !== "ready" || left <= 0;
    btn.innerHTML = `<span>${meta.label}</span><strong>${left}/${total}</strong>`;
    btn.addEventListener("click", () => {
      if (left <= 0 || opts.mode !== "ready") return;
      opts.onSelect(kind);
    });
    tray.append(btn);
  }
}
