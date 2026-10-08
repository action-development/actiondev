import { devices, expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { landings } from "../src/data/landings";
import { testimonials } from "../src/data/testimonials";

/**
 * Web móvil v2 · /servicios y /resenas. Servidor: MOBILE_V2=qa en el puerto
 * 3023 (config temporal propia). UA iPhone + cookie `mv2=1`.
 */

const SHOTS = process.env.M_SHOTS_DIR;
const MAPS = "https://maps.google.com/?cid=18162141466997281764";
const REVIEW = "https://g.page/r/CeTTw-Rv4wz8EBM/review";
const DESKTOP_UA = devices["Desktop Chrome"].userAgent;

async function setup(page: Page) {
	await page.addInitScript(() => localStorage.setItem("action-cookie-consent", "denied"));
	await page.route(/googletagmanager\.com|wa\.me/, (r) => r.abort());
}

/** Título y canonical que sirve el escritorio (UA de escritorio, sin cookie). */
async function desktopHead(browser: import("@playwright/test").Browser, path: string) {
	const ctx = await browser.newContext({ userAgent: DESKTOP_UA, viewport: { width: 1440, height: 900 } });
	const res = await ctx.request.get(path);
	const html = await res.text();
	await ctx.close();
	return {
		title: html.match(/<title>(.*?)<\/title>/)?.[1],
		canonical: html.match(/<link rel="canonical" href="([^"]*)"/)?.[1],
		description: html.match(/<meta name="description" content="([^"]*)"/)?.[1],
	};
}

/** Elementos con texto ocultos a la vista (hidden, sr-only, display:none) dentro de <main>. */
async function hiddenIndexable(page: Page) {
	return page.evaluate(() => {
		const out: string[] = [];
		for (const el of document.querySelectorAll("main *")) {
			const cls = el.getAttribute("class") ?? "";
			const cs = getComputedStyle(el);
			const own = Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.textContent ?? "").trim());
			const hidden = el.hasAttribute("hidden") || /\bsr-only\b/.test(cls) || cs.display === "none" || cs.visibility === "hidden";
			if (hidden && (own || el.querySelector("a[href]"))) out.push(el.tagName + "." + cls);
		}
		return out;
	});
}

for (const route of ["/servicios", "/resenas"] as const) {
	test.describe(`Móvil v2 · ${route}`, () => {
		test("title, description y canonical idénticos a escritorio; un h1; main; sin JSON-LD de reseñas", async ({ page, browser }) => {
			await setup(page);
			await page.goto(route);
			const d = await desktopHead(browser, route);
			expect(d.title).toBeTruthy();
			expect(await page.title()).toBe(d.title);
			await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", d.canonical!);
			await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", d.description!.replace(/&amp;/g, "&"));
			await expect(page.locator("main#main-content")).toHaveCount(1);
			await expect(page.locator("h1")).toHaveCount(1);
			const ld = await page.locator('script[type="application/ld+json"]').evaluateAll((n) => n.map((x) => x.textContent ?? ""));
			expect(ld.join("")).not.toMatch(/aggregateRating|"Review"/);
			if (route === "/servicios") {
				const types = ld.flatMap((x) => (JSON.parse(x)["@graph"] ?? []).map((g: { "@type": string }) => g["@type"]));
				expect(types).toEqual(expect.arrayContaining(["CollectionPage", "BreadcrumbList"]));
			}
		});

		test("sin contenido indexable oculto ni tel:", async ({ page }) => {
			await setup(page);
			await page.goto(route);
			expect(await hiddenIndexable(page)).toEqual([]);
			await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
		});

		for (const width of [360, 390, 430]) {
			test(`sin overflow horizontal a ${width}`, async ({ page }) => {
				await setup(page);
				await page.setViewportSize({ width, height: 844 });
				await page.goto(route);
				await page.waitForLoadState("networkidle");
				const o = await page.evaluate(() => ({
					sw: document.documentElement.scrollWidth,
					cw: document.documentElement.clientWidth,
					bw: document.body.scrollWidth,
				}));
				expect(o.sw).toBeLessThanOrEqual(o.cw);
				expect(o.bw).toBeLessThanOrEqual(o.cw);
				if (SHOTS) {
					mkdirSync(SHOTS, { recursive: true });
					const name = route.slice(1);
					await page.screenshot({ path: `${SHOTS}/${name}-${width}-top.png` });
					if (width === 390) await page.screenshot({ path: `${SHOTS}/${name}-${width}-full.png`, fullPage: true });
				}
			});
		}
	});
}

