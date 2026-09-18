import { describe, it, expect } from "vitest";
import {
  approach,
  findGrabTarget,
  groundTopAt,
  pickContainerAt,
  stepSway,
  HOLD_FLOOR_Y,
  QUAY_TOP_Y,
  WATER_Y,
} from "@/components/canvas/port/crane-logic";
import { resolveTimeOfDay, timeOfDayForHour } from "@/components/canvas/port/time-of-day";
import { pickShipAt } from "@/components/canvas/port/ship-hull";

const box = (id: string, x: number, y: number, halfW = 1.3) => ({ id, x, y, halfW, halfH: 0.75 });

describe("findGrabTarget", () => {
  it("engancha el contenedor bajo el spreader", () => {
    const t = findGrabTarget([box("a", 0, -5.25)], 0.3, -4.5);
    expect(t?.id).toBe("a");
  });

  it("ignora contenedores desplazados más del 85% del semiancho", () => {
    expect(findGrabTarget([box("a", 0, -5.25)], 1.2, -4.5)).toBeNull();
  });

  it("con dos apilados elige el de arriba", () => {
    const t = findGrabTarget([box("bottom", 0, -5.25), box("top", 0, -3.75)], 0, -2.9);
    expect(t?.id).toBe("top");
  });

  it("no engancha uno cuyo techo ya está por encima del spreader", () => {
    expect(findGrabTarget([box("a", 0, -3)], 0, -4.5)).toBeNull();
  });
});

describe("pickContainerAt", () => {
  it("acierta el contenedor bajo el click", () => {
    expect(pickContainerAt([box("a", 0, -5.25)], 0.4, -5.1)?.id).toBe("a");
  });

  it("perdona un click justo fuera del borde", () => {
    expect(pickContainerAt([box("a", 0, -5.25)], 1.5, -5.25)?.id).toBe("a");
  });

  it("ignora un click lejos de todo", () => {
    expect(pickContainerAt([box("a", 0, -5.25)], 5, -5.25)).toBeNull();
  });

  it("con una pila gana el de arriba, que es el enganchable", () => {
    const stack = [box("bottom", 0, -5.25), box("top", 0, -3.75)];
    expect(pickContainerAt(stack, 0, -4.3)?.id).toBe("top");
  });
});

describe("groundTopAt", () => {
  it("distingue muelle, bodega y agua", () => {
    expect(groundTopAt(-10)).toBe(QUAY_TOP_Y);
    expect(groundTopAt(11)).toBe(HOLD_FLOOR_Y);
    expect(groundTopAt(5.5)).toBe(WATER_Y);
  });
});

describe("stepSway", () => {
  it("se retrasa al acelerar y vuelve al reposo", () => {
    const s = { offset: 0, velocity: 0 };
    stepSway(s, 40, 1 / 60);
    expect(s.velocity).toBeLessThan(0);
    for (let i = 0; i < 1200; i++) stepSway(s, 0, 1 / 60);
    expect(Math.abs(s.offset)).toBeLessThan(0.01);
  });
});

describe("approach", () => {
  it("no se pasa del objetivo", () => {
    expect(approach(0, 1, 5)).toBe(1);
    expect(approach(0, 10, 2)).toBe(2);
    expect(approach(0, -10, 2)).toBe(-2);
  });
});

describe("time of day", () => {
  it("asigna franjas", () => {
    expect(timeOfDayForHour(3)).toBe("noche");
    expect(timeOfDayForHour(7)).toBe("amanecer");
    expect(timeOfDayForHour(13)).toBe("dia");
    expect(timeOfDayForHour(20)).toBe("atardecer");
    expect(timeOfDayForHour(23)).toBe("noche");
  });

  it("respeta el override válido e ignora el inválido", () => {
    const noon = new Date(2026, 8, 17, 12, 0);
    expect(resolveTimeOfDay(noon, "noche")).toBe("noche");
    expect(resolveTimeOfDay(noon, "mediodia")).toBe("dia");
    expect(resolveTimeOfDay(noon, null)).toBe("dia");
  });
});

import { fovForAspect, resolveSceneMode, CAMERA_FOV, BACKDROP_ASPECT } from "@/components/canvas/port/painted-backdrops";

