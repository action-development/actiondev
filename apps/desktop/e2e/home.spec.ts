import { test, expect } from "./fixtures";
import { waitForPage, canvasMasks } from "./helpers";

test("hero section renders canvas and key text", async ({ page }) => {
	await page.goto("/?hora=atardecer");
	await waitForPage(page);

	// Canvas 3D presente
	await expect(page.locator("canvas").first()).toBeVisible();

	// Mando de radiocontrol (overlay DOM del juego — fuera del canvas)
	await expect(page.getByTestId("hero-remote")).toBeVisible();

	// Screenshot con canvas enmascarado (render WebGL no-determinista)
	await expect(page).toHaveScreenshot("hero.png", {
		mask: canvasMasks(page),
		fullPage: false,
	});
});

test("loading screen is the accent blinds and retracts when the scene is ready", async ({ page }) => {
	await page.goto("/");
	// Persiana cerrada (solo franjas, sin logo ni contador) desde el primer paint
	const loadingScreen = page.getByTestId("loading-screen");
	await expect(loadingScreen).toBeVisible();
	await expect(loadingScreen.locator("img")).toHaveCount(0);
	// Se recoge y desmonta cuando la escena está lista
	await expect(page.locator("canvas").first()).toBeVisible({ timeout: 15_000 });
	await expect(loadingScreen).toHaveCount(0, { timeout: 30_000 });
});

test("volver a la home por un link usa una sola persiana (sin pantalla de carga encima)", async ({ page }) => {
	await page.goto("/?hora=atardecer");
	// Primera carga: la pantalla de carga entra y se va cuando la escena está lista
	await expect(page.getByTestId("loading-screen")).toHaveCount(0, { timeout: 30_000 });

	const blinds = page.getByTestId("page-blinds");
	await page.getByRole("link", { name: "Contacto" }).first().click();
	await expect(blinds).toHaveAttribute("data-state", "idle", { timeout: 15_000 });

	// Centinela: marca el <html> si la pantalla de carga llega a montarse en
	// algún momento de la vuelta (el observer sobrevive a la navegación cliente).
	await page.evaluate(() => {
		const mark = () => {
			if (document.querySelector('[data-testid="loading-screen"]')) {
				document.documentElement.dataset.loaderSeen = "1";
			}
		};
		mark();
		new MutationObserver(mark).observe(document.documentElement, { childList: true, subtree: true });
	});

	await page.getByRole("link", { name: "Inicio" }).first().click();
	await expect(blinds).toHaveAttribute("data-state", /closing|closed/);
	await expect(page).toHaveURL(/:\d+\/$/);
	await expect(blinds).toHaveAttribute("data-state", "idle", { timeout: 20_000 });

	// Una sola cortina: la de la transición. Encadenar la de carga encima
	// duplicaba el barrido y la home tardaba el doble que el resto de rutas.
	await expect(page.locator("html[data-loader-seen]")).toHaveCount(0);
	await expect(page.locator("canvas").first()).toBeVisible();
});

test("navigating between routes closes and reopens the blinds", async ({ page }) => {
	await page.goto("/legal/cookies");
	await page.waitForLoadState("load");
	const blinds = page.getByTestId("page-blinds");
	await expect(blinds).toHaveAttribute("data-state", "idle");

	await page.getByRole("link", { name: "Privacidad" }).click();
	await expect(blinds).toHaveAttribute("data-state", /closing|closed/);
	await expect(page).toHaveURL(/\/legal\/privacy$/);
	await expect(blinds).toHaveAttribute("data-state", "idle", { timeout: 10_000 });
});

test("header is visible and has navigation links", async ({ page }) => {
	await page.goto("/?hora=atardecer");
	await waitForPage(page);

	// La persiana de carga cubre la franja superior: sin esperar a que se retire,
	// la captura sale lima en vez de enseñar el header.
	await expect(page.getByTestId("loading-screen")).toHaveCount(0, { timeout: 30_000 });

	const header = page.locator('header, [data-testid="main-nav"]').first();
	await expect(header).toBeVisible();

	// Logo
	await expect(page.getByRole("link", { name: /action/i }).first()).toBeVisible();

	// CTA "Let's talk"
	await expect(page.getByRole("link", { name: /(let's talk|hablemos)/i })).toBeVisible();

	await expect(header).toHaveScreenshot("header.png");
});
