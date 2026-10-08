import { describe, expect, it } from "vitest";
import { funnelCounts, isUncontacted, normalizeLeadData, parseLeadFilters, whatsappUrl } from "./leads";

describe("leads", () => {
  it("mapea closed a won y lo desconocido a new", () => {
    expect(normalizeLeadData("1", { status: "closed", phone: "1" }).status).toBe("won");
    expect(normalizeLeadData("1", { status: "zzz" }).status).toBe("new");
    expect(normalizeLeadData("1", { status: "lost" }).status).toBe("lost");
  });
  it("whatsapp antepone 34 a 9 dígitos", () => {
    expect(whatsappUrl("600 11 22 33")).toBe("https://wa.me/34600112233");
    expect(whatsappUrl("+34 600112233")).toBe("https://wa.me/34600112233");
    expect(whatsappUrl("abc")).toBeNull();
  });
  it("sin contactar pasados 15 min", () => {
    const l = normalizeLeadData("1", { status: "new", createdAt: "2026-10-08T10:00:00Z" });
    const t = Date.parse("2026-10-08T10:00:00Z");
    expect(isUncontacted(l, t + 14 * 60_000)).toBe(false);
    expect(isUncontacted(l, t + 16 * 60_000)).toBe(true);
    expect(isUncontacted({ ...l, status: "contacted" }, t + 60 * 60_000)).toBe(false);
  });
  it("filtros e embudo", () => {
    expect(parseLeadFilters({ estado: "won", origen: "x" })).toEqual({ status: "won", source: undefined });
    expect(funnelCounts([normalizeLeadData("1", { status: "won" })]).won).toBe(1);
  });
});
