import { test, expect } from "@playwright/test";

// Smoke tests — verify critical paths don't break on every deploy.
// Not testing implementation details, only user-visible behaviour.

test.describe("Home page", () => {
  test("loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    expect(errors).toHaveLength(0);
  });

  test("renders hero section", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator("#home");
    await expect(hero).toBeVisible();
  });

  test("header is visible with nav links", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByRole("banner")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("main-nav")).toBeVisible();
  });

  test("gull tally easter egg stays hidden until a gull is shot", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("gull-tally")).toHaveCount(0);
  });

  test("lighthouse alert: swarm, no shooting, and one gull cracks the screen", async ({ page }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    // Fase fija: el faro se proyecta siempre en el mismo píxel.
    await page.goto("/?hora=dia");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(5000);

    // El faro de Cíes, sobre las islas. Una gaviota que pase por delante se
    // queda el click (prioridad gaviota > faro), así que se reintenta.
    const vignette = page.getByTestId("gull-alert-vignette");
    for (let i = 0; i < 10 && (await vignette.count()) === 0; i++) {
      await page.mouse.click(541, 530);
      await page.waitForTimeout(400);
    }
    await expect(vignette).toBeVisible();

    // Mientras dura la alerta NO se dispara: clicar gaviotas no abre contador.
    for (const [x, y] of [[440, 225], [830, 225], [1240, 225]]) await page.mouse.click(x, y);
    await page.waitForTimeout(400);
    await expect(page.getByTestId("gull-tally")).toHaveCount(0);

    // La embestida agrieta la pantalla y con ella se acaba el easter egg.
    await expect(page.getByTestId("screen-crack")).toHaveCount(1, { timeout: 15_000 });
    await expect(vignette).toHaveCount(0);

    expect(errors).toEqual([]);
  });

  test("home is a single full-viewport screen (no sections below the game)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#projects")).toHaveCount(0);
    await expect(page.locator("#contact")).toHaveCount(0);
    await expect(page.locator("footer")).toHaveCount(0);
  });

  test("hero remote control moves the crane and drops the hook", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const remote = page.getByTestId("hero-remote");
    await expect(remote).toBeVisible({ timeout: 15_000 });

    // Mantener la flecha derecha marca el botón como pulsado (y mueve el carro).
    const right = page.getByTestId("remote-right");
    await right.hover();
    await page.mouse.down();
    await expect(right).toHaveAttribute("data-pressed", "true");
    await page.mouse.up();
    await expect(right).toHaveAttribute("data-pressed", "false");

    // El teclado físico hunde el botón correspondiente del mando.
    await page.keyboard.down("KeyA");
    await expect(page.getByTestId("remote-left")).toHaveAttribute("data-pressed", "true");
    await page.keyboard.up("KeyA");
    await expect(page.getByTestId("remote-left")).toHaveAttribute("data-pressed", "false");

    // El botón de gancho no debe romper el bucle de juego.
    await page.getByTestId("remote-hook").click();
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });
});

test.describe("Crane drag", () => {
  test("the trolley/cabin can be grabbed and dragged", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/?hora=dia");
    await expect(page.getByTestId("hero-remote")).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(3500);

    const canvas = page.locator("canvas").first();
    const cursor = () => canvas.evaluate((c) => (c as HTMLElement).style.cursor);

    // Sobre la cabina el cursor invita a agarrarla; mientras se arrastra, "grabbing".
    await page.mouse.move(1040, 262);
    await expect.poll(cursor).toBe("grab");
    await page.mouse.down();
    await page.mouse.move(700, 262, { steps: 10 });
    await expect.poll(cursor).toBe("grabbing");
    await page.mouse.up();
    await page.mouse.move(700, 600);
    await expect.poll(cursor).not.toBe("grabbing");
    expect(errors).toHaveLength(0);
  });
});

test.describe("Navigation", () => {
  test("language toggle switches locale", async ({ page }) => {
    await page.goto("/");
    const toggle = page.locator('button[aria-label*="nglish"], button[aria-label*="spañol"]').first();
    await expect(toggle).toBeVisible();
  });

  test("CTA link points to contact", async ({ page }) => {
    await page.goto("/");
    const cta = page.locator('a[href="/contact"]').first();
    await expect(cta).toBeVisible();
  });
});

