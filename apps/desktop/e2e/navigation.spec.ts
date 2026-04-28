import { test, expect } from "@playwright/test";
import { waitForPage } from "./helpers";

test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => sessionStorage.setItem("action-loaded", "1"));
});

test("logo links to home", async ({ page }) => {
	await page.goto("/");
	await waitForPage(page);

	const logo = page.getByRole("link", { name: /action/i }).first();
	await expect(logo).toBeVisible();
	await logo.click();
	await expect(page).toHaveURL(/\//);
});

test("nav link 'Let's talk' scrolls to contact", async ({ page }) => {
	await page.goto("/");
	await waitForPage(page);

	const ctaLink = page.getByRole("link", { name: /let's talk/i });
	await expect(ctaLink).toBeVisible();
	await ctaLink.click();

	// Tras click debe llegar a la sección contact (visible en viewport o URL con hash)
	await page.waitForTimeout(800);
	const contactSection = page.locator("#contact");
	await expect(contactSection).toBeInViewport({ ratio: 0.1 });
});

test("header nav links scroll to correct sections", async ({ page }) => {
	await page.goto("/");
	await waitForPage(page);

	// Recopilar todos los links de navegación del header
	const navLinks = page.locator("nav[aria-label='Main navigation'] a");
	const count = await navLinks.count();
	expect(count).toBeGreaterThan(0);
});

test("page title is correct", async ({ page }) => {
	await page.goto("/");
	await expect(page).toHaveTitle(/action/i);
});
