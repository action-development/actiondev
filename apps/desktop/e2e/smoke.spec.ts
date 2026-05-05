import { test, expect } from "@playwright/test";

// Smoke tests — verify critical paths don't break on every deploy.
// Not testing implementation details, only user-visible behaviour.

test.describe("Home page", () => {
  test("loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(errors).toHaveLength(0);
  });

  test("renders hero section", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator("#home");
    await expect(hero).toBeVisible();
  });

  test("header is visible with nav links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
  });

  test("scrolls to projects section", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.evaluate(() => {
      document.getElementById("projects")?.scrollIntoView();
    });

    await expect(page.locator("#projects")).toBeInViewport();
  });

  test("scrolls to contact section and form is present", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.evaluate(() => {
      document.getElementById("contact")?.scrollIntoView();
    });

    const form = page.locator('form[aria-label]');
    await expect(form).toBeVisible();
    await expect(page.locator("#contact-name")).toBeVisible();
    await expect(page.locator("#contact-email")).toBeVisible();
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
    const cta = page.locator('a[href="/#contact"]').first();
    await expect(cta).toBeVisible();
  });
});

test.describe("Projects page", () => {
  test("loads and renders project grid", async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/projects");
  });
});

test.describe("Contact page", () => {
  test("loads and renders form", async ({ page }) => {
    await page.goto("/contact");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/contact");
  });
});
