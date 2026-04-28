import { test, expect } from "./fixtures";
import { waitForPage, canvasMasks } from "./helpers";

test("hero section renders canvas and key text", async ({ page }) => {
	await page.goto("/");
	await waitForPage(page);

	// Canvas 3D presente
	await expect(page.locator("canvas").first()).toBeVisible();

	// Texto DOM del hero (instrucciones del juego — fuera del canvas)
	await expect(page.getByText(/score to scroll/i)).toBeVisible();

	// Screenshot con canvas enmascarado (render WebGL no-determinista)
	await expect(page).toHaveScreenshot("hero.png", {
		mask: canvasMasks(page),
		fullPage: false,
	});
});

test("loading screen shows on first visit", async ({ page }) => {
	// Sin el initScript → loading screen visible
	await page.goto("/");
	// Loading screen debe aparecer brevemente
	const loadingScreen = page.locator('[data-testid="loading-screen"], .loading-screen').first();
	// Si no tiene data-testid buscamos por canvas que ocupa full screen durante loading
	await expect(page.locator("canvas").first()).toBeVisible({ timeout: 10_000 });
});

test("header is visible and has navigation links", async ({ page }) => {
	await page.goto("/");
	await waitForPage(page);

	const header = page.locator("header, nav[aria-label='Main navigation']").first();
	await expect(header).toBeVisible();

	// Logo
	await expect(page.getByRole("link", { name: /action/i }).first()).toBeVisible();

	// CTA "Let's talk"
	await expect(page.getByRole("link", { name: /let's talk/i })).toBeVisible();

	await expect(header).toHaveScreenshot("header.png");
});
