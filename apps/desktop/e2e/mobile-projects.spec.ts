import { devices } from "@playwright/test";
import { test, expect } from "./fixtures";
import { projects } from "../../../packages/shared/src/projects";

/**
 * Web móvil v2 · /projects y /projects/[slug]. Proyecto con iPhone 390×844,
 * cookie `mv2=1` y servidor con `MOBILE_V2=qa` (ver `mobile.spec.ts`).
 */

const DESKTOP_UA = devices["Desktop Chrome"].userAgent;
const LINKS = '[data-testid="m-project-link"]';

const meta = (html: string) => ({
  title: html.match(/<title>([^<]*)<\/title>/)?.[1],
  canonical: html.match(/<link rel="canonical" href="([^"]*)"/)?.[1],
});

test.describe("Móvil v2 · proyectos", () => {
  test("lista: H1 visible y todos los proyectos enlazados", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.locator("main#main-content h1")).toBeVisible();
    const hrefs = await page.locator(`main a[href^="/projects/"]`).evaluateAll((a) =>
      a.map((n) => n.getAttribute("href")),
    );
    const unique = new Set(hrefs);
    expect(unique.size).toBe(projects.length);
    for (const p of projects) expect(unique.has(`/projects/${p.slug}`), p.slug).toBe(true);
    await expect(page.locator(LINKS).first()).toBeVisible();
  });

  test("lista: metadatos idénticos a escritorio y JSON-LD", async ({ page, request }) => {
    await page.goto("/projects");
    const desktop = await request.get("/projects", { headers: { "user-agent": DESKTOP_UA } });
    const d = meta(await desktop.text());
    expect(await page.title()).toBe(d.title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", d.canonical!);
    const types = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((n) =>
        n.flatMap((s) => {
          const ld = JSON.parse(s.textContent ?? "{}");
          return ld["@graph"] ? ld["@graph"].map((g: { "@type": unknown }) => g["@type"]) : [ld["@type"]];
        }),
      );
    expect(types).toEqual(expect.arrayContaining(["CollectionPage", "ItemList", "BreadcrumbList"]));
  });

  test("el filtro por tipo oculta y muestra proyectos", async ({ page }) => {
    await page.goto("/projects");
    const visible = () => page.locator(LINKS).evaluateAll((a) => a.filter((n) => n.getClientRects().length > 0).length);
    expect(await visible()).toBe(projects.length);
    // Mismo mapeo que `components/m/ProjectKind.tsx`: «Web Application» es web;
    // Autoescuela GTI (app + programa de gestión) sale en sus dos filtros.
    const TWO_KINDS = "autoescuela-gti";
    for (const [id, category, extra] of [
      ["app", ["Mobile App"], 1],
      ["software", ["Desktop App"], 1],
      ["web", ["Website", "Landing Page", "Web Application"], 0],
      ["shop", ["E-commerce"], 0],
    ] as const) {
      await page.getByTestId(`m-filter-${id}`).click();
      const expected =
        projects.filter((p) => p.slug !== TWO_KINDS && (category as readonly string[]).includes(p.category)).length + extra;
      expect(await visible(), id).toBe(expected);
    }
    await page.getByTestId("m-filter-all").click();
    expect(await visible()).toBe(projects.length);
  });

  test("tipo coherente: La Fábrica es «Web» en la lista, la ficha y la home", async ({ page }) => {
    const slug = "ticketera-la-fabrica";
    await page.goto("/projects");
    const chips = (scope: ReturnType<typeof page.locator>) => scope.getByTestId("m-kind-chip");
    await expect(chips(page.locator(`[data-testid="m-project-link"][href="/projects/${slug}"]`))).toHaveText(["Web"]);
    await page.goto(`/projects/${slug}`);
    await expect(chips(page.locator("main header"))).toHaveText(["Web"]);
    await page.goto("/");
    await expect(
      chips(page.getByTestId("m-case").filter({ has: page.locator(`a[href="/projects/${slug}"]`) })),
    ).toHaveText(["Web"]);
    // Y el caso con dos servicios lleva los dos chips en la lista y en la home.
    await expect(chips(page.getByTestId("m-case").first())).toHaveText(["App", "Programa de gestión"]);
  });

  test("ficha autoescuela-gti: ×10, H2 del caso y CTA", async ({ page }) => {
    await page.goto("/projects/autoescuela-gti");
    await expect(page.locator("h1")).toHaveText("Autoescuela GTI");
    await expect(page.getByTestId("m-case-result")).toContainText("×10");
    await expect(page.getByRole("heading", { level: 2, name: "Qué nos pidieron" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Qué conseguimos" })).toBeVisible();
    await expect(page.getByTestId("m-case-service")).toHaveAttribute("href", "/desarrollo-web-vigo");
    await expect(page.getByTestId("m-case-cta")).toHaveAttribute("href", "/contact");
    await expect(page.getByTestId("m-case-next")).toBeAttached();
    await expect(page.getByTestId("m-case-prev")).toBeAttached();
  });

  test("ficha con URL real y vídeo: «Ver web» en pestaña nueva, vídeo sin precarga", async ({ page }) => {
    await page.goto("/projects/musa");
    const web = page.locator('main a[target="_blank"]', { hasText: "Ver web" });
    await expect(web).toHaveAttribute("href", "https://www.musavigo.es/");
    const video = page.locator("main video");
    await expect(video).toHaveAttribute("preload", "none");
    await expect(video).not.toHaveAttribute("autoplay", /.*/);
    await page.goto("/projects/autoescuela-gti");
    await expect(page.locator("main a", { hasText: "Ver web" })).toHaveCount(0);
  });

  test("ficha sin caso: noindex, follow; con caso: indexable", async ({ page }) => {
    await page.goto("/projects/ratsquad");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/);
    await page.goto("/projects/fase");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index, follow/);
  });

  test("title y canonical de 2 fichas idénticos a escritorio + JSON-LD CreativeWork", async ({ page, request }) => {
    for (const slug of ["musa", "fase"]) {
      await page.goto(`/projects/${slug}`);
      const d = meta(await (await request.get(`/projects/${slug}`, { headers: { "user-agent": DESKTOP_UA } })).text());
      expect(await page.title(), slug).toBe(d.title);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", d.canonical!);
      const ld = await page
        .locator('script[type="application/ld+json"]')
        .evaluateAll((n) => n.map((s) => s.textContent ?? "").join("\n"));
      expect(ld).toContain('"CreativeWork"');
    }
  });

  test("ningún 404 ni `tel:` en lista y fichas", async ({ page, request }) => {
    test.setTimeout(600_000);
    await page.goto("/projects");
    const listHtml = await page.content();
    expect(listHtml).not.toContain("tel:");
    for (const p of projects) {
      const res = await request.get(`/projects/${p.slug}`, { headers: { "user-agent": devices["iPhone 13"].userAgent } });
      expect(res.status(), p.slug).toBe(200);
      expect(await res.text(), p.slug).not.toContain("tel:");
    }
    // Servicios relacionados enlazados desde las fichas.
    for (const href of ["/desarrollo-de-aplicaciones-vigo", "/desarrollo-web-vigo", "/diseno-web-vigo", "/tienda-online-vigo"]) {
      expect((await request.get(href)).status(), href).toBe(200);
    }
  });

  for (const width of [360, 390, 430]) {
    test(`sin overflow horizontal a ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      for (const path of ["/projects", "/projects/autoescuela-gti", "/projects/ratsquad", "/projects/patricia-avendano"]) {
        await page.goto(path);
        const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
        expect(sw, `${path} @${width}`).toBeLessThanOrEqual(iw);
      }
    });
  }
});
