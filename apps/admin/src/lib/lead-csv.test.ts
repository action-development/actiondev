import { describe, expect, it } from "vitest";
import type { Lead } from "@actiondev/shared";
import {
  buildLeadsCsv,
  buildOfflineConversionsCsv,
  csvCell,
  formatMadridTime,
  googleConsent,
} from "./lead-csv";

const NOW = new Date("2026-10-08T10:00:00Z");

function lead(over: Partial<Lead>): Lead {
  return { id: "a", phone: "600000000", notes: "", status: "new", createdAt: "2026-10-01T09:00:00Z", ...over };
}

describe("csvCell", () => {
  it("escapa comas, comillas y saltos de línea", () => {
    expect(csvCell('a,"b"\nc')).toBe('"a,""b""\nc"');
    expect(csvCell("simple")).toBe("simple");
    expect(csvCell(undefined)).toBe("");
    expect(csvCell(1500.5)).toBe("1500.5");
  });
});

describe("formatMadridTime", () => {
  it("usa CEST en verano y CET en invierno", () => {
    expect(formatMadridTime("2026-07-01T10:00:00Z")).toBe("2026-07-01 12:00:00");
    expect(formatMadridTime("2026-01-15T10:00:00Z")).toBe("2026-01-15 11:00:00");
    expect(formatMadridTime("2026-07-01T22:30:00Z")).toBe("2026-07-02 00:30:00");
  });
});

describe("googleConsent", () => {
  it("mapea granted/denied y deja vacío lo desconocido", () => {
    expect(googleConsent("granted")).toBe("Granted");
    expect(googleConsent("denied")).toBe("Denied");
    expect(googleConsent("unknown")).toBe("");
    expect(googleConsent(undefined)).toBe("");
  });
});

describe("buildOfflineConversionsCsv", () => {
  it("rellena Ad User Data y Ad Personalization con el consentimiento guardado", () => {
    const csv = buildOfflineConversionsCsv(
      [
        lead({ attribution: { gclid: "G1" }, consent: "granted", qualifiedAt: "2026-10-02T09:00:00Z" }),
        lead({ attribution: { gclid: "G2" }, consent: "denied", qualifiedAt: "2026-10-02T09:00:00Z" }),
        lead({ attribution: { gclid: "G3" }, qualifiedAt: "2026-10-02T09:00:00Z" }),
      ],
      { now: NOW },
    );
    expect(csv).toContain("G1,Lead cualificado,2026-10-02 11:00:00,,,Granted,Granted\r\n");
    expect(csv).toContain("G2,Lead cualificado,2026-10-02 11:00:00,,,Denied,Denied\r\n");
    expect(csv).toContain("G3,Lead cualificado,2026-10-02 11:00:00,,,,\r\n");
  });

  const header = "Parameters:TimeZone=Europe/Madrid\r\nGoogle Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency,Ad User Data,Ad Personalization\r\n";

  it("solo cabecera si no hay gclid", () => {
    expect(buildOfflineConversionsCsv([lead({ qualifiedAt: "2026-10-02T09:00:00Z" })], { now: NOW })).toBe(header);
  });

  it("genera fila cualificada y fila ganada con valor", () => {
    const csv = buildOfflineConversionsCsv(
      [
        lead({
          status: "won",
          attribution: { gclid: "G1" },
          qualifiedAt: "2026-10-02T09:00:00Z",
          wonAt: "2026-10-05T14:30:00Z",
          value: 12000,
        }),
      ],
      { now: NOW },
    );
    expect(csv).toBe(
      header +
        "G1,Lead cualificado,2026-10-02 11:00:00,,,,\r\n" +
        "G1,Cliente ganado,2026-10-05 16:30:00,12000,EUR,,\r\n",
    );
  });

  it("no exporta ganado si el lead ya no está en won o falta el valor", () => {
    const csv = buildOfflineConversionsCsv(
      [
        lead({ id: "1", status: "lost", attribution: { gclid: "G1" }, wonAt: "2026-10-05T14:30:00Z", value: 100 }),
        lead({ id: "2", status: "won", attribution: { gclid: "G2" }, wonAt: "2026-10-05T14:30:00Z" }),
      ],
      { now: NOW },
    );
    expect(csv).toBe(header);
  });

  it("filtra por 90 días y por ?desde", () => {
    const old = lead({ id: "o", createdAt: "2026-05-01T00:00:00Z", attribution: { gclid: "OLD" }, qualifiedAt: "2026-05-02T00:00:00Z" });
    const recent = lead({ id: "r", createdAt: "2026-10-01T00:00:00Z", attribution: { gclid: "NEW" }, qualifiedAt: "2026-10-02T00:00:00Z" });
    const mid = lead({ id: "m", createdAt: "2026-08-01T00:00:00Z", attribution: { gclid: "MID" }, qualifiedAt: "2026-08-02T00:00:00Z" });
    const all = buildOfflineConversionsCsv([old, mid, recent], { now: NOW });
    expect(all).toContain("NEW");
    expect(all).toContain("MID");
    expect(all).not.toContain("OLD");
    const since = buildOfflineConversionsCsv([old, mid, recent], { now: NOW, desde: "2026-09-01" });
    expect(since).toContain("NEW");
    expect(since).not.toContain("MID");
    // `desde` anterior al tope de 90 días no lo amplía
    expect(buildOfflineConversionsCsv([old], { now: NOW, desde: "2026-01-01" })).not.toContain("OLD");
  });
});

describe("buildLeadsCsv", () => {
  it("lleva BOM, cabecera y neutraliza fórmulas", () => {
    const csv = buildLeadsCsv([lead({ name: "=HYPERLINK(1)", notes: 'hola, "mundo"', source: "ads_landing", status: "won", value: 10 })]);
    expect(csv.startsWith("﻿id,createdAt,status")).toBe(true);
    expect(csv).toContain("'=HYPERLINK(1)");
    expect(csv).toContain('"hola, ""mundo"""');
    expect(csv).toContain("Ganado");
    expect(csv).toContain("Landing de campaña");
  });
});