test.describe("Projects page", () => {
  // /projects es la sala recreativa 3D: pasillo con una máquina por proyecto
  // y la puerta de contacto al fondo. `?quieto` congela la mirada del ratón.
  test("monta la sala y recoge la persiana", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/projects?quieto");
    await expect(page.getByTestId("arcade-scene")).toBeVisible();
    await expect(page.locator('[data-testid="arcade-scene"] canvas')).toHaveCount(1);
    await expect(page.getByTestId("arcade-curtain")).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByTestId("arcade-hint")).toHaveAttribute("data-step", "walk");
    expect(errors).toHaveLength(0);
  });

  test("la lista lleva a todos los proyectos", async ({ page }) => {
    await page.goto("/projects?quieto");
    const toggle = page.getByTestId("arcade-list-toggle");
    const list = page.getByTestId("arcade-list");

    // Cerrada no se ve, pero los enlaces están en el HTML (buscadores).
    await expect(list).toBeHidden();
    expect(await list.locator('a[href^="/projects/"]').count()).toBeGreaterThan(30);

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(list).toBeVisible();

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(list).toBeHidden();
  });

  test("Enter acopla la máquina enfocada y Esc devuelve al pasillo", async ({ page }) => {
    await page.goto("/projects?quieto");
    await expect(page.getByTestId("arcade-curtain")).toHaveCount(0, { timeout: 20_000 });

    // Fila izquierda: mirándola, "a tu derecha" es el fondo del pasillo, donde
    // siempre hay otra máquina (en la derecha, la primera no tiene vecina).
    await page.keyboard.press("ArrowLeft");
    const focus = page.getByTestId("arcade-focus");
    await expect(focus).toBeVisible();
    await expect(page.getByTestId("arcade-hint")).toHaveAttribute("data-step", "done");
    const slug = await focus.getAttribute("data-project");

    // Elegir NO navega: la pantalla de la máquina se enciende con su ficha.
    await page.keyboard.press("Enter");
    const screen = page.getByTestId("arcade-screen");
    await expect(screen).toBeVisible({ timeout: 5_000 });
    await expect(screen).toHaveAttribute("data-project", slug!);
    await expect(page).toHaveURL(/\/projects(\?quieto)?$/);
    await expect(page.getByTestId("arcade-screen-close")).toBeVisible();

    // → pasa a la máquina de al lado sin salir.
    await page.keyboard.press("ArrowRight");
    await expect(screen).not.toHaveAttribute("data-project", slug!, { timeout: 5_000 });

    await page.keyboard.press("Escape");
    await expect(page.getByTestId("arcade-screen-layer")).toHaveCount(0);
    await expect(page.getByTestId("arcade-focus")).toBeVisible();
  });

  test("el botón de salir y el clic fuera de la pantalla vuelven al pasillo", async ({ page }) => {
    await page.goto("/projects?quieto");
    await expect(page.getByTestId("arcade-curtain")).toHaveCount(0, { timeout: 20_000 });

    await page.keyboard.press("ArrowLeft");
    await page.getByTestId("arcade-focus").click();
    await expect(page.getByTestId("arcade-screen")).toBeVisible({ timeout: 5_000 });
    await page.getByTestId("arcade-screen-close").click();
    await expect(page.getByTestId("arcade-screen-layer")).toHaveCount(0);

    await page.getByTestId("arcade-focus").click();
    await expect(page.getByTestId("arcade-screen")).toBeVisible({ timeout: 5_000 });
    await page.mouse.click(20, 400);
    await expect(page.getByTestId("arcade-screen-layer")).toHaveCount(0);
  });

  test("la puerta del fondo se cruza y la persiana entra ya cerrada", async ({ page }) => {
    // El Chromium headless de Playwright pinta WebGL por software a ~9 fps y
    // el paso de cada frame está acotado: los 24 m del pasillo + la entrada a
    // la sala de neón tardan ~21 s (medido 2026-10-02, igual con el código
    // anterior y en producción). Con 20 s el test fallaba siempre.
    test.setTimeout(75_000);
    await page.goto("/projects?quieto");
    await expect(page.getByTestId("arcade-curtain")).toHaveCount(0, { timeout: 20_000 });

    // Se apuntan las fases de la persiana: con el relevo desde la sala de neón
    // pasa de `idle` a `closed` sin `closing` (el último frame 3D YA es ella).
    await page.evaluate(() => {
      const el = document.querySelector('[data-testid="page-blinds"]')!;
      const w = window as unknown as { __blinds: string[] };
      w.__blinds = [];
      new MutationObserver(() => w.__blinds.push(el.getAttribute("data-state")!)).observe(el, {
        attributes: true,
        attributeFilter: ["data-state"],
      });
    });

    await page.keyboard.down("ArrowUp");
    await expect(page).toHaveURL(/\/contact$/, { timeout: 45_000 });
    await page.keyboard.up("ArrowUp");
    await expect(page.getByTestId("page-blinds")).toHaveAttribute("data-state", "idle", { timeout: 5_000 });

    const phases = await page.evaluate(() => (window as unknown as { __blinds: string[] }).__blinds);
    expect(phases[0]).toBe("closed");
    expect(phases).not.toContain("closing");
  });
});

test.describe("Contact page", () => {
  test("offers WhatsApp and email as direct links", async ({ page }) => {
    await page.goto("/contact");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/contact$/);

    // No hay backend: ambos canales son enlaces que abren la app del visitante
    // con el mensaje ya redactado. Si vuelve a aparecer un <form>, es un bug.
    await expect(page.locator("form")).toHaveCount(0);

    const whatsapp = page.locator('[data-channel="whatsapp"]');
    await expect(whatsapp).toHaveAttribute("href", /^https:\/\/wa\.me\/\d+\?text=.+/);

    const email = page.locator('[data-channel="email"]');
    await expect(email).toHaveAttribute("href", /^mailto:[^@]+@[^?]+\?subject=.+&body=.+/);
  });

  test("la calle se recoge y el portero abre el 'llámame tú'", async ({ page }) => {
    await page.goto("/contact?quieto");
    await expect(page.getByTestId("street-curtain")).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByTestId("street-scene")).toBeVisible();
    // Las etiquetas de los tres objetos de la calle.
    for (const id of ["whatsapp", "email", "callback"]) {
      await expect(page.getByTestId(`street-tag-${id}`)).toBeAttached();
    }

    // Apuntar un canal del HUD resalta su objeto en la calle.
    await page.locator('[data-channel="email"]').hover();
    await expect(page.getByTestId("street-tag-email")).toHaveAttribute("data-active", "true");

    // El botón del HUD hace lo mismo que el portero: abre el campo y lo enfoca.
    await page.getByTestId("callback-toggle").click();
    await expect(page.getByTestId("callback-form")).toBeVisible();
    await expect(page.locator("#contact-callback-phone")).toBeFocused();
  });
});

