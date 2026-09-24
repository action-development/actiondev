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
    await expect(page).toHaveURL(/\/contact$/, { timeout: 20_000 });
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
