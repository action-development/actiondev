import { test, expect, type Page } from "./fixtures";
import { waitForPage } from "./helpers";

test.beforeEach(async ({ page }) => {
	await page.goto("/");
	await waitForPage(page);
});

// Scroll to a section bypassing Lenis by using native JS scrollIntoView
async function scrollToSection(page: Page, id: string) {
	await page.evaluate((sectionId) => {
		document.getElementById(sectionId)?.scrollIntoView({ behavior: "instant", block: "start" });
	}, id);
	await page.waitForTimeout(800); // GSAP settle
}

test("projects section renders", async ({ page }) => {
	await scrollToSection(page, "projects");

	await expect(page.locator("#projects")).toBeVisible();

	// Page-level screenshot evita la espera de estabilidad de locator (GSAP ScrollTrigger)
	await expect(page).toHaveScreenshot("projects-section.png", {
		animations: "disabled",
		fullPage: false,
	});
});

test("testimonials section renders", async ({ page }) => {
	await scrollToSection(page, "reviews");

	await expect(page.locator("#reviews")).toBeVisible();

	await expect(page).toHaveScreenshot("testimonials-section.png", {
		animations: "disabled",
		fullPage: false,
	});
});

test("contact section has form fields", async ({ page }) => {
	// Scroll hasta el campo para que ScrollTrigger GSAP (start: "top 92%") se dispare
	await page.evaluate(() => {
		document.getElementById("contact-name")?.scrollIntoView({ behavior: "instant", block: "center" });
	});
	await page.waitForTimeout(1000); // GSAP settle

	// Campos en DOM (pueden tener opacity GSAP pero existen)
	await expect(page.locator("#contact-name")).toBeAttached();
	await expect(page.locator("#contact-email")).toBeAttached();
	await expect(page.locator("#contact-description")).toBeAttached();

	await expect(page).toHaveScreenshot("contact-section.png", {
		animations: "disabled",
		fullPage: false,
	});
});
