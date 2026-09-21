import { test, expect, type Page } from "@playwright/test";

// Smoke tests de /resenas — sin regresión visual (el WebGL de la plaza tarda
// en estabilizar; snapshots se añaden aparte). Mismo patrón que smoke.spec.ts.

/** Espera a que la plaza esté lista: su loader propio se retira en `onReady`
 * (primer frame pintado), así que es una señal real, no un tiempo fijo. */
async function waitForPlaza(page: Page) {
  await expect(page.locator("canvas")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Preparando la plaza…")).toBeHidden({ timeout: 20_000 });
  // Pop-in de los muñecos (0,6 s) + primera pose.
  await page.waitForTimeout(1200);
}

/**
 * Barre el canvas hasta que el cursor pasa a "grab" (R3F lo pone al entrar el
 * puntero en un muñeco) y deja el ratón ahí. Los muñecos deambulan y la cámara
 * orbita, así que no hay coordenadas fijas fiables.
 *
 * Paso grueso (40 px, con muñecos de ~90 px de ancho) porque cada punto cuesta
 * dos viajes al navegador; aun así el barrido puede irse a decenas de segundos
 * con WebGL por software, de ahí el `test.setTimeout` de quien lo llama.
 */
async function findDoll(page: Page): Promise<[number, number]> {
  for (let y = 620; y >= 360; y -= 40) {
    for (let x = 320; x <= 1120; x += 40) {
      await page.mouse.move(x, y);
      if ((await page.evaluate(() => document.body.style.cursor)) !== "grab") continue;
      // El barrido entra por el borde del muñeco; se adentra hacia el cuerpo
      // para que un paso de su paseo no deje el punto fuera al pulsar.
      const inner: [number, number] = [x + 12, y - 12];
      await page.mouse.move(inner[0], inner[1]);
      return (await page.evaluate(() => document.body.style.cursor)) === "grab" ? inner : [x, y];
    }
  }
  throw new Error("no se encontró ningún muñeco bajo el puntero");
}

const cursorOf = (page: Page) => page.evaluate(() => document.body.style.cursor);

/**
 * Agarra un muñeco y deja el botón PULSADO (quien llama decide cuándo soltar).
 * Devuelve dónde quedó el puntero.
 *
 * Se reintenta: aunque con `?quieto` nadie pasea, si el gesto cae sobre el
 * suelo el agarre no llega a activarse.
 */
async function grabDoll(page: Page): Promise<[number, number]> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const [x, y] = await findDoll(page);
    await page.mouse.down();
    // Arriba y a la derecha: los dos ejes del arrastre a la vez (el puntero va
    // por el plano del suelo — lado y profundidad, nunca altura).
    let px = x;
    let py = y;
    for (let i = 1; i <= 10; i++) {
      px = x + i * 16;
      py = y - i * 16;
      await page.mouse.move(px, py);
    }
    if ((await cursorOf(page)) === "grabbing") return [px, py];
    await page.mouse.up();
    // Un intento fallido es un click: pudo abrir la ficha de otro muñeco.
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  }
  throw new Error("no se pudo agarrar ningún muñeco");
}

test.describe("Plaza de reseñas", () => {
  test("loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/resenas");
    await page.waitForLoadState("domcontentloaded");

    expect(errors).toHaveLength(0);
  });

  test("renders the 3D canvas", async ({ page }) => {
    await page.goto("/resenas");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("canvas")).toBeVisible({ timeout: 15_000 });
  });

  test("HUD shows title and review count", async ({ page }) => {
    await page.goto("/resenas");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByRole("heading", { name: "La plaza de las reseñas" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/^\d+ reseñas$/)).toBeVisible();
  });

  test("back link points to home", async ({ page }) => {
    await page.goto("/resenas");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator('a[href="/"]').first()).toBeVisible();
  });

  test("Escape closes the review card", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/resenas");
    await page.waitForLoadState("domcontentloaded");

    const dialog = page.locator('[role="dialog"]');

    // La ficha existe siempre en el DOM (oculta con visibility) — Escape no
    // debe romper nada aunque no haya ningún muñeco seleccionado todavía.
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();

    expect(errors).toHaveLength(0);
  });

  test("a quick click on a character opens its review card", async ({ page }) => {
    // Barrer el canvas cuesta dos viajes al navegador por punto: con WebGL por
    // software no cabe en el timeout por defecto.
    test.setTimeout(150_000);
    // `?quieto`: sin paseo ni órbita. Con la plaza viva, el muñeco que localiza
    // el barrido puede haberse apartado al pulsar (R3F solo recalcula el hover
    // cuando se mueve el puntero, así que el cursor "grab" se queda obsoleto).
    await page.goto("/resenas?quieto=1");
    await waitForPlaza(page);

    // `click` (no down + up sueltos): un down/up por separado puede tardar más
    // que HOLD_MS entre llamadas y el muñeco se agarraría en vez de abrir ficha.
    // Aun así se reintenta: con WebGL por software el propio click puede pasarse
    // de HOLD_MS, y el muñeco puede haberse apartado un paso.
    const dialog = page.locator('[role="dialog"]');
    let opened = false;
    for (let attempt = 0; attempt < 3 && !opened; attempt++) {
      const [x, y] = await findDoll(page);
      await page.mouse.click(x, y);
      await page.waitForTimeout(700);
      opened = await dialog.isVisible();
      if (!opened) {
        await page.keyboard.press("Escape");
        await page.waitForTimeout(400);
      }
    }
    expect(opened).toBe(true);
  });

  test("holding and dragging a character grabs it instead of opening the card", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    // Barrer el canvas cuesta dos viajes al navegador por punto: con WebGL por
    // software no cabe en el timeout por defecto.
    test.setTimeout(150_000);
    // `?quieto`: sin paseo ni órbita. Con la plaza viva, el muñeco que localiza
    // el barrido puede haberse apartado al pulsar (R3F solo recalcula el hover
    // cuando se mueve el puntero, así que el cursor "grab" se queda obsoleto).
    await page.goto("/resenas?quieto=1");
    await waitForPlaza(page);

    await grabDoll(page);
    await page.mouse.up();

    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test("el arrastre solo tiene dos ejes: lado y profundidad", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    test.setTimeout(150_000);
    await page.goto("/resenas?quieto=1");
    await waitForPlaza(page);

    const [x, y] = await grabDoll(page);

    // Con un muñeco en la mano, la pista pasa a ser la leyenda de los dos ejes.
    await expect(page.getByText("más lejos o más cerca")).toBeVisible();

    // El eje vertical del puntero es profundidad, no altura: se mueve arriba y
    // abajo sin cambiar de modo ni soltar el agarre (antes Mayús lo conmutaba
    // y el cursor pasaba a "ns-resize").
    await page.mouse.move(x, y - 80);
    expect(await cursorOf(page)).toBe("grabbing");
    await page.mouse.move(x, y + 80);
    expect(await cursorOf(page)).toBe("grabbing");

    // Y las teclas que antes empujaban en profundidad ya no son nuestras.
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Shift");
    expect(await cursorOf(page)).toBe("grabbing");

    await page.mouse.up();
    // Todo esto sigue siendo un arrastre, no un click: no se abre ninguna ficha.
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    expect(errors).toHaveLength(0);
  });
});
