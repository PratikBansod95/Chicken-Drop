/** Small helper to bind data-action buttons without repeating unlock/sfx boilerplate. */
export function bindActions(
  root: HTMLElement,
  unlock: () => Promise<void>,
  playTap: () => void,
  map: Record<string, () => void | Promise<void>>,
) {
  for (const [name, fn] of Object.entries(map)) {
    root.querySelector(`[data-action="${name}"]`)?.addEventListener("click", async () => {
      await unlock();
      playTap();
      await fn();
    });
  }
}
