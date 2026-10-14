import { describe, expect, it } from "vitest";
import {
  ARRIVAL,
  EXIT_DURATION,
  FINAL_HOLD,
  EXIT_DELAY,
  GATE_PROGRESS,
  arrivalPose,
  bodyPath,
  buildPlan,
  displayPercent,
  exitAt,
  finalProgress,
  mascotPose,
  power2InOut,
  progressAt,
  sineIn,
} from "@/lib/push-intro";

/**
 * El empuje es UNO SOLO y continuo (decisión del cliente: los tres empujones
 * con pausas del original de huyml.co iban «a golpes»).
 */
describe("intro «empuje» — línea de tiempo", () => {
  const plan = buildPlan("pc", 1.28);

  it("un solo tramo de 2,7 s; luego vuelta al logo, aviso y fundido", () => {
    expect(plan.segments).toHaveLength(1);
    expect(plan.pushEnd).toBeCloseTo(2.7, 6);
    expect(plan.reveal).toBeCloseTo(2.7 + ARRIVAL + FINAL_HOLD, 6);
    expect(plan.exitStart).toBeCloseTo(plan.reveal + EXIT_DELAY, 6);
    expect(plan.end).toBeCloseTo(plan.exitStart + EXIT_DURATION, 6);
  });

  it("la pared no se para nunca entre el arranque y el final", () => {
    let prev = progressAt(plan, 0);
    for (let t = 0.05; t <= plan.pushEnd; t += 0.05) {
      const p = progressAt(plan, t);
      expect(p).toBeGreaterThan(prev);
      prev = p;
    }
    expect(progressAt(plan, plan.pushEnd)).toBe(1.28);
    expect(progressAt(plan, 10)).toBe(1.28);
  });

  it("la puerta de carga cae justo donde la pared pasa por el 60 %", () => {
    expect(progressAt(plan, plan.gate)).toBeCloseTo(GATE_PROGRESS, 6);
  });

  it("curvas: sine.in arranca parada; power2 es cúbica", () => {
    expect(sineIn(0)).toBe(0);
    expect(sineIn(1)).toBeCloseTo(1, 6);
    expect(sineIn(0.01)).toBeLessThan(0.001);
    expect(power2InOut(0.25)).toBeCloseTo(0.0625, 6);
    expect(power2InOut(0.5)).toBeCloseTo(0.5, 6);
  });

  it("móvil: empuje más largo y la pared llega más lejos", () => {
    const m = buildPlan("mobile", 1.4);
    expect(m.pushEnd).toBeCloseTo(3.2, 6);
    expect(m.wallMax).toBe(1.4);
  });

  it("el fundido va de 0 a 1", () => {
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

  it("porcentaje por tramos: 30 % y 60 %", () => {
    expect(displayPercent(0.3, 1.28)).toBeCloseTo(30, 6);
    expect(displayPercent(0.6, 1.28)).toBeCloseTo(60, 6);
    expect(displayPercent(1.28, 1.28)).toBeCloseTo(100, 6);
  });
});

describe("intro «empuje» — mascota", () => {
  it("siempre pegada a la pared, aplastada y con los ojos en rendija", () => {
    for (let p = 0; p <= 1.28; p += 0.01) {
      const pose = mascotPose(p);
      expect(pose.x).toBe(0);
      expect(pose.y).toBe(0);
      expect(pose.flat).toBeGreaterThanOrEqual(0.2);
      expect(pose.eyeOpen).toBeLessThan(0.2);
      expect(pose.shake).toBe(0);
    }
  });

  it("los empellones son suaves: la pose no salta entre fotogramas", () => {
    for (let p = 0; p < 1.28; p += 0.002) {
      const a = mascotPose(p);
      const b = mascotPose(p + 0.002);
      expect(Math.abs(a.sx - b.sx)).toBeLessThan(0.01);
      expect(Math.abs(a.flat - b.flat)).toBeLessThan(0.01);
    }
  });

  it("al final la pared cede: salen las líneas de velocidad", () => {
    expect(mascotPose(0.5).speed).toBe(0);
    expect(mascotPose(1.1).speed).toBe(1);
  });

  it("esperando en el 60 % sigue apretando, tiembla y suda", () => {
    const drops = new Set<number>();
    const squash = new Set<number>();
    for (let s = 0.4; s < 3; s += 0.1) {
      const pose = mascotPose(0.6, s);
      drops.add(Math.round(pose.drop.y * 100));
      squash.add(Math.round(pose.flat * 1000));
    }
    expect(drops.size).toBeGreaterThan(5);
    expect(squash.size).toBeGreaterThan(5);
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
