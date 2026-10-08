import { describe, expect, it } from "vitest";
import { planStatusChange } from "./lead-transitions";

const NOW = "2026-10-08T10:00:00.000Z";

describe("planStatusChange", () => {
  it("rechaza estados desconocidos (incluido el antiguo closed)", () => {
    expect(planStatusChange({ status: "new" }, { status: "closed" }, NOW).ok).toBe(false);
  });

  it("contacted no fija qualifiedAt", () => {
    const r = planStatusChange({ status: "new" }, { status: "contacted" }, NOW);
    expect(r).toMatchObject({ ok: true, set: { status: "contacted", statusUpdatedAt: NOW } });
    if (r.ok) expect(r.set.qualifiedAt).toBeUndefined();
  });

  it("qualified fija qualifiedAt solo la primera vez", () => {
    const first = planStatusChange({ status: "contacted" }, { status: "qualified" }, NOW);
    expect(first.ok && first.set.qualifiedAt).toBe(NOW);
    const again = planStatusChange({ status: "meeting", qualifiedAt: "2026-10-01T00:00:00Z" }, { status: "proposal" }, NOW);
    expect(again.ok && again.set.qualifiedAt).toBeUndefined();
  });

  it("won exige importe > 0 y fija wonAt, value y qualifiedAt", () => {
    for (const value of [undefined, 0, -5, "abc", "", NaN]) {
      expect(planStatusChange({ status: "proposal" }, { status: "won", value }, NOW).ok).toBe(false);
    }
    const r = planStatusChange({ status: "contacted" }, { status: "won", value: "12.000,5".replace(".", "") }, NOW);
    expect(r).toMatchObject({ ok: true, set: { wonAt: NOW, value: 12000.5, qualifiedAt: NOW } });
    const comma = planStatusChange({ status: "proposal", qualifiedAt: "x" }, { status: "won", value: "1500,50" }, NOW);
    expect(comma).toMatchObject({ ok: true, set: { value: 1500.5 } });
  });

  it("lost exige motivo y no fija qualifiedAt", () => {
    expect(planStatusChange({ status: "new" }, { status: "lost", lostReason: "  " }, NOW).ok).toBe(false);
    const r = planStatusChange({ status: "new" }, { status: "lost", lostReason: " Spam " }, NOW);
    expect(r).toMatchObject({ ok: true, set: { lostReason: "Spam" } });
    if (r.ok) expect(r.set.qualifiedAt).toBeUndefined();
  });

  it("al salir de won/lost borra wonAt, value y lostReason", () => {
    const r = planStatusChange({ status: "won", qualifiedAt: "x" }, { status: "proposal" }, NOW);
    expect(r.ok && r.unset).toEqual(["wonAt", "value", "lostReason"]);
  });
});
