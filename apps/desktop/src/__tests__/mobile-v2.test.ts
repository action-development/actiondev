// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { landings } from "@/data/landings";
import {
  LANDING_ROUTES,
  MOBILE_TREE_ROUTES,
  enabledRoutes,
  hasMobileTree,
  mobileV2Mode,
  navigatesWithinMobileTree,
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
    expect(enabledRoutes("/hablemos/, /contact ,/legal/cookies,/no-existe")).toEqual(["/hablemos", "/contact"]);
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
    expect(hasMobileTree("/legal/cookies")).toBe(false);
    expect(servesMobileTree("on", "/legal/cookies", true, ALL)).toBe(false);
    expect(servesMobileTree("qa", "/reviews", true, ALL)).toBe(false);
  });
  it("`/` casa solo consigo misma", () => {
    expect(hasMobileTree("/")).toBe(true);
    expect(hasMobileTree("/otra")).toBe(false);
    expect(hasMobileTree("/contactar")).toBe(false);
  });
});

describe("fase 2: landings SEO y blog", () => {
  it("LANDING_ROUTES casa una a una con landings.ts", () => {
    expect([...LANDING_ROUTES].sort()).toEqual(landings.map((l) => `/${l.slug}`).sort());
  });
  it("las landings y el blog (con sus artículos) tienen árbol; sus vecinas no", () => {
    for (const route of LANDING_ROUTES) expect(hasMobileTree(route), route).toBe(true);
    expect(hasMobileTree("/blog")).toBe(true);
    expect(hasMobileTree("/blog/mvp-de-una-app")).toBe(true);
    expect(hasMobileTree("/desarrollo-web-vigo-2")).toBe(false);
    expect(hasMobileTree("/diseno-web-pontevedra")).toBe(false);
  });
  it("qa con cookie: vista previa de las rutas de fase 2", () => {
    expect(servesMobileTree("qa", "/desarrollo-web-vigo", true, [])).toBe(true);
    expect(servesMobileTree("qa", "/blog/mvp-de-una-app", true, [])).toBe(true);
  });
  it("on con la lista de fase 1: sin cookie siguen en escritorio", () => {
    const phase1 = enabledRoutes("/,/servicios,/projects,/resenas,/contact,/hablemos");
    expect(servesMobileTree("on", "/desarrollo-web-vigo", false, phase1)).toBe(false);
    expect(servesMobileTree("on", "/blog", false, phase1)).toBe(false);
    expect(servesMobileTree("on", "/blog", true, phase1)).toBe(true);
  });
});

describe("navigatesWithinMobileTree (next/link o <a> en MLink)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("sin árbol: nunca", () => {
    expect(navigatesWithinMobileTree("/legal/privacy")).toBe(false);
  });
  it("qa (o entorno desconocido, como el navegador): todo el árbol", () => {
    vi.stubEnv("MOBILE_V2", "qa");
    expect(navigatesWithinMobileTree("/desarrollo-web-vigo")).toBe(true);
    vi.stubEnv("MOBILE_V2", "");
    expect(navigatesWithinMobileTree("/blog")).toBe(true);
  });
  it("on: solo las rutas públicas; una con árbol sin publicar va por <a>", () => {
    vi.stubEnv("MOBILE_V2", "on");
    vi.stubEnv("MOBILE_V2_ROUTES", "/,/servicios,/projects,/resenas,/contact,/hablemos");
    expect(navigatesWithinMobileTree("/projects/fase")).toBe(true);
    expect(navigatesWithinMobileTree("/desarrollo-web-vigo")).toBe(false);
    expect(navigatesWithinMobileTree("/blog")).toBe(false);
    vi.stubEnv("MOBILE_V2_ROUTES", "*");
    expect(navigatesWithinMobileTree("/blog")).toBe(true);
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
    expect(rewriteOf(await runMiddleware(env, "http://x.test/blog", IPHONE))).toContain("/m/blog");
    expect(rewriteOf(await runMiddleware(env, "http://x.test/legal/cookies", IPHONE))).toBeNull();
  });

  it("on + lista de fase 1: landing y blog en escritorio salvo con la cookie", async () => {
    const env = { MOBILE_V2: "on", MOBILE_V2_ROUTES: "/,/servicios,/projects,/resenas,/contact,/hablemos" };
    expect(rewriteOf(await runMiddleware(env, "http://x.test/desarrollo-web-vigo", IPHONE))).toBeNull();
    expect(rewriteOf(await runMiddleware(env, "http://x.test/blog/mvp-de-una-app", IPHONE))).toBeNull();
    expect(rewriteOf(await runMiddleware(env, "http://x.test/desarrollo-web-vigo", IPHONE, "mv2=1"))).toContain(
      "/m/desarrollo-web-vigo",
    );
    expect(rewriteOf(await runMiddleware(env, "http://x.test/blog/mvp-de-una-app", IPHONE, "mv2=1"))).toContain(
      "/m/blog/mvp-de-una-app",
    );
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
