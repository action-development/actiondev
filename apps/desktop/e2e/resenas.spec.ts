import { test, expect } from "@playwright/test";

// Smoke tests de /resenas — sin regresión visual (el WebGL de la plaza tarda
// en estabilizar; snapshots se añaden aparte). Mismo patrón que smoke.spec.ts.

test.describe("Plaza de reseñas", () => {
  test("loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/resenas");
    await page.waitForLoadState("domcontentloaded");

    expect(errors).toHaveLength(0);
  });

  test("renders the 3D canvas", async ({ page }) => {
    await page.goto("/resenas");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("canvas")).toBeVisible({ timeout: 15_000 });
  });

  test("HUD shows title and review count", async ({ page }) => {
    await page.goto("/resenas");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByRole("heading", { name: "La plaza de las reseñas" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/^\d+ reseñas$/)).toBeVisible();
  });

  test("back link points to home", async ({ page }) => {
    await page.goto("/resenas");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator('a[href="/"]').first()).toBeVisible();
  });

  test("Escape closes the review card", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/resenas");
    await page.waitForLoadState("domcontentloaded");

    const dialog = page.locator('[role="dialog"]');

    // La ficha existe siempre en el DOM (oculta con visibility) — Escape no
    // debe romper nada aunque no haya ningún muñeco seleccionado todavía.
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();

    expect(errors).toHaveLength(0);
  });
});
