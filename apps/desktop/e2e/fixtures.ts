import { test as base } from "@playwright/test";

/** Extended test that automatically bypasses the loading screen for all specs. */
export const test = base.extend<object>({
	page: async ({ page }, use) => {
		await page.addInitScript(() => sessionStorage.setItem("action-loaded", "1"));
		await use(page);
	},
});

export { expect, type Page } from "@playwright/test";
