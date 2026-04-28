import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	outputDir: "./e2e/test-results",
	snapshotDir: "./e2e/snapshots",
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: [["html", { outputFolder: "e2e/report", open: "never" }], ["list"]],

	use: {
		baseURL: "http://localhost:3001",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
		trace: "retain-on-failure",
	},

	expect: {
		timeout: 15_000,
		toHaveScreenshot: {
			maxDiffPixelRatio: 0.05,
			animations: "disabled",
		},
	},

	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
		},
	],

	webServer: {
		command: "pnpm dev",
		url: "http://localhost:3001",
		reuseExistingServer: true,
		timeout: 120_000,
	},
});
