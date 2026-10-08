import { devices, type Page } from "@playwright/test";
import { test, expect } from "./fixtures";

/**
 * Web móvil v2 — contacto y landings de anuncios: `/hablemos/[oferta]`,
 * `/hablemos/gracias` y `/contact` del árbol `app/(m)/m`.
 *
 * Autocontenido: fija aquí el iPhone (UA real, 390×844) y la cookie de QA
 * `mv2=1`, así corre igual desde un config propio que desde cualquier
 * proyecto de `playwright.config.ts`. El servidor tiene que ir con
 * `MOBILE_V2=qa` (lo arranca así el `webServer` del config).
 */

test.use({
  userAgent: devices["iPhone 13"].userAgent,
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  storageState: {
    cookies: [
      { name: "mv2", value: "1", domain: "localhost", path: "/", expires: -1, httpOnly: true, secure: false, sameSite: "Lax" },
    ],
    origins: [],
  },
});

const ADSBOT_UA =
  "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; AdsBot-Google-Mobile; +http://www.google.com/mobile/adsbot.html)";
const DESKTOP_UA = devices["Desktop Chrome"].userAgent;

const OFFERS = [
  { slug: "app", text: "Hola, vengo de vuestra web y quiero hablar de una app a medida" },
  { slug: "software", text: "Hola, vengo de vuestra web y quiero hablar de un software de gestión a medida" },
] as const;

const PAGES = ["/hablemos/app", "/hablemos/software", "/hablemos/gracias?tipo=app", "/contact"] as const;

/** Decisión de cookies guardada antes de cargar (misma clave que shared). */
async function withConsent(page: Page, value: "granted" | "denied") {
  await page.addInitScript((v) => localStorage.setItem("action-cookie-consent", v), value);
}

/** Sin red externa: GTM y wa.me no salen del test. */
async function blockExternal(page: Page) {
  await page.route(/googletagmanager\.com|wa\.me|maps\.google|chatgpt|claude\.ai|google\.com\/search/, (route) => route.abort());
}

/**
 * Copia en `sessionStorage` cada evento que entra al `dataLayer`, para leerlo
 * aunque la redirección a `/gracias` recargue el documento.
 */
async function recordDataLayer(page: Page) {
  await page.addInitScript(() => {
    const dl: unknown[] = [];
    const push = dl.push.bind(dl);
    dl.push = (...items: unknown[]) => {
      for (const item of items) {
        if (item && typeof item === "object" && "event" in item) {
          const log = JSON.parse(sessionStorage.getItem("__dl") ?? "[]");
          log.push(item);
          sessionStorage.setItem("__dl", JSON.stringify(log));
        }
      }
      return push(...items);
    };
    (window as unknown as { dataLayer: unknown[] }).dataLayer = dl;
  });
}

async function leadEvents(page: Page) {
  return page.evaluate(() =>
    (JSON.parse(sessionStorage.getItem("__dl") ?? "[]") as Array<{ event?: string }>).filter(
      (e) => e.event === "generate_lead",
    ),
  );
}

/** Paso 1 → paso 2 → datos válidos → enviar. */
async function fillAndSubmit(page: Page, stage = "idea") {
  await page.getByTestId(`m-lead-field-stage-${stage}`).check();
  await page.getByTestId("m-lead-next").click();
  await expect(page.getByTestId("m-lead-step-2")).toBeVisible();
  await expect(page.getByTestId("m-lead-field-name")).toBeFocused();
  await page.getByTestId("m-lead-field-name").fill("Ana");
  await page.getByTestId("m-lead-field-phone").fill("600 123 456");
  await page.getByTestId("m-lead-field-email").fill("ana@empresa.es");
  await page.getByTestId("m-lead-field-budget-unknown").check();
  await page.getByTestId("m-lead-submit").click();
}

async function mockLead(page: Page) {
  const bodies: Record<string, unknown>[] = [];
  await page.route("**/api/lead", async (route) => {
    bodies.push(route.request().postDataJSON());
    await route.fulfill({ json: { ok: true, id: "test-id" } });
  });
  return bodies;
}

