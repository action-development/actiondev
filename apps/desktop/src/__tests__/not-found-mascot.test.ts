import { describe, expect, it } from "vitest";
import {
  DROP_DURATION,
  DROP_IMPACT,
  GAZE,
  HOP_DURATION,
  REST,
  blinkOpen,
  dropPose,
  fourJolt,
  gazeToward,
  hopPose,
  isFlipHop,
  searchPose,
} from "@/lib/not-found-mascot";

describe("404 — mascota", () => {
  it("cae desde fuera, se estampa en el hueco y acaba quieta", () => {
    expect(dropPose(0).y).toBeLessThan(-4);
    const hit = dropPose(DROP_IMPACT + 0.05);
    expect(hit.y).toBe(0);
    expect(hit.sy).toBeLessThan(0.8);
    expect(dropPose(DROP_DURATION + 0.01)).toEqual(REST);
  });

  it("los 4 dan un respingo solo al impacto", () => {
    expect(fourJolt(DROP_IMPACT - 0.01).y).toBe(0);
    expect(fourJolt(DROP_IMPACT + 0.15).y).toBeLessThan(-30);
    expect(fourJolt(DROP_IMPACT + 0.4).y).toBe(0);
  });

  it("salta al pulsarla y la voltereta es uno de cada tres clics", () => {
    expect(hopPose(0.31, 0.65, false).y).toBeLessThan(-0.5);
    expect(hopPose(0.31, 0.65, true).rot).toBeLessThan(-90);
    expect(hopPose(HOP_DURATION, 0.65, true)).toEqual(REST);
    expect([1, 2, 3, 4, 5, 6].map(isFlipHop)).toEqual([false, false, true, false, false, true]);
  });

  it("los ojos miran al puntero sin salirse de la bola", () => {
    const far = gazeToward(10_000, 0, 100);
    expect(far.x).toBeCloseTo(GAZE.x, 3);
    const down = gazeToward(0, 10_000, 100);
    expect(down.y).toBeCloseTo(GAZE.down, 3);
    const up = gazeToward(0, -10_000, 100);
    expect(up.y).toBeCloseTo(-GAZE.up, 3);
    // Encima de la bola: casi al frente.
    expect(Math.abs(gazeToward(0, 0, 100).x)).toBe(0);
  });

  it("buscando, mira a un lado y al otro ladeando la cabeza", () => {
    expect(searchPose(0.5).x).toBeLessThan(0);
    expect(searchPose(1.8).x).toBeGreaterThan(0);
    expect(Math.sign(searchPose(0.5).tilt)).toBe(-1);
  });

  it("el parpadeo cierra y vuelve a abrir", () => {
    expect(blinkOpen(0.06)).toBeCloseTo(0, 6);
    expect(blinkOpen(0.2)).toBe(1);
  });
});
