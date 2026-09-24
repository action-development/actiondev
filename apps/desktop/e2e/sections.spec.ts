import { test, expect } from "./fixtures";
import { waitForPage } from "./helpers";

test("contact section shows both channels", async ({ page }) => {
	await page.goto("/contact?quieto");
	await waitForPage(page);

	// Los canales viven en el HUD, fuera del canvas: visibles desde el primer
	// frame, se juegue o no con la calle. Sin snapshot: es una escena 3D
	// (ver visual.spec.ts).
	await expect(page.locator('[data-channel="whatsapp"]')).toBeVisible();
	await expect(page.locator('[data-channel="email"]')).toBeVisible();
});
