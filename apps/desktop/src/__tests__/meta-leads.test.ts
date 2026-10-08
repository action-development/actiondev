// @vitest-environment node
import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  after: [] as Array<() => unknown>,
  notify: vi.fn<(...args: unknown[]) => Promise<void>>(async () => {}),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return { ...actual, after: (fn: () => unknown) => void mocks.after.push(fn) };
});
vi.mock("@/lib/leads/notify", () => ({ notifyLead: (...args: unknown[]) => mocks.notify(...args) }));

import { GET, POST } from "@/app/api/meta/leads/route";
import { POST as SYNC } from "@/app/api/meta/leads/sync/route";
import { buildLeadFields } from "@/lib/leads/firestore";
import { resetMetaTokenCache } from "@/lib/leads/meta";
import { safeEqual, verifyMetaSignature } from "@/lib/leads/meta-auth";
import { extractLeadgenEvents } from "@/lib/leads/meta-ingest";
import { mapMetaLead, matchOption, META_BUDGET_OPTIONS, META_NEED_OPTIONS, META_STAGE_OPTIONS, normalizeAnswer, type MetaLead } from "@/lib/leads/meta-map";
import { parseLeadRequest } from "@/lib/leads/parse";

const APP_SECRET = "app-secret-de-prueba";
const PAGE_ID = "900000000000001";
const FORM_ID = "800000000000001";
const AD_NAME = "MT01.A.01 | ad02-excel | Imagen 4:5+9:16";

/** Lead tal y como lo devuelve la Graph API para IF01 (claves generadas por Meta a partir del texto). */
function metaLead(id: string, overrides: Partial<MetaLead> = {}, answers: Record<string, string> = {}): MetaLead {
  const base: Record<string, string> = {
    "¿qué_necesitas?": "App móvil",
    "¿en_qué_punto_estás?": "Es una idea",
    presupuesto_orientativo: "5.000 – 15.000 €",
    "en_una_frase:_¿qué_proceso_o_idea_quieres_resolver?": "Controlar los partes de trabajo desde el móvil",
    full_name: "Ana Pérez",
    email: "ana@empresa.es",
    phone_number: "+34600123456",
    company_name: "Empresa SL",
    ...answers,
  };
  return {
    id,
    created_time: "2026-10-08T20:15:04+0000",
    field_data: Object.entries(base).map(([name, value]) => ({ name, values: [value] })),
    ad_id: "700000000000001",
    ad_name: AD_NAME,
    adset_name: "MT01.A | Galicia 25+",
    campaign_name: "MT01 | Leads | Formulario | Galicia | Apps+Software",
    form_id: FORM_ID,
    platform: "ig",
    is_organic: false,
    ...overrides,
  };
}

const ok = (raw: MetaLead, includeOrganic = false) => {
  const r = mapMetaLead(raw, { includeOrganic });
  if (!r.ok) throw new Error(`mapper: ${r.reason}`);
  return r;
};

