import { describe, it, expect } from "vitest";
import { clampDepth } from "@/components/canvas/plaza/drag-depth";

/** Cámara de la plaza mirando al centro desde +Z (misma pose que `PlazaScene`). */
const CAM = { x: 0, z: 11.5 };
/** Dirección de vista: hacia -Z. */
const DIR = { x: 0, z: -1 };
const RANGE = { min: 4.6, max: 17 } as const;

/** Distancia horizontal del punto a la cámara. */
const dist = (p: { x: number; z: number }) => Math.hypot(p.x - CAM.x, p.z - CAM.z);

describe("clampDepth", () => {
  it("no toca un punto que ya está dentro del rango", () => {
    const p = { x: 0, y: 0.5, z: 0 };
    clampDepth(p, DIR, CAM, RANGE);
    expect(p).toEqual({ x: 0, y: 0.5, z: 0 });
  });

  it("acota al máximo el corte rasante de cerca del horizonte", () => {
    const p = { x: 0, z: -300 };
    clampDepth(p, DIR, CAM, RANGE);
    expect(dist(p)).toBeCloseTo(RANGE.max, 5);
  });

  it("acota al mínimo sin dejar el punto detrás de la cámara", () => {
    // Corte por detrás del visitante: tiene que volver delante, no reaparecer
    // a su espalda (con un radio, `Math.hypot` no distingue los dos lados).
    const p = { x: 0, z: CAM.z + 20 };
    clampDepth(p, DIR, CAM, RANGE);
    expect(dist(p)).toBeCloseTo(RANGE.min, 5);
    expect(p.z).toBeCloseTo(CAM.z - RANGE.min, 5);
  });

  it("conserva el desvío lateral al acotar", () => {
    const p = { x: 3, z: -80 };
    clampDepth(p, DIR, CAM, RANGE);
    expect(p.x).toBe(3);
    expect(CAM.z - p.z).toBeCloseTo(RANGE.max, 5);
  });

  it("acota por la dirección de vista, no por el eje Z", () => {
    const p = { x: -60, z: -60 };
    // Cámara en diagonal: la corrección viaja por su eje, con lo que el punto
    // se recoloca también en X.
    const diag = { x: -Math.SQRT1_2, z: -Math.SQRT1_2 };
    clampDepth(p, diag, { x: 8, z: 8 }, RANGE);
    expect(p.x).toBeGreaterThan(-60);
    expect(p.z).toBeGreaterThan(-60);
  });

  it("ignora la componente vertical de la dirección (no hace falta aplanarla antes)", () => {
    const flat = { x: 0, z: -300 };
    const tilted = { x: 0, z: -300 };
    clampDepth(flat, { x: 0, z: -1 }, CAM, RANGE);
    // Misma dirección horizontal, pero picada: el resultado debe ser idéntico.
    clampDepth(tilted, { x: 0, y: -0.6, z: -1 } as { x: number; z: number }, CAM, RANGE);
    expect(tilted.z).toBeCloseTo(flat.z, 5);
  });

  it("no mueve nada si la cámara mira en vertical", () => {
    const p = { x: 1, z: 2 };
    clampDepth(p, { x: 0, z: 0 }, CAM, RANGE);
    expect(p).toEqual({ x: 1, z: 2 });
  });

  it("con el punto justo sobre la cámara lo recoloca al mínimo delante", () => {
    const p = { x: CAM.x, z: CAM.z };
    clampDepth(p, DIR, CAM, RANGE);
    expect(dist(p)).toBeCloseTo(RANGE.min, 5);
  });
});
