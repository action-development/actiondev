// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `POST /api/lead` tras extraer `dispatchLead` para compartirlo con los leads de
 * Meta: mismo contrato (guardar → 200 con id → aviso + ERP en `after()`),
 * mismas defensas (honeypot, Origin, origen desconocido).
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

describe("POST /api/lead", () => {
  let firestoreBodies: Array<{ url: string; fields: Record<string, { stringValue?: string }> }>;

  beforeEach(() => {
    resetRateLimit();
    mocks.after.length = 0;
    mocks.notify.mockClear();
    mocks.erp.mockClear();
    firestoreBodies = [];
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "demo");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "web-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        firestoreBodies.push({ url, fields: JSON.parse(String(init?.body)).fields });
        return Response.json({ name: "projects/demo/databases/(default)/documents/leads/abc123" });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("guarda con ID automático, responde el id y avisa + reenvía en after()", async () => {
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

  it("bot (honeypot o demasiado rápido): ok falso sin guardar", async () => {
    expect(await (await send({ ...valid, website: "spam" })).json()).toEqual({ ok: true });
    expect(await (await send({ ...valid, elapsedMs: 500 })).json()).toEqual({ ok: true });
    expect(firestoreBodies).toHaveLength(0);
    expect(mocks.after).toHaveLength(0);
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
