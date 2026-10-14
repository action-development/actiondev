import { describe, expect, it } from "vitest";
import {
  ARRIVAL,
  EXIT_DURATION,
  arrivalPose,
  bodyPath,
  buildPlan,
  displayPercent,
  exitAt,
  finalProgress,
  HOP_HEIGHT,
  mascotPose,
  power2InOut,
  power3In,
  progressAt,
  wallAt,
} from "@/lib/push-intro";

/**
 * Los números de la intro son los del original (docs/intro-empuje/ANALISIS.md,
 * medidos al fotograma en la grabación). Estos tests fijan esa línea de tiempo.
 */
describe("intro «empuje» — línea de tiempo", () => {
  const plan = buildPlan("pc", 1.28);

  it("tramos y pausas del original; la vuelta al logo retrasa el aviso y la bajada", () => {
    expect(plan.segments.map((s) => [s.start, s.end])).toEqual([
      [0, 0.65],
      [expect.closeTo(0.81, 6), expect.closeTo(1.53, 6)],
      [expect.closeTo(1.73, 6), expect.closeTo(3.19, 6)],
    ]);
    expect(plan.gate).toBeCloseTo(1.73, 6);
    expect(plan.pushEnd).toBeCloseTo(3.19, 6);
    expect(plan.reveal).toBeCloseTo(3.69 + ARRIVAL, 6);
    expect(plan.exitStart).toBeCloseTo(4.29 + ARRIVAL, 6);
    expect(plan.end).toBeCloseTo(4.29 + ARRIVAL + EXIT_DURATION, 6);
  });

  it("se queda quieto en las pausas y llega a cada parada", () => {
    expect(progressAt(plan, 0.65)).toBe(0.3);
    expect(progressAt(plan, 0.75)).toBe(0.3);
    expect(progressAt(plan, 1.6)).toBe(0.6);
    expect(progressAt(plan, 3.19)).toBe(1.28);
    expect(progressAt(plan, 10)).toBe(1.28);
  });

  it("el último tramo es la cuártica: la pared sale de pantalla a los 3,009 s", () => {
    // p = 0,6 + 0,68·u⁴ = 1  →  u = (0,4/0,68)^¼
    const u = (0.4 / 0.68) ** 0.25;
    expect(progressAt(plan, 1.73 + 1.46 * u)).toBeCloseTo(1, 6);
    expect(1.73 + 1.46 * u).toBeCloseTo(3.009, 3);
  });

  it("curvas de GSAP: power2 es cúbica y power3 cuártica", () => {
    expect(power2InOut(0.25)).toBeCloseTo(0.0625, 6);
    expect(power2InOut(0.5)).toBeCloseTo(0.5, 6);
    expect(power2InOut(0.75)).toBeCloseTo(0.9375, 6);
    expect(power3In(0.5)).toBeCloseTo(0.0625, 6);
  });

  it("móvil: primer y último tramo 0,3 s más largos", () => {
    const m = buildPlan("mobile", 1.4);
    expect(m.segments[0].end).toBeCloseTo(0.95, 6);
    expect(m.segments[2].end - m.segments[2].start).toBeCloseTo(1.76, 6);
    expect(m.wallMax).toBe(1.4);
  });

  it("el fundido de salida va de 0 a 1", () => {
    expect(exitAt(plan, plan.exitStart)).toBe(0);
    expect(exitAt(plan, plan.exitStart + EXIT_DURATION / 2)).toBeCloseTo(0.5, 6);
    expect(exitAt(plan, plan.end + 1)).toBe(1);
  });

  it("el progreso final da para que la mascota salga del todo", () => {
    expect(finalProgress("pc", 202, 1447)).toBe(1.28);
    const narrow = finalProgress("mobile", 200, 390);
    expect(narrow).toBeGreaterThan(1.4);
    expect(narrow * 390 - 1.12 * 200).toBeGreaterThan(390);
  });

  it("porcentaje por tramos: 30 % y 60 % en las pausas", () => {
    expect(displayPercent(0.3, 1.28)).toBeCloseTo(30, 6);
    expect(displayPercent(0.6, 1.28)).toBeCloseTo(60, 6);
    expect(displayPercent(1.28, 1.28)).toBeCloseTo(100, 6);
  });
});

