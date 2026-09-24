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

  // /projects (sala recreativa 3D) no tiene snapshot, igual que /resenas: las
  // capturas de los proyectos y el vídeo de la máquina enfocada llegan cuando
  // llegan y la imagen no es determinista. Lo cubre smoke.spec.ts. Lo mismo
  // /contact (la calle de C/ Colón 20): su HUD lo cubren smoke y sections.

});
