import { expect, test } from "@playwright/test";
import { DESKTOP_UA, desktopView, expectParity, hiddenIndexable, readView, setup } from "./mobile-seo";

/**
 * Web móvil v2 · documentos legales (`/legal/*`, fase 2). Proyecto `mobile`
 * (iPhone 390×844 + cookie `mv2=1`, servidor con `MOBILE_V2=qa`).
 *
 * El texto es UNO (`components/legal/docs/*`): aquí se comprueba que el móvil
 * sirve el mismo title, description, canonical, JSON-LD, h1, enlaces y TODOS
 * los textos del `<main>` de escritorio, visibles.
 */

const DOCS = ["/legal/aviso-legal", "/legal/privacy", "/legal/terms", "/legal/cookies"] as const;

test.describe("Móvil v2 · legales", () => {
  for (const path of DOCS) {
    test(`${path}: mismo documento que escritorio, visible y sin tel:`, async ({ page, browser }) => {
      await setup(page);
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.getByTestId("m-header")).toBeVisible();
      const desktop = await desktopView(browser, path);
      expectParity(await readView(page), desktop, path);
      expect(await hiddenIndexable(page)).toEqual([]);
      await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
      await expect(page.getByTestId("m-legal-h1")).toBeVisible();
      await expect(page.locator("main")).toContainText("Última actualización:");

      // Los cuatro documentos enlazados, el actual marcado.
      const nav = page.getByTestId("m-legal-nav");
      await expect(nav.locator("a")).toHaveCount(4);
      await expect(nav.locator(`a[href="${path}"]`)).toHaveAttribute("aria-current", "page");
      // Sin barra fija: aquí no se vende.
      await expect(page.getByTestId("m-sticky-cta")).toHaveCount(0);
    });
  }

  test("aviso legal: ficha del titular completa en un <dl>, con WhatsApp en vez de tel:", async ({ page }) => {
    await setup(page);
    await page.goto("/legal/aviso-legal");
    const card = page.getByTestId("m-legal-entity");
    await expect(card.locator("dt")).toHaveCount(11);
    for (const text of ["Alcasi Systems, S.L.", "B72910664", "Registro Mercantil de Pontevedra", "hi@actiondev.es"]) {
      await expect(card).toContainText(text);
    }
    await expect(card.locator('a[href="mailto:hi@actiondev.es"]')).toBeVisible();
    await expect(card.locator('a[href^="https://wa.me/34614027410"]')).toBeVisible();
  });

  for (const width of [320, 360, 390, 430]) {
    test(`sin overflow horizontal a ${width} px en los cuatro documentos`, async ({ page }) => {
      await setup(page);
      await page.setViewportSize({ width, height: 844 });
      for (const path of DOCS) {
        await page.goto(path);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, path).toBe(0);
      }
    });
  }

  test("el pie enlaza los legales y el menú sigue funcionando", async ({ page }) => {
    await setup(page);
    await page.goto("/legal/privacy");
    const legal = page.getByTestId("m-footer-legal");
    expect(await legal.locator("a").evaluateAll((as) => as.map((a) => a.getAttribute("href")))).toEqual([...DOCS]);
    await page.getByTestId("m-menu-open").click();
    await expect(page.getByTestId("m-menu-link")).toHaveCount(5);
  });

  test("/legal y /reviews redirigen como en escritorio", async ({ request }) => {
    for (const [from, to] of [
      ["/legal", "/legal/aviso-legal"],
      ["/reviews", "/resenas"],
    ]) {
      const res = await request.get(from, { maxRedirects: 0 });
      expect([301, 308], from).toContain(res.status());
      expect(new URL(res.headers().location, "http://x").pathname, from).toBe(to);
    }
  });

  test("escritorio no cambia: UA de escritorio con la cookie sigue en los legales de siempre", async ({ browser }) => {
    const ctx = await browser.newContext({ userAgent: DESKTOP_UA, viewport: { width: 1440, height: 900 } });
    await ctx.addCookies([{ name: "mv2", value: "1", domain: "localhost", path: "/" }]);
    const html = await (await ctx.request.get("/legal/aviso-legal")).text();
    expect(html).not.toContain('data-testid="m-header"');
    expect(html).toContain('class="legal-prose"');
    expect(html).toContain('class="legal-data"');
    await ctx.close();
  });
});
