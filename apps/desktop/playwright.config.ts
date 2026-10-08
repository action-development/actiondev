import { defineConfig, devices } from "@playwright/test";

// Specs de la web móvil v2: `e2e/mobile.spec.ts` y `e2e/mobile-<zona>.spec.ts`.
// Solo los corre el proyecto `mobile`; el de escritorio los ignora.
const MOBILE_SPECS = /[\\/]mobile(-[^\\/]+)?\.spec\.ts$/;

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
			testIgnore: MOBILE_SPECS,
			use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
		},
		// Web móvil v2 (`app/(m)/m`): iPhone con UA real a 390×844 y la cookie de
		// QA `mv2=1`. El servidor de desarrollo arranca con `MOBILE_V2=qa` (abajo):
		// si ya hay uno corriendo sin esa variable, `reuseExistingServer` lo
		// reutiliza y estos tests fallan — pararlo antes.
		{
			name: "mobile",
			testMatch: MOBILE_SPECS,
			use: {
				browserName: "chromium",
				userAgent: devices["iPhone 13"].userAgent,
				viewport: { width: 390, height: 844 },
				deviceScaleFactor: 3,
				isMobile: true,
				hasTouch: true,
				storageState: {
					cookies: [
						{
							name: "mv2",
							value: "1",
							domain: "localhost",
							path: "/",
							expires: -1,
							httpOnly: true,
							secure: false,
							sameSite: "Lax",
						},
					],
					origins: [],
				},
			},
		},
	],

	webServer: {
		command: "MOBILE_V2=qa pnpm dev",
		url: "http://localhost:3001",
		reuseExistingServer: true,
		timeout: 120_000,
	},
});
