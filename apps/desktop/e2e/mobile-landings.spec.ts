import { devices, expect, test, type Browser, type Page } from "@playwright/test";
import { landings } from "../src/data/landings";

/**
 * Web móvil v2 · landings SEO (`/[landing]`, fase 2). Proyecto `mobile` de
 * `playwright.config.ts`: iPhone con UA real a 390×844 + cookie `mv2=1`, y el
 * servidor con `MOBILE_V2=qa`.
 *
 * Regla de oro de la v2 (CLAUDE.md `[SEO]`): mismo title, description,
 * canonical, JSON-LD de página, UN h1 y todos los enlaces internos de
 * escritorio, visibles. Aquí se compara contra el HTML que sirve el escritorio
 * (UA de escritorio, sin cookie) para cada landing.
 */

const DESKTOP_UA = devices["Desktop Chrome"].userAgent;
const WHATSAPP = /^https:\/\/wa\.me\/34614027410\?text=/;

async function setup(page: Page) {
  await page.addInitScript(() => localStorage.setItem("action-cookie-consent", "denied"));
  await page.route(/googletagmanager\.com|wa\.me|maps\.google|g\.page/, (route) => route.abort());
}

/** Elementos con texto ocultos a la vista (hidden, sr-only, display:none) dentro de `<main>`: no debe haber ninguno. */
async function hiddenIndexable(page: Page) {
  return page.evaluate(() => {
    const out: string[] = [];
    for (const el of document.querySelectorAll("main *")) {
      const cls = el.getAttribute("class") ?? "";
      const cs = getComputedStyle(el);
      const own = Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.textContent ?? "").trim());
      const hidden =
        el.hasAttribute("hidden") || /\bsr-only\b/.test(cls) || cs.display === "none" || cs.visibility === "hidden";
      if (hidden && (own || el.querySelector("a[href]"))) out.push(`${el.tagName}.${cls}`);
    }
    return out;
  });
}

type Head = { title: string; description: string; canonical: string; ld: string[]; links: string[]; h1: string[] };

/** Lo que sirve el escritorio para `path`: cabeza, JSON-LD de la página, h1 y enlaces internos del `<main>`. */
async function desktopView(browser: Browser, path: string): Promise<Head> {
  const ctx = await browser.newContext({ userAgent: DESKTOP_UA, viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => sessionStorage.setItem("action-loaded", "1"));
  const page = await ctx.newPage();
  await page.goto(path);
  await expect(page.getByTestId("m-header")).toHaveCount(0);
  const view = await readView(page);
  await ctx.close();
  return view;
}

async function readView(page: Page): Promise<Head> {
  return page.evaluate(() => {
    const meta = (name: string) => document.querySelector(`meta[name="${name}"]`)?.getAttribute("content") ?? "";
    // JSON-LD propio de la página (el de la entidad, Organization + WebSite, lo pone cada layout raíz).
    const ld = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map((s) => s.textContent ?? "")
      .filter((t) => t.includes("@graph"));
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("main a[href^='/']"))
      .map((a) => a.getAttribute("href")!.split("#")[0])
      .filter(Boolean);
    return {
      title: document.title,
      description: meta("description"),
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
      ld,
      links: [...new Set(links)].sort(),
      h1: Array.from(document.querySelectorAll("h1")).map((h) => h.textContent?.trim() ?? ""),
    };
  });
}