describe("painted backdrops", () => {
  it("keeps the base fov at or below the backdrop aspect", () => {
    expect(fovForAspect(16 / 10)).toBe(CAMERA_FOV);
    expect(fovForAspect(BACKDROP_ASPECT)).toBe(CAMERA_FOV);
  });

  it("narrows the fov on ultrawide screens so the image crop matches", () => {
    const fov = fovForAspect(21 / 9);
    const ratio = Math.tan((fov * Math.PI) / 360) / Math.tan((CAMERA_FOV * Math.PI) / 360);
    expect(ratio).toBeCloseTo(BACKDROP_ASPECT / (21 / 9), 6);
  });

  it("resolves the scene mode", () => {
    expect(resolveSceneMode("atardecer", new URLSearchParams())).toBe("painted");
    for (const tod of ["noche", "amanecer", "dia"] as const) {
      expect(resolveSceneMode(tod, new URLSearchParams())).toBe("painted");
    }
    expect(resolveSceneMode("atardecer", new URLSearchParams("plate"))).toBe("plate");
  });
});

import { beaconLevel, patternAt, BEACON_OFF, BEACON_PATTERNS, PATTERN_SECONDS } from "@/components/canvas/port/beacon-patterns";

describe("beacon patterns", () => {
  it("cycles through every pattern", () => {
    const seen = BEACON_PATTERNS.map((_, i) => patternAt(i * PATTERN_SECONDS + 0.1).pattern);
    expect(seen).toEqual([...BEACON_PATTERNS]);
    expect(patternAt(BEACON_PATTERNS.length * PATTERN_SECONDS).pattern).toBe("chase");
  });

  it("chase lights exactly one beacon at a time", () => {
    const levels = [0, 1, 2, 3, 4].map((i) => beaconLevel("chase", 0.25, i, 5));
    expect(levels.filter((l) => l === 1)).toHaveLength(1);
    expect(levels[1]).toBe(1);
  });

  it("together switches all beacons as one", () => {
    const lit = [0, 1, 2, 3, 4].map((i) => beaconLevel("together", 0.05, i, 5));
    const dark = [0, 1, 2, 3, 4].map((i) => beaconLevel("together", 0.5, i, 5));
    expect(new Set(lit)).toEqual(new Set([1]));
    expect(new Set(dark)).toEqual(new Set([BEACON_OFF]));
  });

  it("alternate splits even and odd", () => {
    expect(beaconLevel("alternate", 0.1, 0, 5)).toBe(1);
    expect(beaconLevel("alternate", 0.1, 1, 5)).toBe(BEACON_OFF);
  });

  it("bounce stays within the beacon range", () => {
    for (let t = 0; t < PATTERN_SECONDS; t += 0.05) {
      const lit = [0, 1, 2, 3, 4].filter((i) => beaconLevel("bounce", t, i, 5) === 1);
      expect(lit).toHaveLength(1);
    }
  });
});

import { beamAt, BEAM_PERIOD } from "@/components/canvas/port/lighthouse-beam";

