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
  test("renders featured projects section", async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.locator("#projects")).toBeVisible();
  });

  test("el contenedor colgado no aparece arriba, ni al entrar ni al volver", async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("domcontentloaded");
    const cargo = page.locator('[data-testid="hanging-cargo"]');
    const opacity = async () => Number(await cargo.evaluate((el) => getComputedStyle(el).opacity));

    await expect(cargo).toHaveCount(1);
    expect(await opacity()).toBe(0);

    // Dentro del carrusel sí se ve.
    await page.evaluate(() => {
      const s = document.querySelector('section[aria-label="Featured projects showcase"]') as HTMLElement;
      window.scrollTo(0, s.offsetTop + s.offsetHeight * 0.3);
    });
    await expect.poll(opacity).toBeGreaterThan(0.9);

    // Al volver arriba del todo vuelve a estar oculto.
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(opacity, { timeout: 5000 }).toBe(0);
  });

  test("el índice llega abierto con todos los trabajos", async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("domcontentloaded");

    await page.evaluate(() => {
      document.getElementById("projects-index")?.scrollIntoView();
    });

    const section = page.locator("#projects-index");
    await expect(section).toBeVisible();

    // De entrada ya están los 31 trabajos a la vista.
    const rows = section.locator("[data-row]");
    const toggle = page.getByTestId("projects-index-toggle");
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(rows.first()).toBeVisible();
    expect(await rows.count()).toBeGreaterThan(20);

    // El botón sigue pudiendo recogerlos.
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(await rows.count()).toBe(0);

    // Y volver a abrirlos.
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(await rows.count()).toBeGreaterThan(20);
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
