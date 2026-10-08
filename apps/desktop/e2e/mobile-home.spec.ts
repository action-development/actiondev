import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";

/**
 * Web móvil v2 — HOME (`app/(m)/m/page.tsx`, maqueta `docs/mobile-v2/home.html`).
 *
 * Mismo entorno que el proyecto `mobile` de `playwright.config.ts`: iPhone
 * con UA real a 390×844, cookie de QA `mv2=1` y servidor con `MOBILE_V2=qa`.
 * Cubre la paridad SEO con la home anterior (title, canonical, JSON-LD, un
 * `<h1>` y TODOS los enlaces que antes iban en `sr-only`, ahora visibles), los
 * casos, las FAQ, el CTA y WhatsApp.
 */

const WHATSAPP = /^https:\/\/wa\.me\/34614027410\?text=.+/;
const TITLE = "Action — Desarrollo de Aplicaciones y Webs en Vigo";
const GOOGLEBOT_SMARTPHONE =
  "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7390.122 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

/** Las 10 landings SEO (`data/landings.ts`): la home es su principal vía de enlace interno. */
const LANDINGS = [
  "/desarrollo-de-aplicaciones-vigo",
  "/desarrollo-web-vigo",
  "/diseno-web-vigo",
  "/tienda-online-vigo",
  "/software-a-medida-vigo",
  "/desarrollo-de-aplicaciones-pontevedra",
  "/desarrollo-web-pontevedra",
  "/desarrollo-web-redondela",
  "/desarrollo-de-aplicaciones-galicia",
  "/agencia-desarrollo-web-galicia",
];

/** Lo que enlazaba el nav `sr-only` de la home anterior, además de las landings. */
const SITE_LINKS = [
  "/servicios",
  "/projects",
  "/resenas",
  "/blog",
  "/contact",
  "/legal/aviso-legal",
  "/legal/privacy",
  "/legal/terms",
  "/legal/cookies",
];

async function withConsent(page: Page) {
  await page.addInitScript(() => localStorage.setItem("action-cookie-consent", "denied"));
}

async function blockExternal(page: Page) {
  await page.route(/googletagmanager\.com|wa\.me/, (route) => route.abort());
}

test.describe("Móvil v2 · home · SEO", () => {
  test("title, canonical, description, JSON-LD y un único h1 visible", async ({ page }) => {
    await withConsent(page);
    await page.goto("/");
    await expect(page).toHaveTitle(TITLE);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://actiondev.es");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /desarrollo de aplicaciones y webs en Vigo/);
    const types = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((nodes) => nodes.map((n) => JSON.parse(n.textContent ?? "{}")["@type"]));
    expect(types).toEqual(expect.arrayContaining([["Organization", "ProfessionalService"], "WebSite"]));

    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText("Apps, programas y webs para tu negocio");
  });

  test("Googlebot Smartphone recibe los metadatos en el <head> y todos los enlaces en el HTML", async ({ request }) => {
    const response = await request.get("/", { headers: { "user-agent": GOOGLEBOT_SMARTPHONE, cookie: "mv2=1" } });
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain('data-testid="m-home-hero"');
    const headEnd = html.indexOf("</head>");
    for (const tag of ["<title>", 'name="description"', 'rel="canonical"']) {
      const at = html.indexOf(tag);
      expect(at, tag).toBeGreaterThan(-1);
      expect(at, `${tag} antes de </head>`).toBeLessThan(headEnd);
    }
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1);
    for (const href of [...LANDINGS, ...SITE_LINKS]) expect(html, href).toContain(`href="${href}"`);
  });

  test("las 10 landings y las secciones del sitio están enlazadas y VISIBLES", async ({ page }) => {
    await withConsent(page);
    await page.goto("/");
    const landingLinks = page.getByTestId("m-home-landing");
    await expect(landingLinks).toHaveCount(LANDINGS.length);
    expect(await landingLinks.evaluateAll((as) => as.map((a) => a.getAttribute("href")))).toEqual(LANDINGS);
    for (const href of LANDINGS) {
      await expect(page.locator(`main a[href="${href}"]`).first()).toBeVisible();
    }
    // Ninguno de los enlaces del sitio depende de `sr-only` ni del menú cerrado.
    for (const href of SITE_LINKS) {
      await expect(page.locator(`main a[href="${href}"], footer a[href="${href}"]`).first(), href).toBeVisible();
    }
    expect(await page.locator("main .sr-only").count()).toBe(0);
  });
});

