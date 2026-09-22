import { test, expect, type Page } from "./fixtures";
import { waitForPage } from "./helpers";

// Las antiguas secciones de la home viven ahora cada una en su ruta.
// Scroll bypassing Lenis con scrollIntoView nativo.
async function openSection(page: Page, path: string, id: string) {
	await page.goto(path);
	await waitForPage(page);
	await page.evaluate((sectionId) => {
		document.getElementById(sectionId)?.scrollIntoView({ behavior: "instant", block: "start" });
	}, id);
	await page.waitForTimeout(800); // GSAP settle
}

test("projects section renders", async ({ page }) => {
	await openSection(page, "/projects", "projects");

	await expect(page.locator("#projects")).toBeVisible();

	// Page-level screenshot evita la espera de estabilidad de locator (GSAP ScrollTrigger)
	await expect(page).toHaveScreenshot("projects-section.png", {
		animations: "disabled",
		fullPage: false,
	});
});

test("contact section shows both channels", async ({ page }) => {
	await page.goto("/contact");
	await waitForPage(page);
	await page.waitForTimeout(1000); // GSAP settle

	// En DOM (pueden tener opacity GSAP pero existen)
	await expect(page.locator('[data-channel="whatsapp"]')).toBeAttached();
	await expect(page.locator('[data-channel="email"]')).toBeAttached();

	await expect(page).toHaveScreenshot("contact-section.png", {
		animations: "disabled",
		fullPage: false,
	});
});
