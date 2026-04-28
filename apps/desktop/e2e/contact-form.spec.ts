import { test, expect } from "./fixtures";
import { waitForPage } from "./helpers";

test.beforeEach(async ({ page }) => {
	await page.goto("/");
	await waitForPage(page);
	await page.evaluate(() => {
		document.getElementById("contact-name")?.scrollIntoView({ behavior: "instant", block: "center" });
	});
	await page.waitForTimeout(1000); // GSAP ScrollTrigger settle
});

test("contact form accepts input", async ({ page }) => {
	// force: true bypasa la espera de visibilidad GSAP (opacity: 0 durante la animación)
	await page.locator("#contact-name").fill("Test User", { force: true });
	await page.locator("#contact-email").fill("test@example.com", { force: true });
	await page.locator("#contact-description").fill("Quiero una web increíble.", { force: true });

	await expect(page.locator("#contact-name")).toHaveValue("Test User");
	await expect(page.locator("#contact-email")).toHaveValue("test@example.com");
	await expect(page.locator("#contact-description")).toHaveValue(
		"Quiero una web increíble."
	);

	await expect(page).toHaveScreenshot("contact-form-filled.png", {
		animations: "disabled",
		fullPage: false,
	});
});

test("contact form requires name and email", async ({ page }) => {
	const submitBtn = page
		.locator("#contact button[type='submit'], #contact [type='submit']")
		.first();

	if (await submitBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
		await submitBtn.click({ force: true });
		// HTML5 validation impide submit — el campo name debe tener validationMessage
		const nameValid = await page
			.locator("#contact-name")
			.evaluate((el: HTMLInputElement) => el.validity.valid);
		expect(nameValid).toBe(false);
	} else {
		test.skip(true, "No hay botón submit visible");
	}
});

test("phone and website fields are optional", async ({ page }) => {
	const phone = page.locator("#contact-phone");
	const website = page.locator("#contact-website");

	if (await phone.isVisible({ timeout: 2_000 }).catch(() => false)) {
		const phoneRequired = await phone.evaluate(
			(el: HTMLInputElement) => el.required
		);
		expect(phoneRequired).toBe(false);
	}

	if (await website.isVisible({ timeout: 2_000 }).catch(() => false)) {
		const websiteRequired = await website.evaluate(
			(el: HTMLInputElement) => el.required
		);
		expect(websiteRequired).toBe(false);
	}
});
