import { describe, expect, it } from "vitest";
import { toErpPayload } from "@/lib/leads/erp-payload";

const CREATED = "2026-10-08T10:00:00.000Z";

describe("toErpPayload", () => {
  it("aplica el contrato con un lead completo", () => {
    const payload = toErpPayload(
      {
        source: "ads_landing",
        phone: "600123456",
        notes: "Quiero una app",
        name: "Ana",
        email: "ana@empresa.es",
        company: "Empresa SL",
        need: "app",
        stage: "idea",
        budget: "5k-15k",
        contactPreference: "whatsapp",
        consent: "granted",
        privacyVersion: "2026-10-01",
        attribution: { utmSource: "google", gclid: "abc", landingPath: "/hablemos/app" },
      },
      "doc123",
      CREATED,
    );
    expect(payload).toEqual({
      externalId: "doc123",
      createdAt: CREATED,
      source: "ads_landing",
      phone: "600123456",
      notes: "Quiero una app",
      name: "Ana",
      email: "ana@empresa.es",
      company: "Empresa SL",
      need: "app",
      stage: "idea",
      budget: "5k-15k",
      contactPreference: "whatsapp",
      consent: "granted",
      privacyVersion: "2026-10-01",
      attribution: { utmSource: "google", gclid: "abc", landingPath: "/hablemos/app" },
    });
  });

  it("omite claves vacías o ausentes (callback_form)", () => {
    const payload = toErpPayload(
      { source: "callback_form", phone: "600123456", notes: "", name: "  ", company: undefined, attribution: {} },
      "cb1",
      CREATED,
    );
    expect(payload).toEqual({ externalId: "cb1", createdAt: CREATED, source: "callback_form", phone: "600123456" });
    expect(Object.keys(payload)).not.toContain("attribution");
  });

  it("filtra la atribución a sus claves y descarta vacías", () => {
    const payload = toErpPayload(
      {
        source: "seo_landing",
        phone: "600123456",
        attribution: { utmSource: "bing", utmMedium: "", fbclid: "fb", junk: "x" } as never,
      },
      "s1",
      CREATED,
    );
    expect(payload.attribution).toEqual({ utmSource: "bing", fbclid: "fb" });
  });

  it("no muta ni arrastra campos desconocidos del lead", () => {
    const lead = { source: "seo_landing", phone: "600123456", offer: "x", status: "new" } as never;
    expect(Object.keys(toErpPayload(lead, "s2", CREATED)).sort()).toEqual(["createdAt", "externalId", "phone", "source"]);
  });
});