describe("lighthouse beam", () => {
  it("sweeps from one side to the other over a turn", () => {
    expect(beamAt(0).side).toBeCloseTo(1, 5);
    expect(beamAt(BEAM_PERIOD / 2).side).toBeCloseTo(-1, 5);
    expect(beamAt(BEAM_PERIOD).side).toBeCloseTo(1, 5);
  });

  it("collapses the beam and flares the lantern when it points at the viewer", () => {
    const camera = beamAt(BEAM_PERIOD / 4);
    expect(camera.length).toBeCloseTo(0, 5);
    expect(camera.flare).toBeCloseTo(1, 5);
    const away = beamAt((BEAM_PERIOD * 3) / 4);
    expect(away.flare).toBeCloseTo(0, 5);
    expect(away.intensity).toBeLessThan(camera.intensity);
  });

  it("keeps every value in range across a full turn", () => {
    for (let t = 0; t < BEAM_PERIOD; t += 0.1) {
      const b = beamAt(t);
      for (const v of [b.length, b.intensity, b.flare]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});

import { PERCHES, isDisturbed, pickPerch, takeoffEase, FLEE_RADIUS, type Disturbance } from "@/components/canvas/port/gull-behaviour";

const calm: Disturbance = { trolleyX: 999, hookX: 999, hookY: 999, pointerX: 999, pointerY: 999, pulse: 0 };

describe("gull behaviour", () => {
  it("leaves a perch alone when nothing is near", () => {
    expect(PERCHES.every((p) => !isDisturbed(p, calm))).toBe(true);
  });

  it("flees when the spreader or the pointer gets close", () => {
    const [x, y] = PERCHES[4].pos;
    expect(isDisturbed(PERCHES[4], { ...calm, hookX: x + FLEE_RADIUS * 0.5, hookY: y })).toBe(true);
    expect(isDisturbed(PERCHES[4], { ...calm, pointerX: x, pointerY: y + FLEE_RADIUS * 0.5 })).toBe(true);
    expect(isDisturbed(PERCHES[4], { ...calm, hookX: x + FLEE_RADIUS * 3, hookY: y })).toBe(false);
  });

  it("only the birds on the boom mind the trolley", () => {
    const onBoom = PERCHES[0];
    const onStack = PERCHES[4];
    expect(isDisturbed(onBoom, { ...calm, trolleyX: onBoom.pos[0] + 1 })).toBe(true);
    expect(isDisturbed(onStack, { ...calm, trolleyX: onStack.pos[0] })).toBe(false);
  });

  it("picks the nearest free and quiet perch", () => {
    const taken = new Set([0, 1]);
    const spot = pickPerch(taken, calm, PERCHES[2].pos[0] + 0.5);
    expect(spot).toBe(2);
    expect(pickPerch(new Set(PERCHES.map((_, i) => i)), calm, 0)).toBe(-1);
  });

  it("never returns a perch that is being disturbed", () => {
    const [x, y] = PERCHES[2].pos;
    const spot = pickPerch(new Set(), { ...calm, hookX: x, hookY: y }, x);
    expect(spot).not.toBe(2);
  });

  it("eases the takeoff between 0 and 1", () => {
    expect(takeoffEase(0)).toBe(0);
    expect(takeoffEase(1)).toBe(1);
    expect(takeoffEase(0.5)).toBeGreaterThan(0.5);
  });
});

import {
  BOW_X,
  CUT_Y,
  FAR_CUT_Y,
  HALF_BEAM,
  RING_N,
  STERN_X,
  buildDeckSurface,
  buildHullSurface,
  deckYAt,
  farTopAt,
  halfBeamAt,
  keelYAt,
  nearTopAt,
  sectionPoints,
  stations,
} from "@/components/canvas/port/ship-hull";
import { HOLD_MAX_X, HOLD_MIN_X } from "@/components/canvas/port/crane-logic";

describe("casco del barco", () => {
  it("cierra la manga en la proa y la afina en la popa", () => {
    expect(halfBeamAt(BOW_X)).toBeLessThan(HALF_BEAM * 0.05);
    expect(halfBeamAt(12)).toBeCloseTo(HALF_BEAM);
    const stern = halfBeamAt(STERN_X);
    expect(stern).toBeLessThan(HALF_BEAM);
    expect(stern).toBeGreaterThan(HALF_BEAM * 0.4);
  });

  it("sube el pie de roda hacia la proa, que es lo que lanza el tajamar", () => {
    expect(keelYAt(BOW_X)).toBeGreaterThan(keelYAt(BOW_X + 1.5));
    expect(keelYAt(BOW_X + 1.5)).toBeGreaterThan(keelYAt(12));
    expect(keelYAt(12)).toBeCloseTo(-10);
  });

  it("da arrufo: la cubierta va más alta a proa y a popa que al medio", () => {
    expect(deckYAt(BOW_X)).toBeGreaterThan(deckYAt(12));
    expect(deckYAt(STERN_X)).toBeGreaterThan(deckYAt(12));
  });

  it("rebaja las dos bandas sobre la bodega, más la de cámara", () => {
    const mid = (HOLD_MIN_X + HOLD_MAX_X) / 2;
    expect(nearTopAt(mid)).toBeCloseTo(CUT_Y);
    expect(farTopAt(mid)).toBeCloseTo(FAR_CUT_Y);
    expect(nearTopAt(mid)).toBeLessThan(farTopAt(mid));
    // Fuera de la bodega las dos suben a la amurada.
    expect(nearTopAt(BOW_X)).toBeCloseTo(farTopAt(BOW_X));
  });

  it("da la astilla al costado: el canto sale más ancho que el pantoque", () => {
    const pts = sectionPoints(2, -5, -10);
    expect(pts[0][0]).toBeGreaterThan(pts[1][0]);
    expect(pts[0][1]).toBe(-5);
    expect(pts[pts.length - 1][1]).toBe(-10);
  });

  it("teje un forro cerrado con un anillo por eslora", () => {
    const { positions, uvs, indices } = buildHullSurface();
    const xs = stations();
    // Un anillo por eslora más el centro del espejo de popa.
    expect(positions.length / 3).toBe(xs.length * RING_N + 1);
    expect(uvs.length / 2).toBe(positions.length / 3);
    expect(indices.length % 3).toBe(0);
    expect(Math.max(...indices)).toBeLessThan(positions.length / 3);
  });

  it("no pone cubierta sobre la boca de la bodega", () => {
    const { positions, indices } = buildDeckSurface();
    const mid = (HOLD_MIN_X + HOLD_MAX_X) / 2;
    const used = new Set(indices);
    for (const i of used) {
      const x = positions[i * 3];
      // Ningún vértice en uso puede caer en el centro de la escotilla.
      expect(Math.abs(x - mid)).toBeGreaterThan(0.5);
    }
  });
});

import {
  PLAN,
  SWEEP_STEP,
  advanceLights,
  chooseAction,
  createLights,
  nextSeed,
  unit,
  type LightAction,
} from "@/components/canvas/port/ship-lights";

describe("luces de los camarotes", () => {
  it("la semilla nunca se queda clavada y unit cae en 0..1", () => {
    let seed = 0x5eed1234;
    for (let i = 0; i < 500; i++) {
      seed = nextSeed(seed);
      expect(seed).not.toBe(0);
      const u = unit(seed);
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThan(1);
    }
  });

  it("reparte todas las acciones del plan y ninguna fuera de él", () => {
    const seen = new Set<LightAction>();
    for (let i = 0; i < 2000; i++) seen.add(chooseAction(i / 2000));
    for (const p of PLAN) expect(seen.has(p.action)).toBe(true);
    expect(seen.size).toBe(PLAN.length);
    expect(chooseAction(0)).toBe(PLAN[0].action);
    expect(chooseAction(0.999999)).toBe(PLAN[PLAN.length - 1].action);
  });

  it("antes o después enciende todas y apaga todas", () => {
    const s = createLights(8);
    let allOn = false;
    let allOff = false;
    for (let t = 0; t < 600 && !(allOn && allOff); t += 0.1) {
      advanceLights(s, t);
      if (s.action === "all-on") allOn = allOn || s.target.every((v) => v === 1);
      if (s.action === "all-off") allOff = allOff || s.target.every((v) => v === 0);
    }
    expect(allOn).toBe(true);
    expect(allOff).toBe(true);
  });

  it("la secuencia va encendiendo de una en una", () => {
    const s = createLights(6);
    s.target.fill(0);
    s.action = "sweep-on";
    s.cursor = 0;
    s.nextTick = 10;
    s.until = Infinity;
    advanceLights(s, 10);
    expect(s.target.filter((v) => v === 1).length).toBe(1);
    advanceLights(s, 10 + SWEEP_STEP * 2.5);
    expect(s.target.filter((v) => v === 1).length).toBe(3);
    advanceLights(s, 10 + SWEEP_STEP * 99);
    expect(s.target.every((v) => v === 1)).toBe(true);
  });

  it("mantiene los objetivos en 0/1 y no cambia el número de ventanas", () => {
    const s = createLights(10);
    for (let t = 0; t < 600; t += 0.13) {
      advanceLights(s, t);
      expect(s.target.length).toBe(10);
      for (const v of s.target) expect(v === 0 || v === 1).toBe(true);
    }
  });

  it("no se queda quieto: a lo largo del tiempo las ventanas cambian", () => {
    const s = createLights(10);
    const seenPatterns = new Set<string>();
    for (let t = 0; t < 300; t += 0.2) {
      advanceLights(s, t);
      seenPatterns.add(s.target.join(""));
    }
    expect(seenPatterns.size).toBeGreaterThan(8);
  });
});

describe("las luces del barco nunca lo dejan a oscuras", () => {
  it("al quedarse todo apagado en 'hold' enciende un par", () => {
    const s = createLights(8);
    s.target.fill(0);
    s.action = "hold";
    s.until = Infinity;
    advanceLights(s, 1);
    expect(s.target.some((v) => v === 1)).toBe(true);
  });

  it("nunca se queda apagado del todo más de un tramo corto", () => {
    const s = createLights(10);
    let darkFrom: number | null = null;
    let worst = 0;
    for (let t = 0; t < 900; t += 0.1) {
      advanceLights(s, t);
      const dark = s.target.every((v) => v === 0);
      if (dark && darkFrom === null) darkFrom = t;
      if (!dark && darkFrom !== null) {
        worst = Math.max(worst, t - darkFrom);
        darkFrom = null;
      }
    }
    // MAX_DARK = 3 s, más el paso de muestreo de este bucle.
    // ("all-off" seguido de "sweep-off" llegaba a 6 s antes del tope.) con un hold.
    expect(worst).toBeLessThan(4);
  });
});

// --- Easter egg: caza de gaviotas ---
import {
  AIM_SLACK,
  FADE_END,
  FADE_START,
  bulletSpeed,
  fadeAt,
  fallOffset,
  pickGullTarget,
  type GullTarget,
} from "@/components/canvas/port/gull-hunt-logic";

const gull = (id: number, x: number, y: number, z: number, alive = true): GullTarget => ({
  id, x, y, z, radius: 0.8, alive, shoot: () => {},
});

describe("pickGullTarget", () => {
  // Rayo desde el origen mirando a -z.
  const pick = (targets: GullTarget[]) => pickGullTarget(0, 0, 0, 0, 0, -1, targets);

  it("acierta a la gaviota que cruza el rayo", () => {
    expect(pick([gull(1, 0.3, -0.2, -20)])?.id).toBe(1);
  });

  it("falla si queda fuera del radio y de la tolerancia angular", () => {
    expect(pick([gull(1, 3, 0, -20)])).toBeNull();
  });

  it("las lejanas se aciertan con tolerancia angular, no con el radio real", () => {
    const far = gull(1, 60 * AIM_SLACK * 0.9, 0, -60);
    expect(pick([far])?.id).toBe(1);
  });

  it("ignora las muertas y lo que queda detrás de la cámara", () => {
    expect(pick([gull(1, 0, 0, -20, false)])).toBeNull();
    expect(pick([gull(2, 0, 0, 20)])).toBeNull();
  });

  it("con dos alineadas elige la más cercana", () => {
    expect(pick([gull(1, 0, 0, -40), gull(2, 0, 0, -12)])?.id).toBe(2);
  });
});

describe("caída y fundido de la gaviota abatida", () => {
  it("sube un pelín y luego cae", () => {
    expect(fallOffset(0.1)).toBeGreaterThan(0);
    expect(fallOffset(1)).toBeLessThan(0);
  });

  it("opaca hasta FADE_START, invisible en FADE_END", () => {
    expect(fadeAt(0)).toBe(1);
    expect(fadeAt(FADE_START)).toBe(1);
    expect(fadeAt((FADE_START + FADE_END) / 2)).toBeLessThan(1);
    expect(fadeAt(FADE_END)).toBe(0);
  });

  it("la bala nunca va lenta y escala con la distancia", () => {
    expect(bulletSpeed(10)).toBe(80);
    expect(bulletSpeed(90)).toBe(300);
  });
});

describe("pickShipAt", () => {
  it("acierta en el casco y en el puente", () => {
    expect(pickShipAt(12, -7)).toBe(true);
    expect(pickShipAt(18, -2)).toBe(true);
  });

  it("falla fuera del barco: muelle, aire sobre la bodega y agua abierta", () => {
    expect(pickShipAt(2, -7)).toBe(false);
    expect(pickShipAt(12, -2)).toBe(false);
    expect(pickShipAt(25, -7)).toBe(false);
    expect(pickShipAt(12, -11)).toBe(false);
  });
});
