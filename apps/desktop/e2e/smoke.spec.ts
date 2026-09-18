import { test, expect } from "@playwright/test";

// Smoke tests — verify critical paths don't break on every deploy.
// Not testing implementation details, only user-visible behaviour.

test.describe("Home page", () => {
  test("loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    expect(errors).toHaveLength(0);
  });

  test("renders hero section", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator("#home");
    await expect(hero).toBeVisible();
  });

  test("header is visible with nav links", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByRole("banner")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
  });

  test("gull tally easter egg stays hidden until a gull is shot", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("gull-tally")).toHaveCount(0);
  });

  test("home is a single full-viewport screen (no sections below the game)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#projects")).toHaveCount(0);
    await expect(page.locator("#contact")).toHaveCount(0);
    await expect(page.locator("footer")).toHaveCount(0);
  });

  test("hero remote control moves the crane and drops the hook", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const remote = page.getByTestId("hero-remote");
    await expect(remote).toBeVisible({ timeout: 15_000 });

    // Mantener la flecha derecha marca el botón como pulsado (y mueve el carro).
    const right = page.getByTestId("remote-right");
    await right.hover();
    await page.mouse.down();
    await expect(right).toHaveAttribute("data-pressed", "true");
    await page.mouse.up();
    await expect(right).toHaveAttribute("data-pressed", "false");

    // El teclado físico hunde el botón correspondiente del mando.
    await page.keyboard.down("KeyA");
    await expect(page.getByTestId("remote-left")).toHaveAttribute("data-pressed", "true");
    await page.keyboard.up("KeyA");
    await expect(page.getByTestId("remote-left")).toHaveAttribute("data-pressed", "false");

    // El botón de gancho no debe romper el bucle de juego.
    await page.getByTestId("remote-hook").click();
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });
});

test.describe("Navigation", () => {
  test("language toggle switches locale", async ({ page }) => {
    await page.goto("/");
    const toggle = page.locator('button[aria-label*="nglish"], button[aria-label*="spañol"]').first();
    await expect(toggle).toBeVisible();
  });

  test("CTA link points to contact", async ({ page }) => {
    await page.goto("/");
    const cta = page.locator('a[href="/contact"]').first();
    await expect(cta).toBeVisible();
  });
});

test.describe("Projects page", () => {
  test("renders featured projects section", async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.locator("#projects")).toBeVisible();
  });

  test("renders full project index with all entries", async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("domcontentloaded");

    await page.evaluate(() => {
      document.getElementById("projects-index")?.scrollIntoView();
    });

    const section = page.locator("#projects-index");
    await expect(section).toBeVisible();

    const rows = section.locator("[data-row]");
    await expect(rows.first()).toBeVisible();
    expect(await rows.count()).toBeGreaterThan(20);
  });

  test("category filter narrows the project list", async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("domcontentloaded");

    await page.evaluate(() => {
      document.getElementById("projects-index")?.scrollIntoView();
    });

    const section = page.locator("#projects-index");
    const totalRows = await section.locator("[data-row]").count();

    // Primer chip después de "TODOS" — no depende de que exista una categoría
    // concreta (el chip "BRANDING" desapareció al curar projects.ts).
    const firstCategoryChip = section.locator("button[aria-pressed]").nth(1);
    await firstCategoryChip.click();

    const filteredRows = await section.locator("[data-row]").count();
    expect(filteredRows).toBeLessThan(totalRows);
    expect(filteredRows).toBeGreaterThan(0);
  });
});

test.describe("Contact page", () => {
  test("loads and renders form", async ({ page }) => {
    await page.goto("/contact");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/contact$/);

    const form = page.locator('form[aria-label]');
    await expect(form).toBeVisible();
    await expect(page.locator("#contact-name")).toBeVisible();
    await expect(page.locator("#contact-email")).toBeVisible();
  });
});

test.describe("Reviews page", () => {
  test("redirects to the 3D plaza", async ({ page }) => {
    await page.goto("/reviews");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/resenas$/);
  });
});

test.describe("SEO landing pages", () => {
  test("core landing renders h1, FAQ and JSON-LD", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/desarrollo-de-aplicaciones-vigo");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("h1")).toHaveText(
      "Desarrollo de aplicaciones en Vigo",
    );
    await expect(page.locator("details").first()).toBeVisible();
    expect(
      await page.locator('script[type="application/ld+json"]').count(),
    ).toBeGreaterThan(0);
    expect(errors).toHaveLength(0);
  });

  test("servicios hub links every landing", async ({ page }) => {
    await page.goto("/servicios");
    await page.waitForLoadState("domcontentloaded");

    for (const slug of [
      "desarrollo-de-aplicaciones-vigo",
      "desarrollo-web-vigo",
      "diseno-web-vigo",
      "desarrollo-de-aplicaciones-pontevedra",
      "desarrollo-web-pontevedra",
      "desarrollo-de-aplicaciones-galicia",
    ]) {
      await expect(page.locator(`a[href="/${slug}"]`).first()).toBeVisible();
    }
  });

  test("unknown slug returns 404", async ({ page }) => {
    const response = await page.goto("/landing-inexistente");
    expect(response?.status()).toBe(404);
  });
});
