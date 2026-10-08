import { expect, test } from "@playwright/test";
import { DESKTOP_UA, desktopView, expectParity, hiddenIndexable, readView, setup } from "./mobile-seo";

/**
 * Web móvil v2 · blog (`/blog` y `/blog/[slug]`, fase 2). Proyecto `mobile` de
 * `playwright.config.ts` (iPhone 390×844 + cookie `mv2=1`, servidor con
 * `MOBILE_V2=qa`). Los posts salen de donde los lea el servidor: Firestore o,
 * sin `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, los de ejemplo de `lib/blog-placeholders.ts`.
 * Por eso los artículos se descubren desde el índice de escritorio.
 *
 * Regla de oro de la v2: mismo title, description, canonical, JSON-LD, un h1,
 * y todos los enlaces internos y textos del `<main>` de escritorio.
 */

test.describe("Móvil v2 · blog", () => {
  test("/blog: paridad SEO, H1 «Nuestro Blog», todos los artículos y CTA", async ({ page, browser }) => {
    await setup(page);
    const response = await page.goto("/blog");
    expect(response?.status()).toBe(200);
    await expect(page.getByTestId("m-header")).toBeVisible();
    const desktop = await desktopView(browser, "/blog");
    const mobile = await readView(page);
    expectParity(mobile, desktop, "/blog");
    await expect(page.getByTestId("m-blog-h1")).toHaveText("Nuestro Blog");

    const posts = desktop.links.filter((href) => href.startsWith("/blog/"));
    expect(posts.length).toBeGreaterThan(0);
    await expect(page.getByTestId("m-blog-post")).toHaveCount(posts.length);
    for (const href of posts) await expect(page.locator(`main a[href="${href}"]`)).toBeVisible();

    await expect(page.getByTestId("m-blog-cta-form")).toHaveAttribute("href", "/contact");
    await expect(page.getByTestId("m-blog-cta-whatsapp")).toHaveAttribute("href", /^https:\/\/wa\.me\/34614027410\?text=/);
    await expect(page.getByTestId("m-blog-cta-email")).toHaveAttribute("href", "mailto:hi@actiondev.es");
    await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
  });

  test("artículos: paridad SEO con escritorio, lectura y salidas", async ({ page, browser }) => {
    test.setTimeout(240_000);
    await setup(page);
    await page.goto("/blog");
    const posts = await page
      .getByTestId("m-blog-post")
      .evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
    for (const path of posts) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
      // Post fusionado con 301 (`redirects()` de next.config.ts) que sigue
      // publicado hasta que se despublique: su destino ya se revisa en el bucle.
      if (response?.request().redirectedFrom()) {
        expect(new URL(page.url()).pathname, path).toMatch(/^\/blog\/[a-z0-9-]+$/);
        continue;
      }
      const desktop = await desktopView(browser, path);
      expectParity(await readView(page), desktop, path);

      // Tipografía de lectura: 18 px con interlineado ≥ 1,5 y columna ≤ 40em.
      const prose = await page.getByTestId("m-post-body").evaluate((el) => {
        const p = el.querySelector("p")!;
        const cs = getComputedStyle(p);
        return { size: parseFloat(cs.fontSize), line: parseFloat(cs.lineHeight), width: p.getBoundingClientRect().width };
      });
      expect(prose.size).toBe(18);
      expect(prose.line / prose.size).toBeGreaterThanOrEqual(1.5);
      expect(prose.width).toBeLessThanOrEqual(720);

      await expect(page.getByTestId("m-post-crumbs").locator('a[href="/blog"]')).toBeVisible();
      await expect(page.getByTestId("m-post-back")).toHaveAttribute("href", "/blog");
      await expect(page.getByTestId("m-post-cta-form")).toHaveAttribute("href", "/contact");
      expect(await hiddenIndexable(page)).toEqual([]);
      await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
    }
  });

  for (const width of [360, 390, 430]) {
    test(`sin overflow horizontal a ${width} px (índice y artículos)`, async ({ page }) => {
      test.setTimeout(180_000);
      await setup(page);
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/blog");
      const posts = await page
        .getByTestId("m-blog-post")
        .evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
      for (const path of ["/blog", ...posts]) {
        await page.goto(path);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, path).toBe(0);
      }
    });
  }

  test("enlaces internos del blog responden 200 (con la vista previa)", async ({ page, request }) => {
    test.setTimeout(300_000);
    await setup(page);
    await page.goto("/blog");
    const posts = await page.getByTestId("m-blog-post").evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
    const hrefs = new Set<string>(posts);
    for (const path of posts) {
      await page.goto(path);
      const found = await page
        .locator("a[href^='/']")
        .evaluateAll((as) => as.map((a) => a.getAttribute("href")!.split("#")[0]).filter(Boolean));
      found.forEach((href) => hrefs.add(href));
    }
    for (const href of hrefs) expect((await request.get(href)).status(), href).toBe(200);
  });

  test("barra fija: aparece al bajar del título y se esconde con el CTA final a la vista", async ({ page }) => {
    await setup(page);
    await page.goto("/blog");
    const bar = page.getByTestId("m-sticky-cta");
    await expect(bar).toBeHidden();
    // Posiciones en el documento: fin del título y principio del CTA final.
    const { heroEnd, ctaTop } = await page.evaluate(() => ({
      heroEnd: document.getElementById("blog-hero")!.getBoundingClientRect().bottom + window.scrollY,
      ctaTop: document.getElementById("blog-cta")!.getBoundingClientRect().top + window.scrollY,
    }));
    // Con pocos artículos (los de ejemplo) no hay tramo sin título ni CTA a la vista.
    if (ctaTop - heroEnd > 844 + 16) {
      await page.evaluate((y) => window.scrollTo(0, y), heroEnd + 8);
      await expect(bar).toBeVisible();
    }
    await page.getByTestId("m-blog-cta").scrollIntoViewIfNeeded();
    await expect(bar).toBeHidden();
  });

  test("escritorio no cambia: UA de escritorio con la cookie sigue en el corcho", async ({ browser }) => {
    const ctx = await browser.newContext({ userAgent: DESKTOP_UA, viewport: { width: 1440, height: 900 } });
    await ctx.addCookies([{ name: "mv2", value: "1", domain: "localhost", path: "/" }]);
    const html = await (await ctx.request.get("/blog")).text();
    expect(html).not.toContain('data-testid="m-header"');
    expect(html).toContain('data-testid="post-it"');
    await ctx.close();
  });
});
