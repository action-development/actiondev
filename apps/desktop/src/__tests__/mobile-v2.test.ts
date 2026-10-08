// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  MOBILE_TREE_ROUTES,
  enabledRoutes,
  hasMobileTree,
  mobileV2Mode,
  servesMobileTree,
} from "@/lib/mobile-v2";

const ALL = enabledRoutes("*");

describe("enabledRoutes (rutas públicas)", () => {
  it("sin definir o vacía: ninguna", () => {
    expect(enabledRoutes(undefined)).toEqual([]);
    expect(enabledRoutes("")).toEqual([]);
    expect(enabledRoutes("  ")).toEqual([]);
  });
  it("`*`: todas las rutas con árbol móvil", () => {
    expect(enabledRoutes("*")).toEqual([...MOBILE_TREE_ROUTES]);
  });
  it("lista: normaliza barras finales e ignora lo que no tiene árbol", () => {
    expect(enabledRoutes("/hablemos/, /contact ,/blog,/legal/cookies")).toEqual(["/hablemos", "/contact"]);
    expect(enabledRoutes("/projects/fase")).toEqual(["/projects/fase"]);
  });
});

describe("servesMobileTree", () => {
  it("off: nunca, ni con cookie", () => {
    expect(servesMobileTree("off", "/", true, ALL)).toBe(false);
    expect(servesMobileTree("off", "/", false, ALL)).toBe(false);
  });
  it("qa: solo con cookie, todas las rutas con árbol", () => {
    expect(servesMobileTree("qa", "/contact", false, ALL)).toBe(false);
    for (const route of MOBILE_TREE_ROUTES) expect(servesMobileTree("qa", route, true, [])).toBe(true);
  });
  it("on + `*` sin cookie: todas las de la lista (el público no cambia)", () => {
    for (const route of MOBILE_TREE_ROUTES) expect(servesMobileTree("on", route, false, ALL)).toBe(true);
  });
  it("on + vacía sin cookie: ninguna", () => {
    expect(servesMobileTree("on", "/", false, [])).toBe(false);
  });
  it("on + lista parcial: público solo lo nombrado, cookie = vista previa de todas", () => {
    const publicRoutes = enabledRoutes("/hablemos,/contact");
    expect(servesMobileTree("on", "/hablemos/app", false, publicRoutes)).toBe(true);
    expect(servesMobileTree("on", "/servicios", false, publicRoutes)).toBe(false);
    expect(servesMobileTree("on", "/servicios", true, publicRoutes)).toBe(true);
  });
  it("rutas sin árbol nunca, ni con cookie", () => {
    expect(hasMobileTree("/blog")).toBe(false);
    expect(servesMobileTree("on", "/blog", true, ALL)).toBe(false);
    expect(servesMobileTree("qa", "/desarrollo-web-vigo", true, ALL)).toBe(false);
  });
  it("`/` casa solo consigo misma", () => {
    expect(hasMobileTree("/")).toBe(true);
    expect(hasMobileTree("/otra")).toBe(false);
    expect(hasMobileTree("/contactar")).toBe(false);
  });
});

describe("mobileV2Mode", () => {
  it("valores desconocidos = off", () => {
    expect(mobileV2Mode(undefined)).toBe("off");
    expect(mobileV2Mode("ON")).toBe("off");
    expect(mobileV2Mode("on")).toBe("on");
    expect(mobileV2Mode("qa")).toBe("qa");
  });
});

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const DESKTOP = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15";

async function runMiddleware(env: Record<string, string>, url: string, ua: string, cookie?: string) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  vi.stubEnv("MOBILE_ZONE_URL", "");
  const { middleware } = await import("@/middleware");
  const headers: Record<string, string> = { "user-agent": ua };
  if (cookie) headers.cookie = cookie;
  return middleware(new NextRequest(url, { headers }));
}

const rewriteOf = (res: Response) => res.headers.get("x-middleware-rewrite");

describe("middleware", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("on + `*`: el público móvil recibe el árbol móvil; escritorio y tablet, no", async () => {
    const env = { MOBILE_V2: "on", MOBILE_V2_ROUTES: "*" };
    expect(rewriteOf(await runMiddleware(env, "http://x.test/servicios", IPHONE))).toContain("/m/servicios");
    expect(rewriteOf(await runMiddleware(env, "http://x.test/", IPHONE))).toMatch(/\/m$/);
    expect(rewriteOf(await runMiddleware(env, "http://x.test/servicios", DESKTOP))).toBeNull();
    expect(rewriteOf(await runMiddleware(env, "http://x.test/blog", IPHONE))).toBeNull();
  });

  it("on + lista parcial: la cookie previsualiza lo no publicado", async () => {
    const env = { MOBILE_V2: "on", MOBILE_V2_ROUTES: "/contact" };
    expect(rewriteOf(await runMiddleware(env, "http://x.test/servicios", IPHONE))).toBeNull();
    expect(rewriteOf(await runMiddleware(env, "http://x.test/servicios", IPHONE, "mv2=1"))).toContain("/m/servicios");
    expect(rewriteOf(await runMiddleware(env, "http://x.test/servicios", IPHONE, "mv2=0"))).toBeNull();
  });

  it("qa: sin cookie nada, con cookie todo", async () => {
    const env = { MOBILE_V2: "qa" };
    expect(rewriteOf(await runMiddleware(env, "http://x.test/resenas", IPHONE))).toBeNull();
    expect(rewriteOf(await runMiddleware(env, "http://x.test/resenas", IPHONE, "mv2=1"))).toContain("/m/resenas");
  });

  it.each(["qa", "on"])("%s: ?mv2=1 pone la cookie y ?mv2=0 la quita, con 307 a la URL limpia", async (mode) => {
    const env = { MOBILE_V2: mode, MOBILE_V2_ROUTES: "*" };
    const set = await runMiddleware(env, "http://x.test/contact?mv2=1&a=b", IPHONE);
    expect(set.status).toBe(307);
    expect(set.headers.get("location")).toBe("http://x.test/contact?a=b");
    expect(set.headers.get("set-cookie")).toMatch(/mv2=1/);
    const del = await runMiddleware(env, "http://x.test/contact?mv2=0", IPHONE, "mv2=1");
    expect(del.status).toBe(307);
    expect(del.headers.get("location")).toBe("http://x.test/contact");
    expect(del.headers.get("set-cookie")).toMatch(/mv2=;|Max-Age=0|Expires=Thu, 01 Jan 1970/i);
  });

  it("off: ?mv2=1 no hace nada", async () => {
    const res = await runMiddleware({ MOBILE_V2: "off" }, "http://x.test/contact?mv2=1", IPHONE);
    expect(res.status).toBe(200);
    expect(rewriteOf(res)).toBeNull();
  });

  it("`/m/*` directo sigue siendo 308 a la pública", async () => {
    const res = await runMiddleware({ MOBILE_V2: "on", MOBILE_V2_ROUTES: "*" }, "http://x.test/m/servicios", IPHONE);
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("http://x.test/servicios");
  });
});