test.describe("Móvil v2 · landings SEO", () => {
  for (const landing of landings) {
    const path = `/${landing.slug}`;

    test(`${path}: paridad SEO con escritorio (title, description, canonical, JSON-LD, h1, enlaces)`, async ({
      page,
      browser,
    }) => {
      await setup(page);
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.getByTestId("m-header")).toBeVisible();

      const desktop = await desktopView(browser, path);
      const mobile = await readView(page);
      expect(mobile.title).toBe(desktop.title);
      expect(mobile.title).toBe(landing.title);
      expect(mobile.description).toBe(desktop.description);
      expect(mobile.canonical).toBe(`https://actiondev.es${path}`);
      expect(mobile.canonical).toBe(desktop.canonical);
      expect(mobile.ld).toEqual(desktop.ld);
      expect(mobile.h1).toEqual([landing.h1]);
      expect(mobile.h1).toEqual(desktop.h1);
      // Todo enlace interno de escritorio está en el móvil (el móvil puede tener más).
      expect(desktop.links.filter((href) => !mobile.links.includes(href))).toEqual([]);
      await expect(page.locator("main#main-content")).toHaveCount(1);
      await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
    });

    test(`${path}: el contenido indexable de la landing está visible`, async ({ page }) => {
      test.setTimeout(120_000);
      await setup(page);
      await page.goto(path);
      const main = page.locator("main");
      for (const text of [
        ...landing.intro,
        landing.offersTitle,
        ...landing.offers.flatMap((o) => [o.title, o.text]),
        landing.casesTitle,
        ...landing.cases.map((c) => c.note),
        landing.localContext.title,
        ...landing.localContext.paragraphs,
        ...landing.sections.flatMap((s) => [s.title, ...s.paragraphs]),
        landing.processTitle,
        ...landing.process.map((s) => s.text),
        landing.proof.text,
        ...landing.faqs.map((f) => f.q),
        landing.cta.title,
        landing.cta.text,
        ...landing.related.map((r) => r.label),
      ]) {
        await expect(main.getByText(text, { exact: true }).first(), text.slice(0, 60)).toBeVisible();
      }
      // Las respuestas de la FAQ están en el HTML (dentro de `<details>`; la primera, abierta).
      for (const faq of landing.faqs) await expect(main.getByText(faq.a, { exact: true })).toHaveCount(1);
      await expect(main.getByText(landing.faqs[0].a, { exact: true })).toBeVisible();
      expect(await hiddenIndexable(page)).toEqual([]);
      // Enlaces: casos a su ficha, relacionadas con su ancla, «Todos los servicios», migas.
      for (const c of landing.cases) await expect(main.locator(`a[href="/projects/${c.slug}"]`).first()).toBeVisible();
      for (const r of landing.related) {
        await expect(main.locator(`a[href="/${r.slug}"]`, { hasText: r.label })).toBeVisible();
      }
      await expect(page.getByTestId("m-landing-related-all")).toHaveAttribute("href", "/servicios");
      await expect(page.getByTestId("m-landing-crumbs").locator('a[href="/servicios"]')).toBeVisible();
    });
  }

  for (const width of [360, 390, 430]) {
    test(`sin overflow horizontal a ${width} px en las ${landings.length} landings`, async ({ page }) => {
      await setup(page);
      await page.setViewportSize({ width, height: 844 });
      for (const landing of landings) {
        await page.goto(`/${landing.slug}`);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, landing.slug).toBe(0);
      }
    });
  }

  test("enlaces internos de las landings responden 200 (con la vista previa)", async ({ page, request }) => {
    await setup(page);
    const hrefs = new Set<string>();
    for (const landing of landings) {
      await page.goto(`/${landing.slug}`);
      const found = await page
        .locator("a[href^='/']")
        .evaluateAll((as) => as.map((a) => a.getAttribute("href")!.split("#")[0]).filter(Boolean));
      found.forEach((href) => hrefs.add(href));
    }
    expect(hrefs.size).toBeGreaterThan(20);
    for (const href of hrefs) {
      const res = await request.get(href);
      expect(res.status(), href).toBe(200);
    }
  });

  test("«Datos clave» en las celdas del hero, con la valoración única y los proyectos contados", async ({ page }) => {
    await setup(page);
    await page.goto("/desarrollo-de-aplicaciones-vigo");
    const facts = page.getByTestId("m-landing-key-facts");
    await expect(facts).toContainText("5,0 sobre 5 · 23 reseñas");
    await expect(facts.locator('a[href="/projects"]')).toContainText("en el portfolio");
    await expect(facts).toContainText("React Native y Expo");
  });

  test("primera pantalla: h1, CTA lima al formulario y WhatsApp con el mensaje de la landing", async ({ page }) => {
    await setup(page);
    await page.goto("/desarrollo-de-aplicaciones-vigo");
    await expect(page.getByTestId("m-landing-h1")).toBeInViewport();
    const cta = page.getByTestId("m-landing-cta");
    await expect(cta).toBeInViewport();
    await expect(cta).toHaveAttribute("href", "#proyecto");
    await expect(cta).toContainText(/contar mi proyecto/i);
    const box = await cta.boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(844);
    const wa = page.getByTestId("m-landing-whatsapp");
    await expect(wa).toHaveAttribute("href", WHATSAPP);
    expect(decodeURIComponent((await wa.getAttribute("href"))!)).toContain(
      "vuestra página de desarrollo de aplicaciones en Vigo",
    );
  });

  test("CTA → formulario de la página: envío con source seo_landing y offer = slug", async ({ page }) => {
    await setup(page);
    const bodies: Record<string, unknown>[] = [];
    await page.route("**/api/lead", async (route) => {
      bodies.push(route.request().postDataJSON());
      await route.fulfill({ json: { ok: true, id: "test-id" } });
    });
    await page.goto("/software-a-medida-vigo?utm_source=google&utm_medium=cpc&gclid=xyz");
    await page.getByTestId("m-landing-cta").click();
    await expect(page).toHaveURL(/#proyecto$/);
    await expect(page.getByTestId("m-lead-form")).toBeInViewport();
    await expect(page.getByTestId("m-lead-field-need-software")).toBeChecked();

    await page.getByTestId("m-lead-field-stage-idea").check();
    await page.getByTestId("m-lead-next").click();
    await expect(page.getByTestId("m-lead-step-2")).toBeVisible();
    await page.getByTestId("m-lead-field-name").fill("Ana");
    await page.getByTestId("m-lead-field-phone").fill("600 123 456");
    await page.getByTestId("m-lead-field-email").fill("ana@empresa.es");
    await page.getByTestId("m-lead-field-budget-unknown").check();
    await page.getByTestId("m-lead-submit").click();

    await expect(page).toHaveURL(/\/hablemos\/gracias\?tipo=software$/);
    expect(bodies).toHaveLength(1);
    expect(bodies[0]).toMatchObject({
      source: "seo_landing",
      offer: "software-a-medida-vigo",
      need: "software",
      attribution: { utmSource: "google", gclid: "xyz", landingPath: "/software-a-medida-vigo" },
    });
  });

  test("barra fija: aparece al pasar el CTA del hero y se esconde con el formulario a la vista", async ({ page }) => {
    await setup(page);
    await page.goto("/desarrollo-web-vigo");
    const bar = page.getByTestId("m-sticky-cta");
    await expect(bar).toBeHidden();
    await page.getByTestId("m-landing-offers").scrollIntoViewIfNeeded();
    await expect(bar).toBeVisible();
    await expect(page.getByTestId("m-sticky-cta-form")).toHaveAttribute("href", "#proyecto");
    await page.getByTestId("m-lead-form").scrollIntoViewIfNeeded();
    await expect(bar).toBeHidden();
  });

  test("menú: las 5 rutas y «Contar mi proyecto» baja al formulario de la landing", async ({ page }) => {
    await setup(page);
    await page.goto("/diseno-web-vigo");
    await page.getByTestId("m-menu-open").click();
    await expect(page.getByTestId("m-menu")).toBeVisible();
    await expect(page.getByTestId("m-menu-link")).toHaveCount(6);
    await expect(page.getByTestId("m-menu-cta")).toHaveAttribute("href", "#proyecto");
    await page.getByTestId("m-menu-cta").click();
    await expect(page.getByTestId("m-menu")).toBeHidden();
    await expect(page.getByTestId("m-lead-form")).toBeInViewport();
  });

  test("escritorio no cambia: UA de escritorio con la cookie sigue en la landing de siempre", async ({ browser }) => {
    const ctx = await browser.newContext({ userAgent: DESKTOP_UA, viewport: { width: 1440, height: 900 } });
    await ctx.addCookies([{ name: "mv2", value: "1", domain: "localhost", path: "/" }]);
    const html = await (await ctx.request.get("/desarrollo-de-aplicaciones-vigo")).text();
    expect(html).not.toContain('data-testid="m-header"');
    expect(html).toContain('data-testid="landing-cta-project"');
    await ctx.close();
  });
});
