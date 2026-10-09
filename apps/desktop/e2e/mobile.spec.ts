import { devices, type Page } from "@playwright/test";
import { test, expect } from "./fixtures";

/**
 * Web móvil v2 — base (layout raíz `app/(m)/m`, cabecera, menú, barra fija,
 * pie, banner de cookies) y routing del middleware (`lib/mobile-v2.ts`).
 *
 * Proyecto `mobile` de `playwright.config.ts`: iPhone con UA real a 390×844 y
 * cookie de QA `mv2=1`; el dev server corre con `MOBILE_V2=qa`. La home de
 * `/m` es provisional: estos tests solo miran la base, no el contenido.
 */

const WHATSAPP = /^https:\/\/wa\.me\/34614027410\?text=/;
const DESKTOP_UA = devices["Desktop Chrome"].userAgent;

/** Decisión de cookies guardada antes de cargar (misma clave que shared). */
async function withConsent(page: Page, value: "granted" | "denied") {
  await page.addInitScript((v) => localStorage.setItem("action-cookie-consent", v), value);
}

/** Sin red externa: GTM y wa.me no salen del test. */
async function blockExternal(page: Page) {
  await page.route(/googletagmanager\.com|wa\.me/, (route) => route.abort());
}

test.describe("Móvil v2 · routing", () => {
  test("con UA móvil + cookie mv2, `/` sirve el árbol móvil con los metadatos de escritorio", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("m-header")).toBeVisible();
    await expect(page).toHaveTitle("Action — Desarrollo de Aplicaciones y Webs en Vigo");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://actiondev.es");
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index, follow/);
    // JSON-LD de la entidad (Organization + WebSite), el mismo generador que escritorio.
    const types = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((nodes) => nodes.map((n) => JSON.parse(n.textContent ?? "{}")["@type"]));
    expect(types).toEqual(expect.arrayContaining([["Organization", "ProfessionalService"], "WebSite"]));
    // Nada del escritorio: ni persiana, ni Header holográfico, ni canvas 3D.
    await expect(page.getByTestId("page-blinds")).toHaveCount(0);
    await expect(page.getByTestId("main-nav")).toHaveCount(0);
    await expect(page.locator("canvas")).toHaveCount(0);
  });

  test("acceso directo a /m/* → 308 a la URL pública", async ({ request }) => {
    for (const [from, to] of [
      ["/m", "/"],
      ["/m/projects", "/projects"],
      ["/m/hablemos/app", "/hablemos/app"],
    ]) {
      const response = await request.get(from, { maxRedirects: 0 });
      expect(response.status(), from).toBe(308);
      expect(new URL(response.headers().location, "http://x").pathname, from).toBe(to);
    }
  });

  test("?mv2=0 quita la cookie y ?mv2=1 la pone, con redirección limpia", async ({ page }) => {
    await page.goto("/?mv2=0");
    expect(new URL(page.url()).search).toBe("");
    await expect(page.getByTestId("m-header")).toHaveCount(0);
    await page.goto("/?mv2=1");
    expect(new URL(page.url()).search).toBe("");
    await expect(page.getByTestId("m-header")).toBeVisible();
  });

  test("UA de escritorio en / → la escena 3D de siempre", async ({ browser }) => {
    const context = await browser.newContext({ userAgent: DESKTOP_UA, viewport: { width: 1440, height: 900 } });
    await context.addCookies([{ name: "mv2", value: "1", domain: "localhost", path: "/" }]);
    const page = await context.newPage();
    await page.addInitScript(() => sessionStorage.setItem("action-loaded", "1"));
    await page.goto("/");
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("m-header")).toHaveCount(0);
    await context.close();
  });

  test("tablet (iPad) y assets de /projects no pasan por el árbol móvil", async ({ request }) => {
    const ipad = devices["iPad (gen 7)"].userAgent;
    const home = await request.get("/", { headers: { "user-agent": ipad } });
    expect(await home.text()).not.toContain('data-testid="m-header"');
    const image = await request.get("/projects/fase.webp");
    expect(image.status()).toBe(200);
    expect(image.headers()["content-type"]).toContain("image/");
  });
});

