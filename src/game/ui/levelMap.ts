import { getCampaignLevels } from "../levels";
import type { SaveData } from "../types";
import { starString } from "./hud";

export function renderLevelMap(
  root: HTMLElement,
  progress: HTMLElement,
  save: SaveData,
  onSelect: (level: number) => void,
) {
  root.replaceChildren();
  const levels = getCampaignLevels();
  const totalStars = save.bestStars.reduce((sum, stars) => sum + stars, 0);
  const completed = save.bestStars.filter((stars) => stars > 0).length;
  progress.textContent = `${completed}/50 complete · ${totalStars}/150 stars`;

  let activeChapter = 0;
  for (const level of levels) {
    if (level.chapter !== activeChapter) {
      activeChapter = level.chapter ?? activeChapter + 1;
      const heading = document.createElement("h3");
      heading.className = "level-map-chapter";
      heading.textContent = `Chapter ${activeChapter}: ${level.chapterName ?? ""}`;
      root.append(heading);
    }
    const button = document.createElement("button");
    const unlocked = level.number <= save.unlockedLevel;
    const best = save.bestStars[level.number - 1] ?? 0;
    button.type = "button";
    button.className = `level-node${level.number === save.selectedLevel ? " is-current" : ""}`;
    button.disabled = !unlocked;
    button.setAttribute(
      "aria-label",
      unlocked
        ? `Level ${level.number}, ${level.name}, best ${best} stars`
        : `Level ${level.number}, locked`,
    );
    button.innerHTML = `<strong>${level.number}</strong><span>${level.name}</span><small>${
      unlocked ? starString(best) : "Locked"
    }</small>`;
    button.addEventListener("click", () => onSelect(level.number));
    root.append(button);
  }
}