describe("mapMetaLead", () => {
  it("traduce el formulario IF01 a un lead interno", () => {
    const r = ok(metaLead("123456789"));
    expect(r.docId).toBe("meta_123456789");
    expect(r.createdAt).toBe("2026-10-08T20:15:04.000Z");
    expect(r.lead).toEqual({
      source: "meta_lead_form",
      phone: "+34600123456",
      notes: `Controlar los partes de trabajo desde el móvil\n\n[Formulario Meta · ${AD_NAME}]`,
      attribution: {
        utmSource: "facebook",
        utmMedium: "instant_form",
        utmCampaign: "MT01 | Leads | Formulario | Galicia | Apps+Software",
        utmContent: AD_NAME,
        landingPath: `/meta/${FORM_ID}`,
      },
      consent: "unknown",
      need: "app",
      stage: "idea",
      budget: "5k-15k",
      name: "Ana Pérez",
      email: "ana@empresa.es",
      company: "Empresa SL",
    });
  });

  it("acepta cada opción exacta de la estrategia (§2.3) y la etiqueta de la web", () => {
    const table: Array<[string, string, readonly (readonly [string, string])[]]> = [
      ["App móvil", "app", META_NEED_OPTIONS],
      ["Software de gestión o ERP", "software", META_NEED_OPTIONS],
      ["Integración entre programas", "integration", META_NEED_OPTIONS],
      ["Aún no lo tengo claro", "unsure", META_NEED_OPTIONS],
      ["Es una idea", "idea", META_STAGE_OPTIONS],
      ["Sé lo que necesito", "defined", META_STAGE_OPTIONS],
      ["Ya existe y hay que mejorarlo", "existing", META_STAGE_OPTIONS],
      ["Ya existe y hay que mejorarlo o conectarlo", "existing", META_STAGE_OPTIONS],
      ["Menos de 5.000 €", "lt5k", META_BUDGET_OPTIONS],
      ["5.000 – 15.000 €", "5k-15k", META_BUDGET_OPTIONS],
      ["15.000 – 40.000 €", "15k-40k", META_BUDGET_OPTIONS],
      ["Más de 40.000 €", "gt40k", META_BUDGET_OPTIONS],
      ["Aún no lo sé", "unknown", META_BUDGET_OPTIONS],
    ];
    for (const [text, value, options] of table) expect(matchOption(text, options), text).toBe(value);
  });

  it("normaliza mayúsculas, tildes, guiones bajos, guiones y separadores de miles", () => {
    expect(normalizeAnswer("5.000_–_15.000_€")).toBe("5000 15000");
    expect(matchOption("app_móvil", META_NEED_OPTIONS)).toBe("app");
    expect(matchOption("SOFTWARE DE GESTION O ERP", META_NEED_OPTIONS)).toBe("software");
    expect(matchOption("integracion-entre-programas", META_NEED_OPTIONS)).toBe("integration");
    expect(matchOption("se_lo_que_necesito", META_STAGE_OPTIONS)).toBe("defined");
    expect(matchOption("menos_de_5.000_€", META_BUDGET_OPTIONS)).toBe("lt5k");
    expect(matchOption("5000-15000", META_BUDGET_OPTIONS)).toBe("5k-15k");
    expect(matchOption("15,000 - 40,000 €", META_BUDGET_OPTIONS)).toBe("15k-40k");
    expect(matchOption("mas_de_40.000_€", META_BUDGET_OPTIONS)).toBe("gt40k");
    expect(matchOption("aun_no_lo_se", META_BUDGET_OPTIONS)).toBe("unknown");
    // Valor interno tal cual y opción recortada por Meta.
    expect(matchOption("5k-15k", META_BUDGET_OPTIONS)).toBe("5k-15k");
    expect(matchOption("Ya existe, hay que mejor", META_STAGE_OPTIONS)).toBe("existing");
  });

  it("lo que no casa va al valor por defecto y el texto original a las notas", () => {
    const r = ok(
      metaLead("1", {}, {
        "¿qué_necesitas?": "Una web para mi bar",
        "¿en_qué_punto_estás?": "Ni idea",
        presupuesto_orientativo: "Depende",
      }),
    );
    expect(r.lead.need).toBe("unsure");
    expect(r.lead.budget).toBe("unknown");
    expect(r.lead.stage).toBeUndefined();
    expect(r.lead.notes).toContain("¿qué necesitas?: Una web para mi bar");
    expect(r.lead.notes).toContain("¿en qué punto estás?: Ni idea");
    expect(r.lead.notes).toContain("presupuesto orientativo: Depende");
  });

  it("sin pista en la clave, reconoce la pregunta por la respuesta", () => {
    const raw = metaLead("2");
    raw.field_data = [
      { name: "question_1", values: ["integración_entre_programas"] },
      { name: "question_2", values: ["Sé lo que necesito"] },
      { name: "question_3", values: ["Más de 40.000 €"] },
      { name: "question_4", values: ["Conectar la tienda con el ERP"] },
      { name: "phone_number", values: ["612 345 678"] },
    ];
    const r = ok(raw);
    expect(r.lead).toMatchObject({ need: "integration", stage: "defined", budget: "gt40k", phone: "+34612345678" });
    expect(r.lead.notes).toContain("question 4: Conectar la tienda con el ERP");
    expect(r.lead.name).toBeUndefined();
  });

  it("notas con el tope de 500 sin perder la etiqueta del anuncio", () => {
    const r = ok(metaLead("3", { ad_name: "x".repeat(400) }, { "en_una_frase:_¿qué_proceso_o_idea_quieres_resolver?": "y".repeat(900) }));
    expect(r.lead.notes.length).toBeLessThanOrEqual(500);
    expect(r.lead.notes).toMatch(/\[Formulario Meta · x+…\]$/);
    expect(r.lead.notes.startsWith("yyy")).toBe(true);
  });

  it("descarta los orgánicos salvo que se configure lo contrario", () => {
    expect(mapMetaLead(metaLead("4", { is_organic: true }))).toEqual({ ok: false, reason: "organic" });
    expect(ok(metaLead("4", { is_organic: true }), true).docId).toBe("meta_4");
  });

  it("rechaza sin teléfono válido o con un id que no es de la Graph API", () => {
    expect(mapMetaLead(metaLead("5", {}, { phone_number: "" }))).toEqual({ ok: false, reason: "invalid_phone" });
    expect(mapMetaLead(metaLead("../leads/x"))).toEqual({ ok: false, reason: "invalid_id" });
  });

  it("sin anuncio ni fecha legible: etiqueta corta y hora actual", () => {
    const now = new Date("2026-10-09T08:00:00.000Z");
    const r = mapMetaLead(metaLead("6", { ad_name: undefined, campaign_name: undefined, created_time: "ayer" }), { now });
    if (!r.ok) throw new Error("mapper");
    expect(r.createdAt).toBe(now.toISOString());
    expect(r.lead.notes.endsWith("[Formulario Meta]")).toBe(true);
    expect(r.lead.attribution).toEqual({ utmSource: "facebook", utmMedium: "instant_form", landingPath: `/meta/${FORM_ID}` });
  });

  it("el documento solo lleva claves de Lead y el origen nuevo", () => {
    const r = ok(metaLead("7"));
    const fields = buildLeadFields(r.lead, r.createdAt);
    expect(Object.keys(fields).sort()).toEqual(
      ["attribution", "budget", "company", "consent", "createdAt", "email", "name", "need", "notes", "phone", "privacyVersion", "source", "stage", "status"].sort(),
    );
    expect(fields.source).toEqual({ stringValue: "meta_lead_form" });
    expect(fields.consent).toEqual({ stringValue: "unknown" });
  });

  it("/api/lead NO acepta el origen de Meta", () => {
    expect(parseLeadRequest({ source: "meta_lead_form", phone: "600123456" })).toEqual({ ok: false, error: "invalid_source" });
  });
});