test.describe("Móvil v2 · base", () => {
  test("cabecera: logo, WhatsApp real y botón MENÚ", async ({ page }) => {
    await withConsent(page, "denied");
    await page.goto("/");
    const header = page.getByTestId("m-header");
    await expect(header.getByRole("img", { name: "Action Development" })).toBeVisible();
    await expect(page.getByTestId("m-header-whatsapp")).toHaveAttribute("href", WHATSAPP);
    await expect(page.getByTestId("m-menu-open")).toHaveText(/men[uú]/i);
  });

  test("menú: abre, enlaza las 6 rutas, atrapa el foco y cierra con Esc y con Cerrar", async ({ page }) => {
    await withConsent(page, "denied");
    await page.goto("/");
    const opener = page.getByTestId("m-menu-open");
    const menu = page.getByTestId("m-menu");
    await expect(menu).toBeHidden();
    await expect(opener).toHaveAttribute("aria-expanded", "false");

    await opener.click();
    await expect(menu).toBeVisible();
    await expect(opener).toHaveAttribute("aria-expanded", "true");
    const links = page.getByTestId("m-menu-link");
    await expect(links).toHaveCount(6);
    expect(await links.evaluateAll((as) => as.map((a) => a.getAttribute("href")))).toEqual([
      "/",
      "/servicios",
      "/projects",
      "/resenas",
      "/blog",
      "/contact",
    ]);
    await expect(links.first()).toHaveAttribute("aria-current", "page");
    await expect(page.getByTestId("m-menu-whatsapp")).toHaveAttribute("href", WHATSAPP);
    // El scroll del documento queda bloqueado.
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("hidden");

    // Foco atrapado: 20 tabulaciones y nunca sale del diálogo.
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab");
      expect(await menu.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press("Shift+Tab");
    expect(await menu.evaluate((d) => d.contains(document.activeElement))).toBe(true);

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(opener).toHaveAttribute("aria-expanded", "false");
    await expect(opener).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");

    await opener.click();
    await page.getByTestId("m-menu-close").click();
    await expect(menu).toBeHidden();
  });

  test("barra fija: oculta con el hero a la vista, aparece al salir, con WhatsApp real", async ({ page }) => {
    await withConsent(page, "denied");
    await page.goto("/");
    const bar = page.getByTestId("m-sticky-cta");
    await expect(bar).toBeHidden();
    await page.getByTestId("m-footer").scrollIntoViewIfNeeded();
    await expect(bar).toBeVisible();
    await expect(page.getByTestId("m-sticky-cta-form")).toHaveText(/contar mi proyecto/i);
    await expect(page.getByTestId("m-sticky-cta-whatsapp")).toHaveAttribute("href", WHATSAPP);
    // Pegada abajo y del alto de la barra (64 px + 2 de filete).
    const box = await bar.boundingBox();
    expect(box && Math.round(box.y + box.height)).toBe(844);
    expect(box && box.height).toBeLessThanOrEqual(68);
    // El pie reserva ese alto: lo último del pie queda por encima de la barra.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const last = await page.getByTestId("cookie-preferences-link").boundingBox();
    expect(last && box && last.y + last.height).toBeLessThanOrEqual(box!.y);
  });

  test("barra fija: no aparece mientras el banner de cookies está abierto", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("cookie-consent")).toBeVisible();
    await page.getByTestId("m-footer").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("m-sticky-cta")).toBeHidden();
    await page.getByTestId("cookie-consent-reject").click();
    await expect(page.getByTestId("m-sticky-cta")).toBeVisible();
  });

  test("pie: titularidad, WhatsApp, email y enlaces legales con Preferencias de cookies", async ({ page }) => {
    await withConsent(page, "denied");
    await page.goto("/");
    const footer = page.getByTestId("m-footer");
    await expect(footer).toContainText("Alcasi Systems, S.L.");
    await expect(footer).toContainText("B72910664");
    await expect(footer).toContainText("Domicilio social");
    await expect(footer).toContainText("Rúa Colón, 20");
    await expect(page.getByTestId("m-footer-whatsapp")).toHaveAttribute("href", WHATSAPP);
    await expect(page.getByTestId("m-footer-email")).toHaveAttribute("href", "mailto:hi@actiondev.es");
    // Rejilla 2 × 3: las mismas secciones que enlaza el Header de escritorio, más Google y contacto,
    // y una fila entera con la página de la entidad.
    expect(await page.getByTestId("m-footer-nav").locator("a").evaluateAll((as) => as.map((a) => a.getAttribute("href")))).toEqual([
      "/projects",
      "/servicios",
      "/resenas",
      "/blog",
      "https://maps.google.com/?cid=18162141466997281764",
      "/contact",
      "/sobre-nosotros",
    ]);
    const legal = page.getByTestId("m-footer-legal");
    expect(await legal.locator("a").evaluateAll((as) => as.map((a) => a.getAttribute("href")))).toEqual([
      "/legal/aviso-legal",
      "/legal/privacy",
      "/legal/terms",
      "/legal/cookies",
    ]);
    await expect(page.getByTestId("cookie-consent")).toHaveCount(0);
    await page.getByTestId("cookie-preferences-link").click();
    await expect(page.getByTestId("cookie-consent")).toBeVisible();
  });

  test("banner de cookies: Rechazar y Aceptar idénticos, ≤ 120 px y enlace a la política", async ({ page }) => {
    await page.goto("/");
    const banner = page.getByTestId("cookie-consent");
    await expect(banner).toBeVisible();
    const box = await banner.boundingBox();
    expect(box!.height).toBeLessThanOrEqual(120);
    await expect(banner.locator('a[href="/legal/cookies"]')).toBeVisible();

    const reject = page.getByTestId("cookie-consent-reject");
    const accept = page.getByTestId("cookie-consent-accept");
    expect(await reject.getAttribute("class")).toBe(await accept.getAttribute("class"));
    const [r, a] = await Promise.all([reject.boundingBox(), accept.boundingBox()]);
    expect(Math.round(r!.width)).toBe(Math.round(a!.width));
    expect(Math.round(r!.height)).toBe(Math.round(a!.height));
    const style = (el: Element) => {
      const s = getComputedStyle(el);
      return [s.backgroundColor, s.color, s.fontSize, s.fontWeight].join("|");
    };
    expect(await reject.evaluate(style)).toBe(await accept.evaluate(style));

    await reject.click();
    await expect(banner).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("action-cookie-consent"))).toBe("denied");
  });

  test("click_whatsapp llega al dataLayer solo tras aceptar", async ({ page }) => {
    await blockExternal(page);
    await page.goto("/");
    // Sin navegar a wa.me: el listener de medición es de captura y va antes.
    await page.evaluate(() => document.addEventListener("click", (e) => e.preventDefault()));
    const clicks = () =>
      page.evaluate(
        () =>
          ((window as unknown as { dataLayer?: Array<{ event?: string }> }).dataLayer ?? []).filter(
            (e) => e && e.event === "click_whatsapp",
          ).length,
      );

    await page.getByTestId("m-header-whatsapp").click();
    expect(await clicks()).toBe(0);

    await page.getByTestId("cookie-consent-accept").click();
    await page.getByTestId("m-header-whatsapp").click();
    await expect.poll(clicks).toBe(1);
  });

  for (const width of [320, 360, 390, 430]) {
    test(`sin overflow horizontal a ${width} px (página y menú)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/");
      const overflow = () =>
        page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(await overflow()).toBe(0);
      await page.getByTestId("cookie-consent-reject").click();
      await page.getByTestId("m-menu-open").click();
      const menu = page.getByTestId("m-menu");
      expect(await menu.evaluate((d) => d.scrollWidth - d.clientWidth)).toBe(0);
    });
  }
});
