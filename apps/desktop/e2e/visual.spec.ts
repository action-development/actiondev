import { test, expect } from "@playwright/test";

// Visual regression tests — screenshot snapshots.
// Run `pnpm test:e2e:update` to update baseline snapshots after intentional visual changes.
// Diff threshold: 5% pixel ratio (set in playwright.config.ts).

test.describe("Visual regression", () => {
  test("home — above fold", async ({ page }) => {
    await page.goto("/");
    // Wait for WebGL/3D scene to stabilise before capturing
    await page.waitForTimeout(2000);
    await expect(page).toHaveScreenshot("home-above-fold.png", {
      clip: { x: 0, y: 0, width: 1440, height: 900 },
    });
  });

  test("home — projects section", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => {
      document.getElementById("projects")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("home-projects.png");
  });

  test("home — contact section", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => {
      document.getElementById("contact")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("home-contact.png");
  });
});
