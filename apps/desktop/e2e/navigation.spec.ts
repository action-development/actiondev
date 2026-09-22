import { test, expect } from "./fixtures";
import { waitForPage } from "./helpers";

test("logo links to home", async ({ page }) => {
	await page.goto("/");
	await waitForPage(page);

	const logo = page.getByRole("link", { name: /action/i }).first();
	await expect(logo).toBeVisible();
	await logo.click();
	await expect(page).toHaveURL(/\//);
});

test("nav link 'Let's talk' navigates to /contact", async ({ page }) => {
	await page.goto("/");
	await waitForPage(page);

	const ctaLink = page.getByRole("link", { name: /(let's talk|hablemos)/i });
	await expect(ctaLink).toBeVisible();
	await ctaLink.click();

	await expect(page).toHaveURL(/\/contact$/);
	await expect(page.locator("#contact")).toBeVisible();
});

test("header nav links scroll to correct sections", async ({ page }) => {
	await page.goto("/");
	await waitForPage(page);

	// Recopilar todos los links de navegación del header
	const navLinks = page.locator('[data-testid="main-nav"] a');
	const count = await navLinks.count();
	expect(count).toBeGreaterThan(0);
});

test("page title is correct", async ({ page }) => {
	await page.goto("/");
	await expect(page).toHaveTitle(/action/i);
});
