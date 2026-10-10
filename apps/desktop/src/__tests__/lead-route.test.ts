// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `POST /api/lead`: contrato (guardar → 200 con id → aviso + ERP en `after()`),
 * defensas (honeypot, Origin, origen desconocido) e idempotencia por
 * `submissionId` (reintento del formulario tras el tiempo límite).
 */

const mocks = vi.hoisted(() => ({
  after: [] as Array<() => unknown>,
  notify: vi.fn<(...args: unknown[]) => Promise<void>>(async () => {}),
  erp: vi.fn<(...args: unknown[]) => Promise<void>>(async () => {}),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return { ...actual, after: (fn: () => unknown) => void mocks.after.push(fn) };
});
vi.mock("@/lib/leads/notify", () => ({ notifyLead: (...args: unknown[]) => mocks.notify(...args) }));
vi.mock("@/lib/leads/erp", () => ({ forwardLeadToErp: (...args: unknown[]) => mocks.erp(...args) }));

import { POST } from "@/app/api/lead/route";
import { resetRateLimit } from "@/lib/leads/rate-limit";

const valid = {
  source: "ads_landing",
  need: "app",
  stage: "idea",
  name: "Ana",
  phone: "600 123 456",
  email: "ana@empresa.es",
  budget: "5k-15k",
  contactPreference: "whatsapp",
  consent: "granted",
  website: "",
  elapsedMs: 9000,
};

const send = (body: unknown, headers: Record<string, string> = {}) =>
  POST(
    new Request("https://actiondev.es/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json", host: "actiondev.es", ...headers },
      body: JSON.stringify(body),
    }),
  );

const SUBMISSION_ID = "3f2b8c1e-9a4d-4e7f-b6c5-2d1a0e9f8b7c";

