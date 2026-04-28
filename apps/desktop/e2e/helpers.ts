import { Page } from "@playwright/test";

/** Espera a que el canvas 3D arranque (aparece el elemento canvas en el DOM) */
export async function waitForCanvas(page: Page) {
	await page.waitForSelector("canvas", { timeout: 15_000 });
	// Dos frames extra para que Three.js pinte al menos un frame
	await page.waitForTimeout(500);
}

/** Espera a que la página esté lista: DOM listo + canvas si existe */
export async function waitForPage(page: Page) {
	// "networkidle" nunca se alcanza con Three.js/GSAP activos → usar "load"
	await page.waitForLoadState("load");
	const canvas = page.locator("canvas").first();
	if (await canvas.isVisible({ timeout: 3_000 }).catch(() => false)) {
		await waitForCanvas(page);
	}
}

/** Devuelve los locators de todos los canvas para enmascararlos en screenshots */
export function canvasMasks(page: Page) {
	return [page.locator("canvas")];
}
