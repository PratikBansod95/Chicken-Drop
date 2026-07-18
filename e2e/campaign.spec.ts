import { expect, test } from "@playwright/test";

async function startGame(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Tap to Start" })).toBeVisible();
  await page.getByRole("button", { name: "Tap to Start" }).click();
  await expect(page.locator("canvas")).toBeVisible();
}

test("onboarding, controls, and locked map work on touch viewports", async ({ page }, testInfo) => {
  await startGame(page);
  await expect(page.getByText(/First Feathers/)).toBeAttached();

  const undersized = await page.locator("button:visible").evaluateAll((buttons) =>
    buttons
      .map((button) => {
        const rect = button.getBoundingClientRect();
        return { label: button.getAttribute("aria-label") ?? button.textContent, w: rect.width, h: rect.height };
      })
      .filter((button) => button.w < 48 || button.h < 48),
  );
  expect(undersized).toEqual([]);

  await page.getByRole("button", { name: "Open level map" }).click();
  await expect(page.getByRole("dialog", { name: "Level Map" })).toBeVisible();
  await expect(page.locator(".level-node")).toHaveCount(50);
  await expect(page.getByRole("button", { name: /Level 50, locked/ })).toBeDisabled();

  await page.screenshot({
    path: testInfo.outputPath(`level-map-${testInfo.project.name}.png`),
    fullPage: true,
  });
});

test("save persistence unlocks a replayable complete campaign", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "chicken-nest-run-v2",
      JSON.stringify({
        version: 2,
        unlockedLevel: 50,
        selectedLevel: 50,
        bestStars: Array.from({ length: 50 }, (_, index) => (index % 3) + 1),
        muted: false,
        sfxMuted: false,
        musicMuted: false,
        reduceMotion: false,
        tutorialsSeen: [],
        failures: Array.from({ length: 50 }, () => 0),
      }),
    );
  });
  await startGame(page);
  await page.getByRole("button", { name: "Open level map" }).click();
  await expect(page.getByRole("button", { name: /Level 50, The Final Nest/ })).toBeEnabled();
  await page.getByRole("button", { name: /Level 1, The First Roll/ }).click();
  await expect(page.locator('[data-field="level"]')).toHaveText("1");
  await page.reload();
  await expect(page.getByRole("button", { name: "Tap to Start" })).toBeVisible();
});

test("interactive controls have accessible names and focus indicators", async ({ page }) => {
  await startGame(page);
  const unnamed = await page.locator("button").evaluateAll((buttons) =>
    buttons
      .filter((button) => !button.disabled)
      .filter((button) => !(button.getAttribute("aria-label") || button.textContent?.trim()))
      .length,
  );
  expect(unnamed).toBe(0);

  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle),
  ).not.toBe("none");
  await page.getByRole("button", { name: "Open help" }).click();
  await expect(page.getByRole("dialog", { name: "How to Play" })).toBeVisible();
});
