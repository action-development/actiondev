import { devices, expect, type Browser, type Page } from "@playwright/test";

/**
 * Comprobaciones de la regla de oro de la web móvil v2 (CLAUDE.md `[SEO]`) que
 * comparten los specs móviles de fase 2: lo que sirve el árbol móvil en una
 * URL frente a lo que sirve el escritorio en la MISMA URL.
 */

export const DESKTOP_UA = devices["Desktop Chrome"].userAgent;

export async function setup(page: Page) {
  await page.addInitScript(() => localStorage.setItem("action-cookie-consent", "denied"));
  await page.route(/googletagmanager\.com|wa\.me/, (route) => route.abort());
}

/** Elementos con texto ocultos a la vista (hidden, sr-only, display:none) dentro de `<main>`: no debe haber ninguno. */
export async function hiddenIndexable(page: Page) {
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

export type View = {
  title: string;
  description: string;
  canonical: string;
  ogType: string;
  published: string;
  ld: string[];
  h1: string[];
  links: string[];
  texts: string[];
};

export async function readView(page: Page): Promise<View> {
  return page.evaluate(() => {
    const meta = (sel: string) => document.querySelector(sel)?.getAttribute("content") ?? "";
    const texts: string[] = [];
    const walker = document.createTreeWalker(document.querySelector("main")!, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = (n.textContent ?? "").replace(/\s+/g, " ").trim();
      if (t.length >= 20 && !n.parentElement?.closest("script,style")) texts.push(t);
    }
    return {
      title: document.title,
      description: meta('meta[name="description"]'),
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
      ogType: meta('meta[property="og:type"]'),
      published: meta('meta[property="article:published_time"]'),
      ld: Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map((s) => s.textContent ?? "")
        .filter((t) => t.includes("@graph")),
      h1: Array.from(document.querySelectorAll("h1")).map((h) => h.textContent?.trim() ?? ""),
      links: [
        ...new Set(
          Array.from(document.querySelectorAll<HTMLAnchorElement>("main a[href^='/']"))
            .map((a) => a.getAttribute("href")!.split("#")[0])
            .filter(Boolean),
        ),
      ],
      texts,
    };
  });
}

export async function desktopView(browser: Browser, path: string): Promise<View> {
  const ctx = await browser.newContext({ userAgent: DESKTOP_UA, viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => sessionStorage.setItem("action-loaded", "1"));
  const page = await ctx.newPage();
  await page.goto(path);
  await expect(page.getByTestId("m-header")).toHaveCount(0);
  const view = await readView(page);
  await ctx.close();
  return view;
}

/** Textos de escritorio que el móvil dice con otro rótulo (vocabulario de DESIGN.md §11). */
const RELABELED = new Set(["← Todos los artículos"]);
const norm = (s: string) => s.replace(/[«»←→]/g, "").replace(/\s+/g, " ").trim().toLowerCase();

export function expectParity(mobile: View, desktop: View, path: string) {
  expect(mobile.title, "title").toBe(desktop.title);
  expect(mobile.description, "description").toBe(desktop.description);
  expect(mobile.canonical, "canonical").toBe(`https://actiondev.es${path}`);
  expect(mobile.canonical).toBe(desktop.canonical);
  expect(mobile.ogType).toBe(desktop.ogType);
  expect(mobile.published).toBe(desktop.published);
  expect(mobile.ld, "JSON-LD").toEqual(desktop.ld);
  expect(mobile.h1).toHaveLength(1);
  expect(mobile.h1).toEqual(desktop.h1);
  expect(desktop.links.filter((href) => href !== path && !mobile.links.includes(href)), "enlaces").toEqual([]);
  const all = norm(mobile.texts.join(" "));
  expect(
    desktop.texts.filter((t) => !RELABELED.has(t) && !all.includes(norm(t))),
    "textos de escritorio que faltan",
  ).toEqual([]);
}