test.describe("Reviews page", () => {
  test("redirects to the 3D plaza", async ({ page }) => {
    await page.goto("/reviews");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/resenas$/);
  });
});

test.describe("Blog", () => {
  test("pin board renders one post-it per post, each linking to its article", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/blog");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByTestId("pin-board")).toBeVisible();
    const notes = page.getByTestId("post-it");
    const count = await notes.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const link = notes.nth(i).locator("a");
      await expect(link).toHaveAttribute("href", /^\/blog\/[\w-]+$/);
      await expect(link.locator("h2")).not.toBeEmpty();
    }
    expect(errors).toHaveLength(0);
  });
});

test.describe("SEO landing pages", () => {
  test("core landing renders h1, FAQ and JSON-LD", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/desarrollo-de-aplicaciones-vigo");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("h1")).toHaveText(
      "Desarrollo de aplicaciones en Vigo",
    );
    await expect(page.locator("details").first()).toBeVisible();
    expect(
      await page.locator('script[type="application/ld+json"]').count(),
    ).toBeGreaterThan(0);
    expect(errors).toHaveLength(0);
  });

  test("servicios hub links every landing", async ({ page }) => {
    await page.goto("/servicios");
    await page.waitForLoadState("domcontentloaded");

    for (const slug of [
      "desarrollo-de-aplicaciones-vigo",
      "desarrollo-web-vigo",
      "diseno-web-vigo",
      "desarrollo-de-aplicaciones-pontevedra",
      "desarrollo-web-pontevedra",
      "desarrollo-de-aplicaciones-galicia",
      "tienda-online-vigo",
      "agencia-desarrollo-web-galicia",
    ]) {
      await expect(page.locator(`a[href="/${slug}"]`).first()).toBeVisible();
    }
  });

  test("home exposes an indexable h1 and links to every landing", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("Vigo");
    for (const slug of ["servicios", "tienda-online-vigo", "desarrollo-de-aplicaciones-vigo"]) {
      await expect(page.locator(`main a[href="/${slug}"]`)).toHaveCount(1);
    }
  });

  test("unknown slug returns 404", async ({ page }) => {
    const response = await page.goto("/landing-inexistente");
    expect(response?.status()).toBe(404);
  });
});

test.describe("Contact shortcut popup", () => {
  // Consentimiento ya decidido: sin él el popup no sale (nunca dos capas).
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("action-cookie-consent", "denied");
    });
    await page.clock.install();
  });

  const exitIntent = (page: import("@playwright/test").Page) =>
    page.evaluate(() =>
      document.dispatchEvent(new MouseEvent("mouseout", { clientY: -1, relatedTarget: null, bubbles: true })),
    );

  test("opens on exit intent, prefills WhatsApp and does not come back once closed", async ({ page }) => {
    await page.goto("/servicios");
    await page.waitForLoadState("domcontentloaded");

    // Recién llegado: aún no está armado.
    await exitIntent(page);
    await expect(page.getByTestId("contact-popup")).toHaveCount(0);

    await page.clock.fastForward(9_000);
    await exitIntent(page);
    const popup = page.getByTestId("contact-popup");
    await expect(popup).toBeVisible();

    await page.getByTestId("contact-popup-service-apps").click();
    const href = await page.getByTestId("contact-popup-whatsapp").getAttribute("href");
    expect(decodeURIComponent(href ?? "")).toContain("desarrollar una app");

    await page.keyboard.press("Escape");
    await expect(popup).toHaveCount(0);

    // Una vez por sesión.
    await exitIntent(page);
    await expect(popup).toHaveCount(0);
  });

  test("never shows on /contact", async ({ page }) => {
    await page.goto("/contact");
    await page.waitForLoadState("domcontentloaded");
    await page.clock.fastForward(60_000);
    await exitIntent(page);
    await expect(page.getByTestId("contact-popup")).toHaveCount(0);
  });
});

test.describe("Legal links", () => {
  // LSSI art. 10 + RGPD art. 7.3: aviso legal, privacidad y retirar el
  // consentimiento accesibles desde TODA ruta, también las 3D sin pie.
  test("3D pages show the legal dock once consent is decided", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("action-cookie-consent", "denied");
    });
    await page.goto("/resenas?quieto=1");
    await page.waitForLoadState("domcontentloaded");

    const dock = page.getByTestId("legal-dock");
    await expect(dock).toBeVisible();
    await expect(dock.locator('a[href="/legal/aviso-legal"]')).toBeVisible();
    await expect(dock.locator('a[href="/legal/privacy"]')).toBeVisible();

    // "Cookies" reabre el banner y el acceso se retira para no coincidir con él.
    await dock.getByTestId("legal-dock-cookies").click();
    await expect(page.getByTestId("cookie-consent")).toBeVisible();
    await expect(dock).toHaveCount(0);
  });

  test("reading pages link every legal document in the footer", async ({ page }) => {
    await page.goto("/desarrollo-de-aplicaciones-vigo");
    await page.waitForLoadState("domcontentloaded");

    const footer = page.locator("footer");
    for (const href of ["/legal/aviso-legal", "/legal/privacy", "/legal/terms", "/legal/cookies"]) {
      await expect(footer.locator(`a[href="${href}"]`)).toHaveCount(1);
    }
    await expect(footer.getByTestId("cookie-preferences-link")).toBeVisible();
  });
});