test.describe("Móvil v2 · home · contenido", () => {
  test("casos con mockup que enlazan a su ficha /projects/<slug>, sin Trading App ni Biyoga", async ({ page }) => {
    await withConsent(page);
    await page.goto("/");
    const cases = page.getByTestId("m-home-cases");
    await expect(cases.getByTestId("m-home-projects-all")).toHaveAttribute("href", "/projects");
    const links = cases.getByTestId("m-case-link");
    const hrefs = await links.evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? ""));
    expect(hrefs.length).toBeGreaterThanOrEqual(3);
    for (const href of hrefs) expect(href).toMatch(/^\/projects\/[a-z0-9-]+$/);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    await expect(cases).not.toContainText(/biyoga/i);
    await expect(cases).not.toContainText(/^trading app$/im);
    // Autoescuela GTI: Antes / Ahora y la banda de Resultado con la cifra real.
    const first = page.getByTestId("m-case").first();
    await expect(first).toContainText("Antes");
    await expect(first).toContainText("Ahora");
    await expect(first).toContainText("×10");
    // La cifra sale UNA vez (banda de Resultado), no también en el «Ahora».
    expect((await first.innerText()).split("×10").length - 1).toBe(1);
    // Toda la tarjeta lleva a la ficha: el enlace del nombre se estira sobre la
    // portada, así que un toque en la imagen abre el caso.
    await first.scrollIntoViewIfNeeded();
    await first.click({ position: { x: 120, y: 120 } });
    await expect(page).toHaveURL(/\/projects\/autoescuela-gti$/);
  });

  test("reseñas reales con nombre y enlaces a Google y a /resenas", async ({ page }) => {
    await withConsent(page);
    await page.goto("/");
    await expect(page.getByTestId("m-home-review")).toHaveCount(3);
    await expect(page.getByTestId("m-home-reviews")).toContainText("22 reseñas en Google");
    await expect(page.getByTestId("m-home-reviews").getByTestId("m-google-profile")).toHaveAttribute("href", /maps\.google\.com\/\?cid=/);
    await expect(page.getByTestId("m-home-reviews-all")).toHaveAttribute("href", "/resenas");
  });

  test("servicios: 4 filas que enlazan a su landing", async ({ page }) => {
    await withConsent(page);
    await page.goto("/");
    const rows = page.getByTestId("m-home-service");
    await expect(rows).toHaveCount(4);
    for (const href of await rows.evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? ""))) {
      expect(LANDINGS).toContain(href);
    }
  });

  test("FAQ: <details> nativos que se abren y se cierran", async ({ page }) => {
    await withConsent(page);
    await page.goto("/");
    const items = page.getByTestId("m-home-faq-item");
    await expect(items).toHaveCount(5);
    await expect(items.first()).toHaveAttribute("open", "");
    const second = items.nth(1);
    await expect(second).not.toHaveAttribute("open", "");
    await expect(second.locator("p")).toBeHidden();
    await second.locator("summary").click();
    await expect(second).toHaveAttribute("open", "");
    await expect(second.locator("p")).toBeVisible();
    await second.locator("summary").click();
    await expect(second).not.toHaveAttribute("open", "");
    await expect(page.getByTestId("m-home-blog")).toHaveAttribute("href", "/blog");
  });
});

test.describe("Móvil v2 · home · conversión", () => {
  test("«Contar mi proyecto» lleva al formulario de /contact", async ({ page }) => {
    await withConsent(page);
    await page.goto("/");
    const cta = page.getByTestId("m-hero-cta");
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/contact");
    await expect(cta).toContainText(/contar mi proyecto/i);
    await expect(cta).toContainText("La primera reunión es gratis y sin compromiso");
    await expect(page.getByTestId("m-final-cta-form")).toHaveAttribute("href", "/contact");
    await cta.click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.locator("form").first()).toBeVisible();
  });

  test("WhatsApp: enlaces wa.me reales con ?text= y ningún tel:", async ({ page }) => {
    await withConsent(page);
    await blockExternal(page);
    await page.goto("/");
    await expect(page.getByTestId("m-hero-whatsapp")).toHaveAttribute("href", WHATSAPP);
    await expect(page.getByTestId("m-final-cta-whatsapp")).toHaveAttribute("href", WHATSAPP);
    const all = await page.locator('a[href*="wa.me"]').evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? ""));
    expect(all.length).toBeGreaterThanOrEqual(5);
    for (const href of all) expect(href).toMatch(WHATSAPP);
    // Un solo mensaje en toda la home, sin emojis.
    expect(new Set(all).size).toBe(1);
    expect(decodeURIComponent(all[0])).not.toMatch(/\p{Extended_Pictographic}/u);
    await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
  });

  test("barra fija: aparece al salir el CTA del hero y se esconde con el CTA final", async ({ page }) => {
    await withConsent(page);
    await page.goto("/");
    const bar = page.getByTestId("m-sticky-cta");
    await expect(bar).toBeHidden();
    await page.getByTestId("m-home-cases").scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 400));
    await expect(bar).toBeVisible();
    await expect(page.getByTestId("m-sticky-cta-whatsapp")).toHaveAttribute("href", WHATSAPP);
    // Con el CTA final a la vista (mismos dos botones) se esconde, y vuelve después.
    await page.getByTestId("m-home-final-cta").scrollIntoViewIfNeeded();
    await expect(bar).toBeHidden();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(bar).toBeVisible();
  });

  for (const width of [360, 390, 430]) {
    test(`sin overflow horizontal a ${width} px`, async ({ page }) => {
      await withConsent(page);
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/");
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
      ).toBe(0);
      // Ningún bloque se sale por la derecha (la tira de casos desplaza dentro de sí misma).
      const wide = await page.evaluate((w) => {
        const out: string[] = [];
        for (const el of Array.from(document.querySelectorAll("main > *, main section > *"))) {
          const r = el.getBoundingClientRect();
          if (r.right > w + 0.5) out.push(`${el.tagName}.${el.className.toString().slice(0, 40)}`);
        }
        return out;
      }, width);
      expect(wide).toEqual([]);
    });
  }
});
