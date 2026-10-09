import { expect, test } from "@playwright/test";
import { DESKTOP_UA, desktopView, expectParity, hiddenIndexable, readView, setup } from "./mobile-seo";

/**
 * Web móvil v2 · /sobre-nosotros (la página de la entidad, plan AEO §4.2).
 * Proyecto `mobile` (iPhone 390×844 + cookie `mv2=1`, servidor con
 * `MOBILE_V2=qa`). El texto es UNO (`lib/about-seo.ts`): el móvil sirve el
 * mismo title, description, canonical, JSON-LD, h1, enlaces y TODOS los
 * textos del `<main>` de escritorio, visibles.
 */

const PATH = "/sobre-nosotros";

test.describe("Móvil v2 · sobre nosotros", () => {
  test("misma página que escritorio, visible, sin tel: y con la barra fija", async ({ page, browser }) => {
    await setup(page);
    const response = await page.goto(PATH);
    expect(response?.status()).toBe(200);
    await expect(page.getByTestId("m-header")).toBeVisible();
    const desktop = await desktopView(browser, PATH);
    expectParity(await readView(page), desktop, PATH);
    expect(await hiddenIndexable(page)).toEqual([]);
    await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);

    await expect(page.getByTestId("m-about-h1")).toBeVisible();
    await expect(page.getByTestId("m-about-rating")).toHaveAttribute("href", "https://maps.google.com/?cid=18162141466997281764");
    await expect(page.getByTestId("m-about-facts").locator("dt")).toHaveCount(11);
    await expect(page.getByTestId("m-landing-case")).toHaveCount(5);
    await expect(page.getByTestId("m-about-faq").locator("h3")).toHaveCount(9);
    // Barra fija desde el principio; se esconde con el CTA del final a la vista.
    await expect(page.getByTestId("m-sticky-cta")).toBeVisible();
    await page.getByTestId("m-about-cta").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("m-sticky-cta")).toBeHidden();
  });

  test("el pie de toda página enlaza la página de la entidad", async ({ page }) => {
    await setup(page);
    for (const path of ["/", "/servicios", PATH]) {
      await page.goto(path);
      await expect(page.getByTestId("m-footer-about"), path).toHaveAttribute("href", PATH);
    }
  });

  for (const width of [320, 360, 390, 430]) {
    test(`sin overflow horizontal a ${width} px`, async ({ page }) => {
      await setup(page);
      await page.setViewportSize({ width, height: 844 });
      await page.goto(PATH);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBe(0);
    });
  }

  test("escritorio no cambia: UA de escritorio con la cookie sigue en la página de escritorio", async ({ browser }) => {
    const ctx = await browser.newContext({ userAgent: DESKTOP_UA, viewport: { width: 1440, height: 900 } });
    await ctx.addCookies([{ name: "mv2", value: "1", domain: "localhost", path: "/" }]);
    const html = await (await ctx.request.get(PATH)).text();
    expect(html).not.toContain('data-testid="m-header"');
    expect(html).toContain('data-testid="about-facts"');
    await ctx.close();
  });
});
