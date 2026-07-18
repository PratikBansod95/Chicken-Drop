/** Small helper to bind data-action buttons without repeating unlock/sfx boilerplate. */
export function bindActions(
  root: HTMLElement,
  unlock: () => Promise<void>,
  playTap: () => void,
  map: Record<string, () => void | Promise<void>>,
) {
  root.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLElement>("[data-action]");
    if (!button || !root.contains(button)) return;
    const action = button.dataset.action;
    const fn = action ? map[action] : undefined;
    if (!fn) return;

    // Gameplay actions must not wait on browsers that suspend AudioContext.resume().
    void unlock()
      .then(playTap)
      .catch(() => {
        /* Audio remains optional; never block controls. */
      });
    await fn();
  });
}