describe("intro «empuje» — mascota", () => {
  it("la pared avanza a golpes y para donde el original (0,3 · 0,6)", () => {
    expect(wallAt(0.3)).toBeCloseTo(0.3, 6);
    expect(wallAt(0.6)).toBeCloseTo(0.6, 6);
    // A mitad de ciclo la mascota está rebotando: la pared no se mueve.
    expect(wallAt(0.45)).toBeCloseTo(0.3, 6);
    // Al final, fuera de pantalla con la mascota detrás.
    expect(wallAt(1.28)).toBeCloseTo(1.2, 6);
  });

  it("las dos pausas la congelan estampada (aplastada, ojos en rendija)", () => {
    for (const p of [0.3, 0.6]) {
      const pose = mascotPose(p);
      expect(pose.flat).toBeGreaterThan(0.2);
      expect(pose.eyeOpen).toBeLessThan(0.2);
      expect(pose.y).toBe(0);
      expect(pose.x).toBeCloseTo(0, 6);
    }
  });

  it("rebota hacia atrás en parábola y en saltos alternos hace mortal", () => {
    // Ápice del rebote del ciclo 1 (fase 0,31).
    const apex = mascotPose(0.3 + 0.31 / (10 / 3));
    expect(apex.y).toBeCloseTo(HOP_HEIGHT, 6);
    expect(apex.x).toBeLessThan(-1);
    expect(Math.abs(apex.rot)).toBeGreaterThan(90);
    const noFlip = mascotPose(0.6 + 0.31 / (10 / 3));
    expect(Math.abs(noFlip.rot)).toBeLessThanOrEqual(30);
  });

  it("la pose es continua: sin saltos en el cambio de ciclo", () => {
    const a = mascotPose(0.6 - 1e-6);
    const b = mascotPose(0.6 + 1e-6);
    expect(Math.abs(a.sx - b.sx)).toBeLessThan(1e-3);
    expect(Math.abs(a.drop.x - b.drop.x)).toBeLessThan(1e-3);
  });

  it("esperando en el 60 % tiembla y sigue sudando", () => {
    const drops = new Set<number>();
    for (let s = 0.4; s < 3; s += 0.1) drops.add(Math.round(mascotPose(0.6, s).drop.y * 100));
    expect(drops.size).toBeGreaterThan(5);
  });

  it("el cuerpo aplastado es un círculo con el lado de la pared cortado", () => {
    expect(bodyPath(0)).toMatch(/^M 0\.9850 0 A/);
    expect(bodyPath(0.14)).toBe("M 0.8450 -0.5062 A 0.9850 0.9850 0 1 0 0.8450 0.5062 Z");
  });
});

describe("intro «empuje» — vuelta al punto del logo", () => {
  const geo = { from: { x: 6, y: 0 }, to: { x: 2, y: -0.8 }, scale: 0.2, lift: 3 };

  it("sale de fuera a tamaño completo y aterriza en el punto a su tamaño", () => {
    const start = arrivalPose(0, geo);
    expect(start).toMatchObject({ x: 6, y: 0, scale: 1, wink: 0 });
    const landed = arrivalPose(ARRIVAL, geo);
    expect(landed.x).toBeCloseTo(2, 6);
    expect(landed.y).toBeCloseTo(-0.8, 6);
    expect(landed.scale).toBeCloseTo(0.2, 6);
    expect(landed.sy).toBeLessThan(1);
  });

  it("vuela en parábola dando la vuelta entera", () => {
    const mid = arrivalPose(ARRIVAL / 2, geo);
    expect(mid.y).toBeGreaterThan(2);
    expect(arrivalPose(ARRIVAL * 0.95, geo).rot).toBeCloseTo(-360, 0);
  });

  it("ya en el punto guiña el ojo y se ríe con dos saltitos", () => {
    const winking = arrivalPose(ARRIVAL + 0.4, geo);
    expect(winking.wink).toBe(1);
    expect(winking.y).toBeGreaterThan(-0.8);
    expect(arrivalPose(ARRIVAL + 0.75, geo).y).toBeCloseTo(-0.8, 6);
    expect(arrivalPose(ARRIVAL + 1.2, geo).wink).toBe(0);
  });
});