test.describe("Móvil v2 · /hablemos/[oferta]", () => {
  for (const { slug, text } of OFFERS) {
    test(`/hablemos/${slug}: árbol móvil, noindex, sin fugas y WhatsApp con el mensaje de la oferta`, async ({ page }) => {
      await withConsent(page, "denied");
      await blockExternal(page);
      const response = await page.goto(`/hablemos/${slug}`);
      expect(response?.status()).toBe(200);

      await expect(page.getByTestId("m-header")).toBeVisible();
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.getByTestId("m-ads-h1")).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://actiondev.es/hablemos/${slug}`);
      await expect(page.locator("main#main-content")).toHaveCount(1);

      // Página de campaña: ni menú ni logo enlazado (criterio de `CampaignBar`).
      await expect(page.getByTestId("m-menu-open")).toHaveCount(0);
      await expect(page.getByTestId("m-header").locator("a")).toHaveCount(1);
      await expect(page.locator('header a[href="/"]')).toHaveCount(0);

      // Formulario: 4 opciones de campaña, la de la oferta marcada.
      await expect(page.getByTestId("m-lead-form")).toHaveAttribute("id", "proyecto");
      await expect(page.locator('[data-testid^="m-lead-field-need-"]')).toHaveCount(4);
      await expect(page.getByTestId(`m-lead-field-need-${slug}`)).toBeChecked();

      // WhatsApp: siempre `wa.me` con el mensaje de la oferta. Ningún `tel:`.
      await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
      for (const id of ["m-header-whatsapp", "m-sticky-cta-whatsapp", "m-footer-whatsapp", "m-ads-closing-whatsapp"]) {
        const href = (await page.getByTestId(id).getAttribute("href")) ?? "";
        expect(href, id).toMatch(/^https:\/\/wa\.me\/34614027410\?text=/);
        expect(decodeURIComponent(href), id).toContain(text);
      }

      // Contenido de `ads-landings.ts`: reseña del hero, casos en pestaña nueva, pasos y FAQ.
      await expect(page.getByTestId("m-ads-hero-review")).toBeVisible();
      await expect(page.getByTestId("m-ads-rating")).toContainText("5,0 en Google · 22 reseñas");
      const cases = page.locator('[data-testid^="m-ads-case-"]');
      expect(await cases.count()).toBeGreaterThan(0);
      for (const link of await cases.all()) await expect(link).toHaveAttribute("target", "_blank");
      await expect(page.locator("ol > li")).toHaveCount(4);
      await expect(page.locator("main details")).toHaveCount(5);
      await expect(page.locator("main")).toContainText("La primera reunión es gratis y sin compromiso");

      // Pie mínimo con la titularidad legal completa.
      const footer = page.getByTestId("m-footer");
      await expect(footer).toContainText("Alcasi Systems, S.L.");
      await expect(footer).toContainText("B72910664");
      await expect(footer).toContainText("Domicilio social");
      await expect(footer).toContainText("Rúa Colón, 20");
      await expect(page.getByTestId("m-footer-email")).toHaveAttribute("href", "mailto:hi@actiondev.es");
      expect(await page.getByTestId("m-footer-legal").locator("a").evaluateAll((as) => as.map((a) => a.getAttribute("href")))).toEqual([
        "/legal/aviso-legal",
        "/legal/privacy",
        "/legal/terms",
        "/legal/cookies",
      ]);
      // Sin navegación de sitio en el pie (variante mínima).
      await expect(footer.locator('a[href="/projects"]')).toHaveCount(0);
    });
  }

  test("paso 1 entero por encima del pliegue con el banner de cookies abierto (390×844)", async ({ page }) => {
    for (const { slug } of OFFERS) {
      await page.goto(`/hablemos/${slug}`);
      const banner = page.getByTestId("cookie-consent");
      await expect(banner).toBeVisible();
      const fold = (await banner.boundingBox())!.y;
      const bottoms = await page
        .locator('[data-testid="m-lead-step-1"] label, [data-testid="m-lead-next"]')
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().bottom));
      expect(bottoms.length, slug).toBe(4 + 3 + 1);
      expect(Math.max(...bottoms), slug).toBeLessThanOrEqual(fold);
      // Y la página no se ha movido: es la primera pantalla.
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
    }
  });

  test("envío completo: mock de /api/lead → 200 → /hablemos/gracias?tipo=, con gclid y utm en el payload", async ({ page }) => {
    await withConsent(page, "denied");
    await blockExternal(page);
    const bodies = await mockLead(page);
    await page.goto("/hablemos/app?utm_source=google&utm_medium=cpc&utm_campaign=apps-vigo&gclid=abc123");

    // Sin elegir en qué punto está, no avanza.
    await page.getByTestId("m-lead-next").click();
    await expect(page.getByTestId("m-lead-error-stage")).toBeVisible();
    await fillAndSubmit(page);

    await expect(page).toHaveURL(/\/hablemos\/gracias\?tipo=app$/);
    await expect(page.getByTestId("m-gracias-h1")).toContainText("Recibido");
    await expect(page.getByTestId("m-header")).toBeVisible();
    expect(bodies).toHaveLength(1);
    expect(bodies[0]).toMatchObject({
      source: "ads_landing",
      offer: "app",
      need: "app",
      stage: "idea",
      name: "Ana",
      phone: "600 123 456",
      email: "ana@empresa.es",
      budget: "unknown",
      contactPreference: "whatsapp",
      consent: "denied",
      website: "",
      attribution: {
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: "apps-vigo",
        gclid: "abc123",
        landingPath: "/hablemos/app",
      },
    });
    expect(typeof bodies[0].elapsedMs).toBe("number");
  });

  test("generate_lead solo llega al dataLayer con consentimiento", async ({ browser }) => {
    for (const consent of ["denied", "granted"] as const) {
      const context = await browser.newContext({
        userAgent: devices["iPhone 13"].userAgent,
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
      await context.addCookies([{ name: "mv2", value: "1", domain: "localhost", path: "/" }]);
      const page = await context.newPage();
      await withConsent(page, consent);
      await blockExternal(page);
      await recordDataLayer(page);
      await mockLead(page);
      await page.goto("/hablemos/software?gclid=xyz");
      await fillAndSubmit(page, "defined");
      await expect(page).toHaveURL(/\/hablemos\/gracias\?tipo=software$/);

      const events = await leadEvents(page);
      if (consent === "denied") {
        expect(events).toHaveLength(0);
      } else {
        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({
          event: "generate_lead",
          lead_id: "test-id",
          transaction_id: "test-id",
          lead_source: "ads_landing",
          lead_need: "software",
          lead_budget: "unknown",
          page_path: "/hablemos/software",
          user_data: { email: "ana@empresa.es", phone_number: "+34600123456" },
        });
      }
      // La página de gracias NO mide al cargar.
      await page.reload();
      expect(await leadEvents(page)).toHaveLength(consent === "granted" ? 1 : 0);
      await context.close();
    }
  });

  test("un fallo de envío muestra el error con salida por WhatsApp y no redirige", async ({ page }) => {
    await withConsent(page, "denied");
    await blockExternal(page);
    await page.route("**/api/lead", (route) => route.fulfill({ status: 502, json: { ok: false } }));
    await page.goto("/hablemos/app");
    await fillAndSubmit(page);
    await expect(page.getByTestId("m-lead-error")).toContainText("No se ha podido enviar");
    await expect(page.getByTestId("m-lead-whatsapp")).toHaveAttribute("href", /^https:\/\/wa\.me\//);
    await expect(page.getByTestId("m-lead-submit")).toBeEnabled();
    expect(new URL(page.url()).pathname).toBe("/hablemos/app");
  });

  test("barra fija: oculta arriba y con el formulario a la vista, aparece después y lleva a #proyecto", async ({ page }) => {
    await withConsent(page, "denied");
    await page.goto("/hablemos/app");
    const bar = page.getByTestId("m-sticky-cta");
    await expect(bar).toBeHidden();
    await page.locator("ol").first().scrollIntoViewIfNeeded();
    await expect(bar).toBeVisible();
    await expect(page.getByTestId("m-sticky-cta-form")).toHaveAttribute("href", "#proyecto");
    await page.getByTestId("m-sticky-cta-form").click();
    await expect(page.getByTestId("m-lead-form")).toBeInViewport();
    await expect(bar).toBeHidden();
  });

  test("AdsBot-Google-Mobile (con la cookie de QA) recibe 200, el árbol móvil y noindex", async ({ request }) => {
    for (const { slug } of OFFERS) {
      const response = await request.get(`/hablemos/${slug}`, { headers: { "user-agent": ADSBOT_UA, cookie: "mv2=1" } });
      expect(response.status(), slug).toBe(200);
      const html = await response.text();
      expect(html, slug).toContain('data-testid="m-header"');
      expect(html, slug).toContain('<meta name="robots" content="noindex, follow"/>');
      expect(html.indexOf("<title>"), slug).toBeLessThan(html.indexOf("</head>"));
      expect(html, slug).not.toContain('href="tel:');
    }
  });

  test("UA de escritorio con la cookie sigue viendo la landing de escritorio", async ({ request }) => {
    const html = await (await request.get("/hablemos/app", { headers: { "user-agent": DESKTOP_UA, cookie: "mv2=1" } })).text();
    expect(html).toContain('data-testid="ads-h1"');
    expect(html).not.toContain('data-testid="m-header"');
  });

  test("oferta desconocida devuelve 404", async ({ page }) => {
    const response = await page.goto("/hablemos/xxx");
    expect(response?.status()).toBe(404);
  });
});

test.describe("Móvil v2 · /hablemos/gracias", () => {
  test("noindex, ?tipo= validado y WhatsApp con el tipo y sin datos personales", async ({ page }) => {
    await withConsent(page, "denied");
    await page.goto("/hablemos/gracias?tipo=software");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://actiondev.es/hablemos/gracias");
    const href = (await page.getByTestId("m-gracias-whatsapp").getAttribute("href")) ?? "";
    expect(decodeURIComponent(href)).toContain("Hola, acabo de enviar mi proyecto de software de gestión desde la web");
    expect(decodeURIComponent((await page.getByTestId("m-header-whatsapp").getAttribute("href")) ?? "")).toContain(
      "proyecto de software de gestión",
    );

    await page.goto("/hablemos/gracias?tipo=<script>");
    const generic = (await page.getByTestId("m-gracias-whatsapp").getAttribute("href")) ?? "";
    expect(decodeURIComponent(generic)).toContain("Hola, acabo de enviar mi proyecto desde la web");
    expect(generic).not.toContain("script");
  });

  test("siguientes pasos, casos en pestaña nueva, sin tel: ni menú", async ({ page }) => {
    await withConsent(page, "denied");
    await page.goto("/hablemos/gracias?tipo=app");
    await expect(page.getByTestId("m-gracias-steps").locator("li")).toHaveCount(3);
    await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
    await expect(page.getByTestId("m-menu-open")).toHaveCount(0);
    const cases = page.locator('[data-testid^="m-gracias-case-"]');
    expect(await cases.count()).toBeGreaterThan(0);
    for (const c of await cases.all()) await expect(c).toHaveAttribute("target", "_blank");
  });
});

test.describe("Móvil v2 · /contact", () => {
  test("mismos metadatos y JSON-LD que escritorio, H1 y enlaces indexables visibles", async ({ page }) => {
    await withConsent(page, "denied");
    await page.goto("/contact");
    await expect(page.getByTestId("m-header")).toBeVisible();
    await expect(page).toHaveTitle("Contacto — Agencia de desarrollo en Vigo — Action");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "Action, agencia de desarrollo web y apps en Rúa Colón, 20, 36201 Vigo. WhatsApp +34 614 02 74 10 o hi@actiondev.es: te responde una persona.",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://actiondev.es/contact");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index, follow/);
    const types = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((nodes) => nodes.map((n) => JSON.parse(n.textContent ?? "{}")["@type"]));
    expect(types).toEqual([["Organization", "ProfessionalService"], "WebSite"]);

    await expect(page.locator("h1")).toHaveText("Escríbenos directamente");
    await expect(page.locator("main")).toContainText("¿Prefieres que te contactemos?");
    await expect(page.locator("main")).toContainText("Pregunta a la IA sobre nosotros");
    for (const href of ["/projects", "/resenas", "/blog"]) {
      await expect(page.locator(`main a[href="${href}"]`), href).toBeVisible();
    }
    // Canales directos: WhatsApp con mensaje, email y oficina con la ficha de Google. Ningún `tel:`.
    await expect(page.getByTestId("m-contact-whatsapp")).toHaveAttribute("href", /^https:\/\/wa\.me\/34614027410\?text=/);
    await expect(page.getByTestId("m-contact-email")).toHaveAttribute("href", /^mailto:hi@actiondev\.es\?subject=/);
    await expect(page.getByTestId("m-contact-office")).toHaveAttribute("href", "https://maps.google.com/?cid=18162141466997281764");
    await expect(page.getByTestId("m-contact-office")).toContainText("Rúa Colón, 20");
    await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
    await expect(page.getByTestId("m-contact-ai").locator("a")).toHaveCount(3);
  });

  test("formulario completo: atribuye como contact_page y redirige a /hablemos/gracias", async ({ page }) => {
    await withConsent(page, "denied");
    await blockExternal(page);
    const bodies = await mockLead(page);
    await page.goto("/contact?utm_source=newsletter");
    await expect(page.getByTestId("m-lead-form")).toHaveAttribute("id", "formulario");
    await page.getByTestId("m-lead-field-need-web").check();
    await fillAndSubmit(page, "existing");
    await expect(page).toHaveURL(/\/hablemos\/gracias\?tipo=web$/);
    expect(bodies[0]).toMatchObject({
      source: "contact_page",
      offer: "contact",
      need: "web",
      stage: "existing",
      attribution: { utmSource: "newsletter", landingPath: "/contact" },
    });
  });
});

test.describe("Móvil v2 · contacto y campaña sin overflow", () => {
  for (const width of [360, 390, 430]) {
    test(`sin overflow horizontal a ${width} px (y en el paso 2)`, async ({ page }) => {
      await withConsent(page, "denied");
      await page.setViewportSize({ width, height: 844 });
      const overflow = () =>
        page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      for (const path of PAGES) {
        await page.goto(path);
        expect(await overflow(), path).toBe(0);
        if (!path.includes("gracias")) {
          await page.getByTestId("m-lead-field-stage-idea").check();
          await page.getByTestId("m-lead-next").click();
          await expect(page.getByTestId("m-lead-step-2")).toBeVisible();
          expect(await overflow(), `${path} paso 2`).toBe(0);
        }
      }
    });
  }
});