test.describe("Móvil v2 · /servicios contenido", () => {
	test("10 enlaces a landings, agrupados, con resumen; 4 servicios; CTA", async ({ page }) => {
		await setup(page);
		await page.goto("/servicios");
		const links = page.getByTestId("m-landing-link");
		await expect(links).toHaveCount(10);
		expect(landings).toHaveLength(10);
		for (const l of landings) {
			const a = page.locator(`main a[href="/${l.slug}"]`);
			await expect(a, l.slug).toHaveCount(1);
			await expect(a).toBeVisible();
			await expect(a).toContainText(l.hubSummary.slice(0, 40));
		}
		await expect(page.getByTestId("m-landings-servicio").getByTestId("m-landing-link")).toHaveCount(landings.filter((l) => l.group === "servicio").length);
		await expect(page.getByTestId("m-landings-zona").getByTestId("m-landing-link")).toHaveCount(landings.filter((l) => l.group === "zona").length);
		await expect(page.getByTestId("m-service-rows").locator("li")).toHaveCount(4);
		for (const n of ["Apps para móvil", "Programas de gestión", "Conectar programas", "Webs y tiendas online"]) {
			await expect(page.getByTestId("m-service-rows")).toContainText(n);
		}
		await expect(page.getByTestId("m-servicios-cta")).toHaveAttribute("href", "/contact");
		await expect(page.getByTestId("m-sticky-cta")).toHaveCount(1);
		// JSON-LD del hub: mismo @graph que escritorio.
		const html = await (await page.request.get("/servicios", { headers: { "user-agent": DESKTOP_UA, cookie: "mv2=0" } })).text();
		const dLd = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)?.[1];
		const mLd = await page.locator('script[type="application/ld+json"]').evaluateAll((n) => n.map((x) => x.textContent ?? "").find((x) => x.includes("CollectionPage")));
		expect(mLd).toBeTruthy();
		if (dLd && dLd.includes("CollectionPage")) expect(JSON.parse(mLd!)).toEqual(JSON.parse(dLd));
	});
});

test.describe("Móvil v2 · /resenas contenido", () => {
	test("22 reseñas con texto en español visible, nombre y estrellas", async ({ page }) => {
		await setup(page);
		await page.goto("/resenas");
		expect(testimonials).toHaveLength(22);
		const items = page.getByTestId("m-review");
		await expect(items).toHaveCount(22);
		for (let i = 0; i < testimonials.length; i++) {
			const t = testimonials[i];
			const item = items.nth(i);
			await expect(item).toBeVisible();
			await expect(item.locator("blockquote")).toHaveText(t.quoteEs ?? t.quote);
			await expect(item).toContainText(t.name);
			await expect(item.getByRole("img", { name: "5 de 5 estrellas" })).toBeVisible();
		}
		await expect(page.getByTestId("m-rating-band")).toContainText("5,0");
		await expect(page.getByTestId("m-rating-band")).toContainText("22 reseñas en Google");
	});

	test("enlaces a Google correctos y enlaces a proyecto solo si el dato lo indica", async ({ page }) => {
		await setup(page);
		await page.goto("/resenas");
		const profile = page.getByTestId("m-google-profile");
		const review = page.getByTestId("m-google-review");
		await expect(profile).toHaveAttribute("href", MAPS);
		await expect(review).toHaveAttribute("href", REVIEW);
		await expect(profile).toHaveAttribute("target", "_blank");
		await expect(review).toHaveAttribute("rel", /noopener/);
		const projectLinks = await page.getByTestId("m-review-project").evaluateAll((n) => n.map((a) => a.getAttribute("href")));
		expect(projectLinks.sort()).toEqual(["/projects/almudena-muhle", "/projects/kairos-futures", "/projects/nautirent", "/projects/paris-de-noia"]);
		await expect(page.getByTestId("m-resenas-cta")).toHaveAttribute("href", "/contact");
		await expect(page.getByTestId("m-sticky-cta")).toHaveCount(1);
	});
});