describe("POST /api/lead", () => {
  let firestoreBodies: Array<{ url: string; fields: Record<string, { stringValue?: string }> }>;
  /** IDs deterministas ya creados (simula la precondición «no existe» de Firestore). */
  let docs: Set<string>;

  beforeEach(() => {
    resetRateLimit();
    mocks.after.length = 0;
    mocks.notify.mockClear();
    mocks.erp.mockClear();
    firestoreBodies = [];
    docs = new Set();
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "demo");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "web-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        firestoreBodies.push({ url, fields: JSON.parse(String(init?.body)).fields });
        const documentId = new URL(url).searchParams.get("documentId");
        if (!documentId) return Response.json({ name: "projects/demo/databases/(default)/documents/leads/abc123" });
        if (docs.has(documentId)) {
          return Response.json({ error: { code: 409, status: "ALREADY_EXISTS" } }, { status: 409 });
        }
        docs.add(documentId);
        return Response.json({ name: `projects/demo/databases/(default)/documents/leads/${documentId}` });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sin submissionId: ID automático, responde el id y avisa + reenvía en after()", async () => {
    const res = await send(valid);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, id: "abc123" });
    expect(firestoreBodies).toHaveLength(1);
    expect(firestoreBodies[0].url).not.toContain("documentId=");
    expect(firestoreBodies[0].fields.source).toEqual({ stringValue: "ads_landing" });

    expect(mocks.notify).not.toHaveBeenCalled();
    expect(mocks.after).toHaveLength(1);
    await mocks.after[0]();
    expect(mocks.notify).toHaveBeenCalledWith(expect.objectContaining({ source: "ads_landing" }), "abc123");
    const createdAt = firestoreBodies[0].fields.createdAt.stringValue;
    expect(mocks.erp).toHaveBeenCalledWith(expect.objectContaining({ source: "ads_landing" }), "abc123", createdAt);
  });

  it("con submissionId: ID determinista web_<submissionId>, aviso y ERP una vez", async () => {
    const res = await send({ ...valid, submissionId: SUBMISSION_ID });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, id: `web_${SUBMISSION_ID}` });
    expect(firestoreBodies[0].url).toContain(`documentId=web_${SUBMISSION_ID}`);
    expect(mocks.after).toHaveLength(1);
    await mocks.after[0]();
    expect(mocks.notify).toHaveBeenCalledWith(expect.anything(), `web_${SUBMISSION_ID}`);
    expect(mocks.erp).toHaveBeenCalledWith(expect.anything(), `web_${SUBMISSION_ID}`, expect.any(String));
  });

  it("reintento con el mismo submissionId (409): misma respuesta, sin segundo aviso ni ERP", async () => {
    const first = await send({ ...valid, submissionId: SUBMISSION_ID });
    for (const fn of mocks.after.splice(0)) await fn();
    const retry = await send({ ...valid, submissionId: SUBMISSION_ID, elapsedMs: 31000 });
    expect(retry.status).toBe(200);
    expect(await retry.json()).toEqual(await first.json());
    expect(mocks.after).toHaveLength(0);
    expect(mocks.notify).toHaveBeenCalledTimes(1);
    expect(mocks.erp).toHaveBeenCalledTimes(1);
    expect(docs.size).toBe(1);

    // Otro envío (otro submissionId) sí es un lead nuevo.
    await send({ ...valid, submissionId: "a".repeat(32) });
    expect(mocks.after).toHaveLength(1);
  });

  it("un submissionId mal formado se ignora: ID automático, el lead no se pierde", async () => {
    for (const submissionId of ["../leads/x", "corto", "a".repeat(65), 123]) {
      const res = await send({ ...valid, submissionId });
      expect(await res.json()).toEqual({ ok: true, id: "abc123" });
    }
    expect(firestoreBodies.every((b) => !b.url.includes("documentId="))).toBe(true);
  });

  it("502 si Firestore falla con submissionId (no es un 409), sin avisar", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 403 })));
    expect((await send({ ...valid, submissionId: SUBMISSION_ID })).status).toBe(502);
    expect(mocks.after).toHaveLength(0);
  });

  it("bot (honeypot o demasiado rápido): ok falso sin guardar", async () => {
    expect(await (await send({ ...valid, website: "spam" })).json()).toEqual({ ok: true });
    expect(await (await send({ ...valid, elapsedMs: 500 })).json()).toEqual({ ok: true });
    expect(firestoreBodies).toHaveLength(0);
    expect(mocks.after).toHaveLength(0);
  });

  it("bot descartado: un console.warn con el rastro y sin nombre, teléfono ni email", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const res = await send({
        ...valid,
        website: "spam",
        attribution: { landingPath: "/hablemos/app", utmSource: "google", gclid: "abc123" },
      });
      expect(await res.json()).toEqual({ ok: true });
      expect(warn).toHaveBeenCalledTimes(1);
      const [message, info] = warn.mock.calls[0] as [string, Record<string, unknown>];
      expect(message).toBe("[lead] descartado como posible bot");
      expect(info).toEqual({
        source: "ads_landing",
        honeypot: true,
        elapsedMs: 9000,
        landingPath: "/hablemos/app",
        utmSource: "google",
        clickId: true,
      });
      const logged = JSON.stringify(info);
      for (const personal of [valid.name, valid.phone, valid.email]) expect(logged).not.toContain(personal);
    } finally {
      warn.mockRestore();
    }
  });

  it("rechaza el origen de Meta y los orígenes desconocidos", async () => {
    for (const source of ["meta_lead_form", "contact"]) {
      const res = await send({ ...valid, source });
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ ok: false, error: "invalid_source" });
    }
    expect(firestoreBodies).toHaveLength(0);
  });

  it("403 con un Origin de otro dominio", async () => {
    expect((await send(valid, { origin: "https://evil.example" })).status).toBe(403);
    expect((await send(valid, { origin: "https://actiondev.es" })).status).toBe(200);
  });

  it("502 si Firestore falla, sin avisar", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 403 })));
    const res = await send(valid);
    expect(res.status).toBe(502);
    expect(mocks.after).toHaveLength(0);
  });
});