test.describe("Landings de campaña", () => {
  // Consentimiento decidido: sin él el banner tapa la parte baja del móvil.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("action-cookie-consent", "denied");
    });
  });

  for (const offer of ["app", "software"]) {
    test(`/hablemos/${offer}: h1, noindex y sin popup de contacto`, async ({ page }) => {
      await page.goto(`/hablemos/${offer}`);
      await page.waitForLoadState("domcontentloaded");

      await expect(page.getByTestId("ads-h1")).toBeVisible();
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/hablemos/${offer}$`));
      // Barra propia: el logo no es un enlace al juego.
      await expect(page.locator('header a[href="/"]')).toHaveCount(0);
      await expect(page.getByTestId("lead-form")).toBeVisible();
      await expect(page.getByTestId("lead-step-1")).toBeVisible();
      await expect(page.getByTestId(`lead-field-need-${offer}`)).toBeChecked();
      await expect(page.getByTestId("contact-popup")).toHaveCount(0);
      // La oferta de los anuncios, justo bajo «Siguiente» y dentro de la primera pantalla.
      const next = (await page.getByTestId("lead-next").boundingBox())!;
      const offerLine = page.getByTestId("lead-offer");
      await expect(offerLine).toHaveText("Para empresas de toda Galicia. Primera reunión gratis, en Vigo o por videollamada.");
      const offerBox = (await offerLine.boundingBox())!;
      expect(offerBox.y).toBeGreaterThanOrEqual(next.y + next.height);
      expect(offerBox.y + offerBox.height).toBeLessThanOrEqual(900);
    });
  }

  test("paso 1 → paso 2 → envío mockeado → /hablemos/gracias", async ({ page }) => {
    let body: Record<string, unknown> | null = null;
    await page.route("**/api/lead", async (route) => {
      body = route.request().postDataJSON();
      await route.fulfill({ json: { ok: true, id: "test-id" } });
    });

    await page.goto("/hablemos/app?utm_source=google&gclid=abc123");
    await page.waitForLoadState("domcontentloaded");

    // Sin elegir el punto en que está, no avanza.
    await page.getByTestId("lead-next").click();
    await expect(page.getByTestId("lead-error-stage")).toBeVisible();
    await page.getByTestId("lead-field-stage-idea").check();
    await page.getByTestId("lead-next").click();

    await expect(page.getByTestId("lead-step-2")).toBeVisible();
    await expect(page.getByTestId("lead-field-name")).toBeFocused();

    // Validación humana
    await page.getByTestId("lead-field-name").fill("Ana");
    await page.getByTestId("lead-submit").click();
    await expect(page.getByTestId("lead-error-phone")).toHaveText(/Falta tu teléfono para poder llamarte/);
    await expect(page.getByTestId("lead-error-email")).toBeVisible();
    await expect(page.getByTestId("lead-error-budget")).toBeVisible();

    await page.getByTestId("lead-field-phone").fill("600 123 456");
    await page.getByTestId("lead-field-email").fill("ana@empresa.es");
    await page.getByTestId("lead-field-budget").selectOption("unknown");
    await page.getByTestId("lead-submit").click();

    await expect(page).toHaveURL(/\/hablemos\/gracias\?tipo=app$/);
    await expect(page.getByTestId("gracias-h1")).toContainText("Recibido");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

    expect(body).toMatchObject({
      source: "ads_landing",
      need: "app",
      stage: "idea",
      budget: "unknown",
      contactPreference: "whatsapp",
      attribution: { utmSource: "google", gclid: "abc123", landingPath: "/hablemos/app" },
    });
  });

  test("«Atrás» vuelve al paso 1 conservando la elección", async ({ page }) => {
    await page.goto("/hablemos/software");
    await page.getByTestId("lead-field-stage-defined").check();
    await page.getByTestId("lead-next").click();
    await page.getByTestId("lead-back").click();
    await expect(page.getByTestId("lead-step-1")).toBeVisible();
    await expect(page.getByTestId("lead-field-stage-defined")).toBeChecked();
  });

  test("un fallo de envío muestra el error con salida por WhatsApp", async ({ page }) => {
    await page.route("**/api/lead", (route) => route.fulfill({ status: 502, json: { ok: false } }));
    await page.goto("/hablemos/app");
    await page.getByTestId("lead-field-stage-idea").check();
    await page.getByTestId("lead-next").click();
    await page.getByTestId("lead-field-name").fill("Ana");
    await page.getByTestId("lead-field-phone").fill("600123456");
    await page.getByTestId("lead-field-email").fill("ana@empresa.es");
    await page.getByTestId("lead-field-budget").selectOption("lt5k");
    await page.getByTestId("lead-submit").click();

    await expect(page.getByTestId("lead-error")).toContainText("No se ha podido enviar. Lo que has escrito sigue aquí");
    await expect(page.getByTestId("lead-whatsapp")).toHaveAttribute("href", /^https:\/\/wa\.me\//);
    await expect(page.getByTestId("lead-submit")).toBeEnabled();
    await expect(page.getByTestId("lead-field-email")).toHaveValue("ana@empresa.es");
  });

  test("embudo: lead_form_step, whatsapp_click con link_location y envío descartado (200 sin id) sin generate_lead", async ({ page }) => {
    // Consentimiento concedido (pisa el `denied` del beforeEach) y GTM fuera de la red.
    await page.addInitScript(() => window.localStorage.setItem("action-cookie-consent", "granted"));
    await page.route(/googletagmanager\.com|wa\.me/, (route) => route.abort());
    // Los clics en WhatsApp no abren pestaña (los listeners de captura sí los ven).
    await page.addInitScript(() =>
      document.addEventListener("click", (e) => {
        if ((e.target as Element | null)?.closest?.('a[href^="https://wa.me/"]')) e.preventDefault();
      }),
    );
    await page.route("**/api/lead", (route) => route.fulfill({ json: { ok: true } }));
    await page.goto("/hablemos/software");
    const events = (name: string) =>
      page.evaluate((n) => ((window as unknown as { dataLayer?: { event?: string }[] }).dataLayer ?? []).filter((e) => e.event === n), name);

    await page.getByTestId("campaign-whatsapp").click();
    await page.getByTestId("footer-whatsapp").click();
    expect((await events("whatsapp_click")).map((e) => (e as { link_location?: string }).link_location)).toEqual([
      "campaign-whatsapp",
      "footer-whatsapp",
    ]);
    expect(await events("click_whatsapp")).toHaveLength(2);

    // De vuelta arriba: al fondo, el formulario fijo queda bajo el bloque de cierre.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByTestId("lead-field-stage-existing").check();
    await page.getByTestId("lead-next").click();
    expect(await events("lead_form_step")).toEqual([
      {
        event: "lead_form_step",
        form_step: "2",
        lead_source: "ads_landing",
        lead_need: "software",
        lead_stage: "existing",
        page_path: "/hablemos/software",
      },
    ]);
    await page.getByTestId("lead-field-name").fill("Ana");
    await page.getByTestId("lead-field-phone").fill("600123456");
    await page.getByTestId("lead-field-email").fill("ana@empresa.es");
    await page.getByTestId("lead-field-budget").selectOption("lt5k");
    await page.getByTestId("lead-submit").click();
    await expect(page.getByTestId("lead-received")).toHaveText("Recibido. Te contactamos en 24 horas laborables.");
    expect(new URL(page.url()).pathname).toBe("/hablemos/software");
    expect(await events("generate_lead")).toHaveLength(0);
  });

  test("la barra fija de móvil aparece al salir el hero y se oculta con el formulario", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/hablemos/app");
    const bar = page.getByTestId("sticky-cta");
    await expect(bar).toHaveAttribute("data-show", "false");

    await page.getByTestId("ads-closing-cta").scrollIntoViewIfNeeded();
    await expect(bar).toHaveAttribute("data-show", "true");

    await page.getByTestId("sticky-cta-form").click();
    await expect(page.getByTestId("lead-form")).toBeInViewport();
    await expect(page.getByTestId("lead-field-need-app")).toBeFocused();
    await expect(bar).toHaveAttribute("data-show", "false");
  });

  test("/hablemos/gracias valida ?tipo= y no mete datos en el WhatsApp", async ({ page }) => {
    await page.goto("/hablemos/gracias?tipo=software");
    const href = await page.getByTestId("gracias-whatsapp").getAttribute("href");
    expect(decodeURIComponent(href ?? "")).toContain("proyecto de software de gestión desde la web");

    await page.goto("/hablemos/gracias?tipo=<script>");
    const generic = await page.getByTestId("gracias-whatsapp").getAttribute("href");
    expect(decodeURIComponent(generic ?? "")).toContain("proyecto desde la web");
    expect(generic).not.toContain("script");
  });

  test("/hablemos/*: el paso 1 pinta 4 opciones (sin «web») y /gracias?tipo=web suena natural", async ({ page }) => {
    await page.goto("/hablemos/app");
    await expect(page.getByTestId("lead-form")).toBeVisible();
    await expect(page.locator('[data-testid^="lead-field-need-"]')).toHaveCount(4);
    await expect(page.getByTestId("lead-field-need-web")).toHaveCount(0);
    await expect(page.getByTestId("lead-field-need-integration")).toHaveCount(1);

    await page.goto("/hablemos/gracias?tipo=web");
    const href = await page.getByTestId("gracias-whatsapp").getAttribute("href");
    expect(decodeURIComponent(href ?? "")).toContain("proyecto de página web desde la web");
  });

  test("/hablemos/gracias: sin tel:, WhatsApp precargado y casos en pestaña nueva", async ({ page }) => {
    await page.goto("/hablemos/gracias?tipo=app");
    await expect(page.getByTestId("gracias-contact")).toHaveText(
      "Te escribimos por WhatsApp o te llamamos desde el 614 02 74 10 (L-V).",
    );
    await expect(page.getByTestId("gracias-call")).toHaveCount(0);
    await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
    await expect(page.getByTestId("gracias-whatsapp")).toHaveAttribute("href", /\?text=/);
    const cases = page.locator('[data-testid^="gracias-case-"]');
    expect(await cases.count()).toBeGreaterThan(0);
    for (const c of await cases.all()) await expect(c).toHaveAttribute("target", "_blank");
  });

  for (const [offer, phrase] of [
    ["app", "una app a medida"],
    ["software", "un software de gestión a medida"],
  ] as const) {
    test(`/hablemos/${offer}: WhatsApp precargado, sin tel:, reseña, pie y promesas`, async ({ page }) => {
      await page.goto(`/hablemos/${offer}`);
      for (const id of ["campaign-whatsapp", "footer-whatsapp"]) {
        const href = decodeURIComponent((await page.getByTestId(id).getAttribute("href")) ?? "");
        expect(href).toContain("?text=Hola, vengo de vuestra web");
        if (id === "campaign-whatsapp") expect(href).toContain(phrase);
      }
      await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
      await expect(page.getByTestId("sticky-cta-whatsapp")).toHaveAttribute("href", /\?text=/);
      await expect(page.getByTestId("ads-hero-review")).toBeVisible();
      const footer = page.locator("footer");
      await expect(footer).toContainText("Alcasi Systems, S.L.");
      await expect(footer).toContainText("B72910664");
      await expect(footer.getByTestId("footer-email")).toHaveAttribute("href", "mailto:hi@actiondev.es");
      for (const link of await page.locator('[data-testid^="ads-case-"]').all()) {
        await expect(link).toHaveAttribute("target", "_blank");
      }
      await page.getByTestId("lead-field-stage-idea").check();
      await page.getByTestId("lead-next").click();
      await expect(page.getByTestId("lead-privacy").locator('a[href="/legal/privacy"]')).toHaveAttribute("target", "_blank");
      await expect(page.getByTestId("lead-privacy")).toContainText("one.com");
      await expect(page.getByTestId("lead-form")).toContainText("Solo para orientar la propuesta; no te compromete a nada.");
      await expect(page.getByTestId("lead-form")).toContainText("Primera reunión gratis y sin compromiso. Te respondemos en 24 horas laborables.");
      // Empresa y detalles van plegados; el canal preferido, visible y con valor por defecto.
      await expect(page.getByTestId("lead-field-company")).toBeHidden();
      await expect(page.getByTestId("lead-field-contact-whatsapp")).toBeChecked();
      await page.getByTestId("lead-extras").locator("summary").click();
      await expect(page.getByTestId("lead-field-company")).toBeVisible();
    });
  }

  test("primera capa RGPD debajo de «Enviar mi proyecto» solo en /hablemos/* (UD-10): nota encima y título debajo", async ({ page }) => {
    for (const offer of ["app", "software"]) {
      await page.goto(`/hablemos/${offer}`);
      await page.getByTestId("lead-field-stage-idea").check();
      await page.getByTestId("lead-next").click();
      await expect(page.getByTestId("lead-step-2")).toBeVisible();
      await expect(page.getByTestId("lead-privacy-note")).toHaveText("Lee abajo la información básica sobre protección de datos.");
      await expect(page.getByTestId("lead-privacy-title")).toHaveText("Información básica sobre protección de datos");
      const box = async (id: string) => (await page.getByTestId(id).boundingBox())!;
      const note = await box("lead-privacy-note");
      const submit = await box("lead-submit");
      const title = await box("lead-privacy-title");
      expect(note.y + note.height, `${offer}: nota encima del botón`).toBeLessThanOrEqual(submit.y);
      expect(submit.y + submit.height, `${offer}: título debajo del botón`).toBeLessThanOrEqual(title.y);
      await expect(page.getByTestId("lead-privacy").getByTestId("lead-privacy-title")).toHaveCount(1);
    }
    // Fuera de /hablemos/* (landing SEO), sin cambios: ni nota ni título.
    await page.goto("/desarrollo-de-aplicaciones-vigo");
    await page.getByTestId("lead-field-stage-idea").check();
    await page.getByTestId("lead-next").click();
    await expect(page.getByTestId("lead-step-2")).toBeVisible();
    await expect(page.getByTestId("lead-privacy")).toBeVisible();
    await expect(page.getByTestId("lead-privacy-note")).toHaveCount(0);
    await expect(page.getByTestId("lead-privacy-title")).toHaveCount(0);
  });

  test("/legal redirige a /legal/aviso-legal", async ({ request }) => {
    const res = await request.get("/legal", { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers()["location"]).toContain("/legal/aviso-legal");
  });

  test("oferta desconocida devuelve 404", async ({ page }) => {
    const response = await page.goto("/hablemos/xxx");
    expect(response?.status()).toBe(404);
  });
});

test.describe("Conversión: landings SEO, banner de cookies y Header móvil", () => {
  const MOBILE = { width: 390, height: 844 };

  test("landing SEO de apps: CTA tras la intro, #proyecto con formulario y H1 intacto", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("action-cookie-consent", "denied"));
    await page.setViewportSize(MOBILE);
    await page.goto("/desarrollo-de-aplicaciones-vigo");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("h1")).toHaveText("Desarrollo de aplicaciones en Vigo");

    const cta = page.getByTestId("landing-cta-project");
    await expect(cta).toBeVisible();
    await expect(cta).toHaveText(/Cuéntanos tu proyecto/i);
    await expect(page.getByTestId("landing-cta-whatsapp")).toBeVisible();
    // Va DESPUÉS de la intro (el H1 la precede) y mucho antes del final de la página.
    const ctaY = (await cta.boundingBox())!.y;
    const h1Y = (await page.locator("h1").boundingBox())!.y;
    const pageH = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(ctaY).toBeGreaterThan(h1Y);
    expect(ctaY).toBeLessThan(pageH / 3);

    // El formulario vive en #proyecto, con las 4 opciones de campaña y «app» marcada.
    const section = page.locator("#proyecto");
    await expect(section.getByTestId("lead-form")).toHaveCount(1);
    await expect(section.locator('[data-testid^="lead-field-need-"]')).toHaveCount(4);
    await expect(page.getByTestId("lead-field-need-app")).toBeChecked();

    // El CTA lleva al formulario y enfoca su primer campo.
    await cta.click();
    await expect(page).toHaveURL(/#proyecto$/);
    await expect(page.getByTestId("lead-form")).toBeInViewport();
    await expect(page.getByTestId("lead-field-need-app")).toBeFocused();
  });

  test("landing SEO de web: opciones LEAD_NEEDS_WEB con «web» preseleccionada", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("action-cookie-consent", "denied"));
    await page.goto("/desarrollo-web-vigo");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('#proyecto [data-testid^="lead-field-need-"]')).toHaveCount(4);
    await expect(page.getByTestId("lead-field-need-web")).toBeChecked();
    await expect(page.getByTestId("lead-field-need-integration")).toHaveCount(0);
  });

  test("landing SEO en móvil: la barra fija aparece al bajar y se oculta con el formulario", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("action-cookie-consent", "denied"));
    await page.setViewportSize(MOBILE);
    await page.goto("/desarrollo-web-vigo");
    const bar = page.getByTestId("sticky-cta");
    await expect(bar).toHaveAttribute("data-show", "false");

    await page.locator("#resenas").scrollIntoViewIfNeeded();
    await expect(bar).toHaveAttribute("data-show", "true");

    await page.getByTestId("sticky-cta-form").click();
    await expect(page.getByTestId("lead-form")).toBeInViewport();
    await expect(bar).toHaveAttribute("data-show", "false");
  });

  test("banner de cookies: fondo opaco y compacto en móvil, con ambos botones", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/desarrollo-de-aplicaciones-vigo");
    const banner = page.getByTestId("cookie-consent");
    await expect(banner).toBeVisible();

    const bg = await banner.evaluate((el) => getComputedStyle(el).backgroundColor);
    const alpha = bg.startsWith("rgba") ? Number(bg.replace(/[^\d.,]/g, "").split(",")[3]) : 1;
    expect(alpha).toBeGreaterThanOrEqual(0.94);

    const box = (await banner.boundingBox())!;
    expect(box.height).toBeLessThanOrEqual(140);
    expect(box.x + box.width).toBeLessThanOrEqual(MOBILE.width);

    // Botones en línea y con la misma altura (misma prominencia de tamaño).
    const accept = (await page.getByTestId("cookie-consent-accept").boundingBox())!;
    const reject = (await page.getByTestId("cookie-consent-reject").boundingBox())!;
    expect(Math.abs(accept.y - reject.y)).toBeLessThan(2);
    expect(Math.abs(accept.height - reject.height)).toBeLessThan(2);
    // Guía AEPD: misma prominencia — exactamente la misma clase.
    const cls = async (id: string) => page.getByTestId(id).getAttribute("class");
    expect(await cls("cookie-consent-reject")).toBe(await cls("cookie-consent-accept"));
  });

  test("banner compacto en /hablemos/app (390x844): ≤ 76 px y no tapa «Siguiente»", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/hablemos/app");
    const banner = (await page.getByTestId("cookie-consent").boundingBox())!;
    const next = (await page.getByTestId("lead-next").boundingBox())!;
    expect(banner.height).toBeLessThanOrEqual(76);
    expect(next.y + next.height).toBeLessThanOrEqual(banner.y);
    const cls = async (id: string) => page.getByTestId(id).getAttribute("class");
    expect(await cls("cookie-consent-reject")).toBe(await cls("cookie-consent-accept"));
  });

  for (const path of ["/contact", "/projects?quieto", "/resenas"]) {
    test(`Header a 390 px en ${path}: logo visible y nada fuera del viewport`, async ({ page }) => {
      await page.addInitScript(() => window.localStorage.setItem("action-cookie-consent", "denied"));
      await page.setViewportSize(MOBILE);
      await page.goto(path);
      await page.waitForLoadState("domcontentloaded");

      const nav = page.getByTestId("main-nav");
      await expect(nav).toBeVisible();
      await expect(nav.locator("img").first()).toBeVisible();
      // Por debajo de `md`: solo logo + CTA.
      await expect(nav.locator("ul")).toBeHidden();
      await expect(nav.locator('a[href="/contact"]:not(ul a)')).toBeVisible();
      await expect(nav.locator("button")).toBeHidden();

      const boxes = await nav.locator("*").evaluateAll((els) =>
        els
          .map((el) => ({ el, r: el.getBoundingClientRect(), shown: getComputedStyle(el).display !== "none" }))
          .filter(({ r, shown }) => shown && r.width > 0 && r.height > 0)
          .map(({ r }) => ({ x: r.x, right: r.x + r.width })),
      );
      expect(boxes.length).toBeGreaterThan(0);
      for (const b of boxes) {
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.right).toBeLessThanOrEqual(MOBILE.width);
      }
    });
  }
});

test.describe("Sobre nosotros (página de la entidad)", () => {
  const H1 = "Action Development, estudio de desarrollo de apps y software en Vigo";
  const ORG = "https://actiondev.es/#organization";

  test("datos, casos y preguntas visibles, con AboutPage → organización y FAQPage", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    const response = await page.goto("/sobre-nosotros");
    expect(response?.status()).toBe(200);

    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText(H1);
    await expect(page).toHaveTitle("Sobre nosotros: estudio de apps y software en Vigo — Action");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://actiondev.es/sobre-nosotros");
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "Action Development");
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description?.length).toBeLessThanOrEqual(155);

    // Ficha de la entidad: un <dl> con titular, oficina y equipo, todo visible.
    const facts = page.getByTestId("about-facts");
    await expect(facts).toBeVisible();
    for (const text of ["Alcasi Systems, S.L.", "B72910664", "Rúa Colón, 20", "Pablo Cabaleiro", "React Native"]) {
      await expect(facts).toContainText(text);
    }
    await expect(facts).not.toContainText("Flutter");
    await expect(page.locator('main a[href^="tel:"]')).toHaveCount(0);

    // Casos reales enlazados a su ficha y todos los proyectos.
    for (const slug of ["autoescuela-gti", "xaulabs", "pbb-porrino", "ticketera-la-fabrica", "nautirent"]) {
      await expect(page.locator(`main a[href="/projects/${slug}"]`)).toHaveCount(1);
    }
    await expect(page.getByTestId("about-all-projects")).toHaveAttribute("href", "/projects");

    // Preguntas: todas abiertas (sin acordeón), con la desambiguación de la cadena Action.
    const faq = page.getByTestId("about-faq");
    await expect(faq.locator("details")).toHaveCount(0);
    await expect(faq.locator("h3")).toHaveCount(9);
    await expect(faq).toContainText("no tiene relación con la cadena de tiendas de descuento Action");

    // JSON-LD: AboutPage → #organization, FAQPage con las mismas preguntas, migas. Nunca valoraciones marcadas.
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const nodes = blocks.flatMap((b) => {
      const json = JSON.parse(b);
      return json["@graph"] ?? [json];
    });
    const about = nodes.find((n) => n["@type"] === "AboutPage");
    expect(about?.mainEntity).toEqual({ "@id": ORG });
    const faqPage = nodes.find((n) => n["@type"] === "FAQPage");
    expect(faqPage?.mainEntity).toHaveLength(9);
    expect(nodes.find((n) => n["@type"] === "BreadcrumbList")?.itemListElement).toHaveLength(2);
    const org = nodes.find((n) => n["@id"] === ORG);
    expect(org?.name).toBe("Action Development");
    expect(org?.description).toMatch(/^Action Development es /);
    // Sin `founder` hasta que el dueño confirme el cargo (plan AEO, §4.2).
    expect(org?.founder).toBeUndefined();
    await expect(facts).not.toContainText("Fundador");
    expect(org?.geo).toMatchObject({ latitude: 42.2372544, longitude: -8.7206586 });
    expect(blocks.join(" ")).not.toMatch(/aggregateRating|"Review"/);
    expect(errors).toHaveLength(0);
  });

  test("la enlazan el pie de las páginas de lectura y el sitemap", async ({ page, request }) => {
    await page.goto("/servicios");
    await expect(page.locator('footer a[href="/sobre-nosotros"]')).toHaveText("Action Development");
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("<loc>https://actiondev.es/sobre-nosotros</loc>");
  });
});

test.describe("AEO: landings, valoración única y llms.txt", () => {
  const RATING = "5,0 sobre 5 · 23 reseñas";

  test("cada landing abre con «Action Development» y lleva los «Datos clave» con la valoración única", async ({ page }) => {
    for (const slug of ["desarrollo-de-aplicaciones-vigo", "software-a-medida-vigo", "tienda-online-vigo"]) {
      await page.goto(`/${slug}`);
      const first = page.locator("#hero p.prose-body").first();
      await expect(first, slug).toHaveText(/^Action Development /);
      const facts = page.getByTestId("landing-key-facts");
      await expect(facts.locator("dt"), slug).toHaveCount(7);
      await expect(facts, slug).toContainText(RATING);
      await expect(facts.locator('a[href="/projects"]'), slug).toContainText("en el portfolio");
      await expect(page.locator("main"), slug).not.toContainText("22 reseñas");
    }
  });

  test("/llms.txt y /llms-full.txt se generan con los datos del sitio", async ({ request }) => {
    const res = await request.get("/llms.txt");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/plain");
    const txt = await res.text();
    expect(txt).toMatch(/^# Action Development — /);
    expect(txt).toContain("5,0 de 5 con 23 reseñas (consultado el 9 de octubre de 2026)");
    expect(txt).toContain("https://actiondev.es/sobre-nosotros");
    expect(txt).toContain("https://actiondev.es/desarrollo-de-aplicaciones-vigo");
    expect(txt).toContain("React Native with Expo");
    expect(txt).not.toMatch(/Flutter|Supabase|activa desde 2020/);

    const full = await (await request.get("/llms-full.txt")).text();
    for (const h of ["## Sobre Action Development", "## Desarrollo de aplicaciones en Vigo", "### Autoescuela GTI"]) {
      expect(full).toContain(h);
    }
  });
});