describe("firma del webhook", () => {
  const body = Buffer.from(JSON.stringify({ object: "page", entry: [] }));
  const sign = (b: Uint8Array, secret = APP_SECRET) => `sha256=${createHmac("sha256", secret).update(b).digest("hex")}`;

  it("válida, inválida y ausente", () => {
    expect(verifyMetaSignature(body, sign(body), APP_SECRET)).toBe(true);
    expect(verifyMetaSignature(body, sign(body).toUpperCase().replace("SHA256", "sha256"), APP_SECRET)).toBe(true);
    expect(verifyMetaSignature(body, sign(body, "otro"), APP_SECRET)).toBe(false);
    expect(verifyMetaSignature(Buffer.from(`${body} `), sign(body), APP_SECRET)).toBe(false);
    expect(verifyMetaSignature(body, null, APP_SECRET)).toBe(false);
    expect(verifyMetaSignature(body, "sha1=abc", APP_SECRET)).toBe(false);
    expect(verifyMetaSignature(body, sign(body), "")).toBe(false);
  });

  it("compara secretos en tiempo constante sin aceptar vacíos", () => {
    expect(safeEqual("a", "a")).toBe(true);
    expect(safeEqual("a", "b")).toBe(false);
    expect(safeEqual(null, "a")).toBe(false);
    expect(safeEqual("", "")).toBe(false);
  });

  it("extrae los leadgen_id sin repetir y solo del campo leadgen", () => {
    const events = extractLeadgenEvents({
      object: "page",
      entry: [
        {
          id: PAGE_ID,
          changes: [
            { field: "leadgen", value: { leadgen_id: "111", page_id: PAGE_ID, form_id: FORM_ID } },
            { field: "leadgen", value: { leadgen_id: "111" } },
            { field: "feed", value: { leadgen_id: "222" } },
            { field: "leadgen", value: { leadgen_id: "../x" } },
            { field: "leadgen", value: { leadgen_id: 333 } },
          ],
        },
      ],
    });
    expect(events).toEqual([
      { leadgenId: "111", pageId: PAGE_ID },
      { leadgenId: "333", pageId: PAGE_ID },
    ]);
    expect(extractLeadgenEvents({ object: "user", entry: [] })).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Rutas con red simulada: Graph API + Firestore REST + ERP en un solo `fetch`.
// ---------------------------------------------------------------------------

interface World {
  docs: Set<string>;
  erp: Array<Record<string, unknown>>;
  graphCalls: Array<{ url: URL; auth: string | null }>;
  leads: Record<string, MetaLead>;
  formPages: MetaLead[][];
}

function installFetch(world: World) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const headers = new Headers(init?.headers);

    if (url.hostname === "firestore.googleapis.com") {
      const id = url.searchParams.get("documentId");
      if (!id) return Response.json({ name: "projects/p/databases/(default)/documents/leads/auto123" });
      if (world.docs.has(id)) return Response.json({ error: { code: 409, status: "ALREADY_EXISTS" } }, { status: 409 });
      const fields = JSON.parse(String(init?.body)).fields;
      if (fields.source.stringValue !== "meta_lead_form") return Response.json({}, { status: 403 });
      world.docs.add(id);
      return Response.json({ name: `projects/p/databases/(default)/documents/leads/${id}` });
    }

    if (url.hostname === "erp.test") {
      const payload = JSON.parse(String(init?.body));
      const duplicate = world.erp.some((p) => p.externalId === payload.externalId);
      world.erp.push(payload);
      return Response.json({ ok: true, duplicate }, { status: duplicate ? 200 : 201 });
    }

    if (url.hostname === "graph.facebook.com") {
      world.graphCalls.push({ url, auth: headers.get("authorization") });
      const [, version, ...rest] = url.pathname.split("/");
      expect(version).toBe("v26.0");
      const path = rest.join("/");
      if (path === PAGE_ID && url.searchParams.get("fields") === "access_token") {
        return Response.json({ id: PAGE_ID, access_token: "PAGE_TOKEN" });
      }
      if (path === `${PAGE_ID}/leadgen_forms`) {
        return Response.json({ data: [{ id: FORM_ID, name: "IF01", status: "ACTIVE" }], paging: { cursors: { after: "f1" } } });
      }
      if (path === `${FORM_ID}/leads`) {
        const page = url.searchParams.get("after") ? 1 : 0;
        const data = world.formPages[page] ?? [];
        const more = page + 1 < world.formPages.length;
        return Response.json({ data, paging: { cursors: { after: `c${page}` }, ...(more ? { next: "https://graph.facebook.com/next" } : {}) } });
      }
      const lead = world.leads[path];
      if (lead) return Response.json(lead);
      return Response.json({ error: { code: 100, message: "Unsupported get request", fbtrace_id: "T" } }, { status: 400 });
    }

    throw new Error(`fetch inesperado: ${url.hostname}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const runAfter = async () => {
  const pending = mocks.after.splice(0);
  for (const fn of pending) await fn();
};

describe("rutas de Meta", () => {
  let world: World;

  beforeEach(() => {
    world = { docs: new Set(), erp: [], graphCalls: [], leads: {}, formPages: [] };
    installFetch(world);
    mocks.after.length = 0;
    mocks.notify.mockClear();
    resetMetaTokenCache();
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "demo");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "web-key");
    vi.stubEnv("LEAD_ERP_URL", "https://erp.test/api/leads/inbound");
    vi.stubEnv("LEAD_ERP_SECRET", "erp-secret");
    vi.stubEnv("META_APP_SECRET", APP_SECRET);
    vi.stubEnv("META_WEBHOOK_VERIFY_TOKEN", "verifica-esto");
    vi.stubEnv("META_LEADS_TOKEN", "SYSTEM_TOKEN");
    vi.stubEnv("META_PAGE_ID", PAGE_ID);
    vi.stubEnv("META_LEADS_SYNC_SECRET", "sync-secret");
    vi.stubEnv("META_FORM_IDS", "");
    vi.stubEnv("META_GRAPH_VERSION", "");
    vi.stubEnv("META_LEADS_INCLUDE_ORGANIC", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe("GET (verificación de la suscripción)", () => {
    const verify = (query: string) => GET(new Request(`https://actiondev.es/api/meta/leads?${query}`));

    it("devuelve el challenge con el token correcto", async () => {
      const res = verify("hub.mode=subscribe&hub.verify_token=verifica-esto&hub.challenge=1158201444");
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/plain");
      expect(await res.text()).toBe("1158201444");
    });

    it("403 con token o modo incorrectos, 400 con un challenge raro, 503 sin configurar", async () => {
      expect(verify("hub.mode=subscribe&hub.verify_token=otro&hub.challenge=1").status).toBe(403);
      expect(verify("hub.mode=unsubscribe&hub.verify_token=verifica-esto&hub.challenge=1").status).toBe(403);
      expect(verify("hub.mode=subscribe&hub.challenge=1").status).toBe(403);
      expect(verify("hub.mode=subscribe&hub.verify_token=verifica-esto&hub.challenge=%3Cscript%3E").status).toBe(400);
      vi.stubEnv("META_WEBHOOK_VERIFY_TOKEN", "");
      expect(verify("hub.mode=subscribe&hub.verify_token=verifica-esto&hub.challenge=1").status).toBe(503);
    });
  });

  describe("POST (evento leadgen)", () => {
    const event = (leadgenId: string) =>
      JSON.stringify({
        object: "page",
        entry: [{ id: PAGE_ID, time: 1, changes: [{ field: "leadgen", value: { leadgen_id: leadgenId, page_id: PAGE_ID, form_id: FORM_ID } }] }],
      });
    const post = (body: string, signature?: string | null) =>
      POST(
        new Request("https://actiondev.es/api/meta/leads", {
          method: "POST",
          headers: signature ? { "x-hub-signature-256": signature } : {},
          body,
        }),
      );
    const sign = (body: string) => `sha256=${createHmac("sha256", APP_SECRET).update(body).digest("hex")}`;

    it("rechaza sin firma o con firma inválida, sin procesar nada", async () => {
      const body = event("333");
      expect((await post(body)).status).toBe(401);
      expect((await post(body, sign(`${body} `))).status).toBe(401);
      const good = sign(body);
      const flipped = `${good.slice(0, -1)}${good.endsWith("0") ? "1" : "0"}`;
      expect((await post(body, flipped)).status).toBe(401);
      expect(mocks.after).toHaveLength(0);
      expect(world.graphCalls).toHaveLength(0);
    });

    it("503 sin META_APP_SECRET", async () => {
      vi.stubEnv("META_APP_SECRET", "");
      expect((await post(event("333"), "sha256=00")).status).toBe(503);
    });

    it("firma válida: 200 al momento y el lead entra en el pipeline una sola vez", async () => {
      world.leads["333"] = metaLead("333");
      const body = event("333");
      const res = await post(body, sign(body));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true, received: 1 });
      expect(world.docs.size).toBe(0); // nada antes de `after()`

      await runAfter();
      expect(world.docs).toEqual(new Set(["meta_333"]));
      expect(mocks.notify).toHaveBeenCalledTimes(1);
      expect(mocks.notify.mock.calls[0][1]).toBe("meta_333");
      expect(world.erp).toHaveLength(1);
      expect(world.erp[0]).toMatchObject({ externalId: "meta_333", source: "meta_lead_form", need: "app", consent: "unknown" });

      // Token de página en la cabecera, nunca en la URL; appsecret_proof del token usado.
      const leadCall = world.graphCalls.find((c) => c.url.pathname.endsWith("/333"))!;
      expect(leadCall.auth).toBe("Bearer PAGE_TOKEN");
      expect(leadCall.url.search).not.toContain("TOKEN");
      expect(leadCall.url.searchParams.get("appsecret_proof")).toBe(createHmac("sha256", APP_SECRET).update("PAGE_TOKEN").digest("hex"));

      // Reentrega del mismo evento (Meta reintenta): ya existe → ni aviso ni ERP.
      await post(body, sign(body));
      await runAfter();
      expect(mocks.notify).toHaveBeenCalledTimes(1);
      expect(world.erp).toHaveLength(1);
    });

    it("si no se puede leer el lead, responde 200 igual y no guarda nada (lo recoge el sync)", async () => {
      const body = event("404");
      expect((await post(body, sign(body))).status).toBe(200);
      await runAfter();
      expect(world.docs.size).toBe(0);
      expect(mocks.notify).not.toHaveBeenCalled();
    });
  });

  describe("POST /sync", () => {
    const sync = (query = "", secret: string | null = "sync-secret") =>
      SYNC(
        new Request(`https://actiondev.es/api/meta/leads/sync${query}`, {
          method: "POST",
          headers: secret ? { "x-sync-secret": secret } : {},
        }),
      );

    it("401 sin secreto o con uno incorrecto, 400 con horas no válidas, 503 sin configurar", async () => {
      expect((await sync("", null)).status).toBe(401);
      expect((await sync("", "otro")).status).toBe(401);
      expect((await sync("?hours=abc")).status).toBe(400);
      vi.stubEnv("META_LEADS_SYNC_SECRET", "");
      expect((await sync()).status).toBe(503);
      expect(world.graphCalls).toHaveLength(0);
    });

    it("es idempotente: la segunda pasada no avisa ni reenvía nada", async () => {
      world.formPages = [[metaLead("501")], [metaLead("502"), metaLead("503", { is_organic: true })]];

      const first = await sync("?hours=48");
      expect(first.status).toBe(200);
      const counts = await first.json();
      expect(counts).toMatchObject({ ok: true, hours: 48, forms: 1, fetched: 3, created: 2, existing: 0, organic: 1, errors: 0 });
      // Solo recuentos: ningún dato personal en la respuesta.
      expect(JSON.stringify(counts)).not.toMatch(/Ana|empresa|\+34/);
      expect(world.docs).toEqual(new Set(["meta_501", "meta_502"]));
      expect(mocks.notify).toHaveBeenCalledTimes(2);
      expect(world.erp.map((p) => p.externalId)).toEqual(["meta_501", "meta_502"]);

      const second = await (await sync("?hours=48")).json();
      expect(second).toMatchObject({ created: 0, existing: 2, organic: 1, errors: 0 });
      expect(mocks.notify).toHaveBeenCalledTimes(2);
      expect(world.erp).toHaveLength(2);

      // Filtro por fecha y paginación por cursor.
      const leadCalls = world.graphCalls.filter((c) => c.url.pathname.endsWith(`/${FORM_ID}/leads`));
      const filtering = JSON.parse(leadCalls[0].url.searchParams.get("filtering")!);
      expect(filtering[0]).toMatchObject({ field: "time_created", operator: "GREATER_THAN" });
      expect(Math.abs(filtering[0].value - (Date.now() / 1000 - 48 * 3600))).toBeLessThan(60);
      expect(leadCalls[1].url.searchParams.get("after")).toBe("c0");
    });

    it("usa META_FORM_IDS si está definido y acota las horas a 720", async () => {
      vi.stubEnv("META_FORM_IDS", `${FORM_ID}, basura`);
      world.formPages = [[]];
      const res = await (await sync("?hours=5000")).json();
      expect(res).toMatchObject({ ok: true, hours: 720, forms: 1, fetched: 0 });
      expect(world.graphCalls.some((c) => c.url.pathname.endsWith("/leadgen_forms"))).toBe(false);
    });

    it("502 si Firestore falla, para que el cron lo marque", async () => {
      world.formPages = [[metaLead("601")]];
      const fetchMock = vi.mocked(globalThis.fetch);
      const real = fetchMock.getMockImplementation()!;
      fetchMock.mockImplementation(async (input, init) => {
        const href = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        if (href.includes("firestore.googleapis.com")) return new Response("boom", { status: 500 });
        return real(input, init);
      });
      const res = await sync();
      expect(res.status).toBe(502);
      expect(await res.json()).toMatchObject({ ok: false, errors: 1, created: 0 });
      expect(mocks.notify).not.toHaveBeenCalled();
    });
  });
});
