import { devices, expect, test, type Browser, type Page } from "@playwright/test";

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

const DESKTOP_UA = devices["Desktop Chrome"].userAgent;

async function setup(page: Page) {
  await page.addInitScript(() => localStorage.setItem("action-cookie-consent", "denied"));
  await page.route(/googletagmanager\.com|wa\.me/, (route) => route.abort());
}

type View = {
  title: string;
  description: string;
  canonical: string;
  ogType: string;
  published: string;
  ld: string[];
  h1: string[];
  links: string[];
  texts: string[];
};

async function readView(page: Page): Promise<View> {
  return page.evaluate(() => {
    const meta = (sel: string) => document.querySelector(sel)?.getAttribute("content") ?? "";
    const texts: string[] = [];
    const walker = document.createTreeWalker(document.querySelector("main")!, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = (n.textContent ?? "").replace(/\s+/g, " ").trim();
      if (t.length >= 20 && !n.parentElement?.closest("script,style")) texts.push(t);
    }
    return {
      title: document.title,
      description: meta('meta[name="description"]'),
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
      ogType: meta('meta[property="og:type"]'),
      published: meta('meta[property="article:published_time"]'),
      ld: Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map((s) => s.textContent ?? "")
        .filter((t) => t.includes("@graph")),
      h1: Array.from(document.querySelectorAll("h1")).map((h) => h.textContent?.trim() ?? ""),
      links: [
        ...new Set(
          Array.from(document.querySelectorAll<HTMLAnchorElement>("main a[href^='/']"))
            .map((a) => a.getAttribute("href")!.split("#")[0])
            .filter(Boolean),
        ),
      ],
      texts,
    };
  });
}

async function desktopView(browser: Browser, path: string): Promise<View> {
  const ctx = await browser.newContext({ userAgent: DESKTOP_UA, viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => sessionStorage.setItem("action-loaded", "1"));
  const page = await ctx.newPage();
  await page.goto(path);
  await expect(page.getByTestId("m-header")).toHaveCount(0);
  const view = await readView(page);
  await ctx.close();
  return view;
}

/** Textos de escritorio que el móvil dice con otro rótulo (vocabulario de DESIGN.md §11). */
const RELABELED = new Set(["← Todos los artículos"]);
const norm = (s: string) => s.replace(/[«»←→]/g, "").replace(/\s+/g, " ").trim().toLowerCase();

function expectParity(mobile: View, desktop: View, path: string) {
  expect(mobile.title, "title").toBe(desktop.title);
  expect(mobile.description, "description").toBe(desktop.description);
  expect(mobile.canonical, "canonical").toBe(`https://actiondev.es${path}`);
  expect(mobile.canonical).toBe(desktop.canonical);
  expect(mobile.ogType).toBe(desktop.ogType);
  expect(mobile.published).toBe(desktop.published);
  expect(mobile.ld, "JSON-LD").toEqual(desktop.ld);
  expect(mobile.h1).toHaveLength(1);
  expect(mobile.h1).toEqual(desktop.h1);
  expect(desktop.links.filter((href) => href !== path && !mobile.links.includes(href)), "enlaces").toEqual([]);
  const all = norm(mobile.texts.join(" "));
  expect(
    desktop.texts.filter((t) => !RELABELED.has(t) && !all.includes(norm(t))),
    "textos de escritorio que faltan",
  ).toEqual([]);
}

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
    // Justo por debajo del título: el hero ya no se ve y el CTA final todavía no.
    await page.evaluate(() => {
      const hero = document.getElementById("blog-hero")!.getBoundingClientRect();
      window.scrollTo(0, window.scrollY + hero.bottom + 8);
    });
    await expect(bar).toBeVisible();
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
