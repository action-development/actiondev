import { beforeEach, describe, expect, it } from "vitest";

const store = new Map<string, string>();
Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  },
});
import { CONSENT_STORAGE_KEY, toE164, trackLead } from "@actiondev/shared";
import { buildLeadFields } from "@/lib/leads/firestore";
import { leadEmailText, leadSubject } from "@/lib/leads/message";
import { parseLeadRequest } from "@/lib/leads/parse";

const full = {
  source: "ads_landing",
  need: "app",
  stage: "idea",
  name: "Ana",
  phone: "600 123 456",
  email: "ana@empresa.es",
  budget: "5k-15k",
  contactPreference: "whatsapp",
  attribution: { utmSource: "google", gclid: "abc", landingPath: "/hablemos/app", junk: "x" },
  consent: "granted",
  website: "",
  elapsedMs: 9000,
};

describe("parseLeadRequest", () => {
  it("acepta un lead completo y descarta claves desconocidas", () => {
    const r = parseLeadRequest({ ...full, extra: 1 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.lead.attribution).toEqual({ utmSource: "google", gclid: "abc", landingPath: "/hablemos/app" });
    expect("extra" in r.value.lead).toBe(false);
  });
  it("rechaza uniones, longitudes y teléfono inválidos", () => {
    expect(parseLeadRequest({ ...full, need: "x" }).ok).toBe(false);
    expect(parseLeadRequest({ ...full, phone: "12345" }).ok).toBe(false);
    expect(parseLeadRequest({ ...full, name: "a".repeat(121) }).ok).toBe(false);
    expect(parseLeadRequest({ ...full, notes: "a".repeat(501) }).ok).toBe(false);
    expect(parseLeadRequest({ ...full, attribution: { gclid: "a".repeat(301) } }).ok).toBe(false);
    expect(parseLeadRequest({ ...full, email: "no-es-email" }).ok).toBe(false);
  });
  it("el «llámame tú» solo exige teléfono", () => {
    expect(parseLeadRequest({ source: "callback_form", phone: "600123456" }).ok).toBe(true);
  });
  it("contact_page (formulario de /contact en móvil) es el cualificador completo", () => {
    const r = parseLeadRequest({ ...full, source: "contact_page", offer: "contact" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.lead).toMatchObject({ source: "contact_page", need: "app", stage: "idea", name: "Ana", offer: "contact" });
    // Sin los campos del cualificador no vale como «llámame tú».
    expect(parseLeadRequest({ source: "contact_page", phone: "600123456" }).ok).toBe(false);
    expect(parseLeadRequest({ ...full, source: "contact_page", stage: undefined }).ok).toBe(false);
  });
  it("rechaza un origen desconocido", () => {
    expect(parseLeadRequest({ ...full, source: "contact" }).ok).toBe(false);
  });
});

describe("buildLeadFields", () => {
  it("solo escribe claves de Lead, sin vacías, con attribution como mapValue", () => {
    const r = parseLeadRequest(full);
    if (!r.ok) throw new Error("parse");
    const f = buildLeadFields(r.value.lead, "2026-10-08T00:00:00.000Z");
    expect(Object.keys(f).sort()).toEqual(
      ["attribution", "budget", "consent", "contactPreference", "createdAt", "email", "name", "need", "notes", "phone", "privacyVersion", "source", "stage", "status"].sort(),
    );
    expect(f.status).toEqual({ stringValue: "new" });
    expect(f.notes).toEqual({ stringValue: "" });
    expect("company" in f).toBe(false);
    expect("mapValue" in f.attribution).toBe(true);
  });
});

describe("aviso", () => {
  it("redacta asunto y cuerpo con enlaces", () => {
    const r = parseLeadRequest({ ...full, company: "ACME" });
    if (!r.ok) throw new Error("parse");
    expect(leadSubject(r.value.lead)).toBe("Nuevo lead · App móvil · 5.000 – 15.000 € · Ana");
    const text = leadEmailText(r.value.lead, "abc");
    expect(text).toContain("tel:+34600123456");
    expect(text).toContain("https://wa.me/34600123456");
    expect(text).toContain("mailto:ana@empresa.es");
    expect(text).toContain("https://actiondev.es/admin/leads");
  });
  it("nombra el formulario de contacto como origen", () => {
    const r = parseLeadRequest({ ...full, source: "contact_page" });
    if (!r.ok) throw new Error("parse");
    expect(leadEmailText(r.value.lead, "abc")).toContain("Nuevo lead (Formulario de contacto)");
    expect(buildLeadFields(r.value.lead, "2026-10-08T00:00:00.000Z").source).toEqual({ stringValue: "contact_page" });
  });
});

describe("toE164 y trackLead", () => {
  beforeEach(() => {
    window.localStorage.clear();
    (window as unknown as { dataLayer?: unknown[] }).dataLayer = [];
  });
  it("normaliza teléfonos", () => {
    expect(toE164("600 123 456")).toBe("+34600123456");
    expect(toE164("+44 20 7946 0958")).toBe("+442079460958");
    expect(toE164("0034 600123456")).toBe("+34600123456");
    expect(toE164("123")).toBeUndefined();
  });
  it("solo empuja con consentimiento granted", () => {
    const dl = () => (window as unknown as { dataLayer: unknown[] }).dataLayer;
    trackLead({ lead_id: "1" }, { email: "A@b.es", phone_number: "600123456" });
    expect(dl()).toHaveLength(0);
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
    trackLead({ lead_id: "1" }, { email: "A@b.es", phone_number: "600123456" });
    expect(dl()[0]).toMatchObject({
      event: "generate_lead",
      lead_id: "1",
      user_data: { email: "a@b.es", phone_number: "+34600123456" },
    });
  });
});
