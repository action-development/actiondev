import * as THREE from "three";
import { seededRandom } from "../plaza-config";
import { merge } from "./decor-kit";
import { VEGETATION_PALETTES } from "./vegetation-palette";
import type { PlazaMode } from "../plaza-mode";
import { fixWinding, hex, smooth, tube } from "./vegetation-kit";

/**
 * Palmera canaria: estípite de UN tubo continuo y corona de frondas-cinta.
 *
 * Antes eran ocho cilindros apilados que se desplazaban sin girar (vasos en
 * escalera) y frondas de cono aplastado (estrella de agave). Ahora el tronco
 * sigue una curva suave con cicatrices de hoja continuas (muescas en el radio y
 * bandas de color por vértice) y cada fronda es una cinta con perfil en V sobre
 * un arco, con el borde dentado alternando para sugerir los foliolos.
 */

/** Tres pisos de corona: las de arriba levantadas, las de abajo caídas. */
const TIERS = [
  { count: 8, elev: 1.05, bend: 1.0, length: 1.75, width: 0.2 },
  { count: 10, elev: 0.5, bend: 1.3, length: 2.1, width: 0.23 },
  { count: 8, elev: 0.02, bend: 1.15, length: 2.05, width: 0.21 },
] as const;
const STEPS = 20;

interface FrondSpec {
  azimuth: number;
  elev: number;
  bend: number;
  length: number;
  width: number;
  /** 0 = piso alto (joven), 1 = bajo (viejo, más amarillento). */
  age: number;
  phase: number;
}

function buildFrond(origin: THREE.Vector3, f: FrondSpec, mode: PlazaMode): THREE.BufferGeometry {
  const pal = VEGETATION_PALETTES[mode];
  const base = hex(pal.frondBase);
  const tip = hex(pal.frondTip);
  const rib = hex(pal.frondRib);
  const old = hex(pal.palmCrownShaft);
  const ca = Math.cos(f.azimuth);
  const sa = Math.sin(f.azimuth);
  // Vector lateral (horizontal, perpendicular al plano vertical de la fronda).
  const side = new THREE.Vector3(-sa, 0, ca);

  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const sways: number[] = [];
  const index: number[] = [];

  let h = 0;
  let y = 0;
  let phi = f.elev;
  const ds = f.length / STEPS;
  const P = new THREE.Vector3();
  const lift = new THREE.Vector3();
  const e = new THREE.Vector3();
  const c = new THREE.Color();

  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    P.set(origin.x + ca * h, origin.y + y, origin.z + sa * h);
    // Perpendicular a la tangente dentro del plano vertical: el "arriba" de la hoja.
    lift.set(-Math.sin(phi) * ca, Math.cos(phi), -Math.sin(phi) * sa);
    // Anchura: afilada en la base, máxima hacia el 35 %, punta fina.
    const w = f.width * Math.pow(Math.sin(Math.PI * Math.pow(Math.max(t, 0.04), 0.62)), 0.8) + 0.012;
    // Dientes: izquierda y derecha alternan entre ancho y corto.
    const wl = w * (i % 2 === 0 ? 1 : 0.74);
    const wr = w * (i % 2 === 0 ? 0.74 : 1);
    const vee = 0.55;
    const row: Array<[number, number, number]> = [
      [P.x - side.x * wl + lift.x * wl * vee, P.y + lift.y * wl * vee, P.z - side.z * wl + lift.z * wl * vee],
      [P.x, P.y, P.z],
      [P.x + side.x * wr + lift.x * wr * vee, P.y + lift.y * wr * vee, P.z + side.z * wr + lift.z * wr * vee],
    ];
    for (let k = 0; k < 3; k++) {
      positions.push(...row[k]);
      // Normal provisional: el "arriba" de la hoja; el V la reparte después.
      e.copy(lift);
      if (k === 0) e.addScaledVector(side, -0.5);
      if (k === 2) e.addScaledVector(side, 0.5);
      e.normalize();
      normals.push(e.x, e.y, e.z);
      // Pintura: base oscura → punta clara; nervio central más claro; el piso
      // viejo vira al amarillo.
      c.copy(base).lerp(tip, smooth(t, 0.05, 0.85));
      c.lerp(old, 0.2 * f.age);
      if (k === 1) c.lerp(rib, 0.4);
      else c.multiplyScalar(0.94);
      colors.push(c.r, c.g, c.b);
      // Viento: la base de la fronda no se mueve, la punta sí (hasta 1,8).
      sways.push(Math.pow(t, 1.3) * 1.8);
    }
    if (i < STEPS) {
      const a = i * 3;
      const b = (i + 1) * 3;
      index.push(a, a + 1, b, a + 1, b + 1, b, a + 1, a + 2, b + 1, a + 2, b + 2, b + 1);
    }
    // Avance a lo largo del arco: el ángulo cae con la distancia (gravedad).
    h += Math.cos(phi) * ds;
    y += Math.sin(phi) * ds;
    phi -= f.bend / STEPS;
  }

  const front = new THREE.BufferGeometry();
  front.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  front.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  front.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  front.setAttribute("aSway", new THREE.Float32BufferAttribute(sways, 1));
  front.setAttribute("aPhase", new THREE.Float32BufferAttribute(new Float32Array(positions.length / 3).fill(f.phase), 1));
  front.setIndex(index);

  // Cara trasera: copia con la normal invertida (el material es FrontSide: sin
  // `DoubleSide`, que sombrearía el revés con la normal del anverso). Algo más
  // oscura: el envés de una hoja recibe menos luz.
  const back = front.clone();
  const bn = back.getAttribute("normal");
  const bc = back.getAttribute("color");
  for (let i = 0; i < bn.count; i++) {
    bn.setXYZ(i, -bn.getX(i), -bn.getY(i), -bn.getZ(i));
    bc.setXYZ(i, bc.getX(i) * 0.82, bc.getY(i) * 0.86, bc.getZ(i) * 0.8);
  }
  // Anverso: orientado a favor de su normal; el reverso se da la vuelta solo.
  return merge([fixWinding(front), fixWinding(back)], "frond");
}

export interface PalmParts {
  foliage: THREE.BufferGeometry;
  wood: THREE.BufferGeometry;
}

/** Palmera completa en el espacio local de la pieza (inclinada hacia +X). */
export function buildPalm(seed: string, mode: PlazaMode): PalmParts {
  const rnd = seededRandom(`veg:palm:${seed}`);
  const pal = VEGETATION_PALETTES[mode];
  const H = 3.25 + rnd() * 0.7;
  const lean = 0.3 + rnd() * 0.4;
  const trunkCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, -0.1, 0),
    new THREE.Vector3(lean * 0.12, H * 0.55, 0),
    new THREE.Vector3(lean, H, 0),
  );
  const stem = hex(pal.palm);
  const scar = hex(pal.palmScar);
  const shaft = hex(pal.palmCrownShaft);
  const scarSpacing = 0.17;

  const trunk = tube(
    trunkCurve,
    {
      segs: 34,
      radial: 12,
      radius: (t) => {
        const y = t * H;
        const taper = THREE.MathUtils.lerp(0.29, 0.175, Math.pow(t, 0.8));
        const flare = 0.12 * Math.exp(-y / 0.2);
        // Cicatriz de hoja: una muesca fina y repetida (continua, no un vaso
        // por tramo) y el capitel hinchado donde nacen las frondas.
        const notch = 1 - 0.05 * smooth(Math.abs(((y / scarSpacing) % 1) - 0.5), 0.34, 0.5);
        const capital = 1 + 0.2 * smooth(t, 0.9, 0.985) * (1 - smooth(t, 0.985, 1));
        return (taper + flare) * notch * capital;
      },
      paint: (t, _a, pos, out) => {
        const y = pos.y;
        const band = smooth(Math.abs(((y / scarSpacing) % 1) - 0.5), 0.3, 0.5);
        out.copy(stem).lerp(scar, 0.75 * band);
        // Capitel verdoso bajo la corona; base ensuciada por la tierra.
        out.lerp(shaft, smooth(t, 0.9, 0.99));
        out.multiplyScalar(THREE.MathUtils.lerp(0.78, 1, smooth(y, 0, 0.3)));
        return 0;
      },
    },
    0,
  );

  // Cogollo: de donde salen las frondas.
  const crownTop = new THREE.Vector3(lean, H + 0.05, 0);
  const bud = new THREE.IcosahedronGeometry(0.2, 3);
  bud.scale(1, 0.85, 1);
  bud.translate(crownTop.x, crownTop.y + 0.02, crownTop.z);
  const budPos = bud.getAttribute("position");
  const budNor = bud.getAttribute("normal");
  for (let i = 0; i < budPos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(budPos, i).sub(crownTop).normalize();
    budNor.setXYZ(i, v.x, v.y, v.z);
  }
  const budColors = new Float32Array(budPos.count * 3);
  const bc = hex(pal.frondBase);
  for (let i = 0; i < budPos.count; i++) {
    budColors[i * 3] = bc.r;
    budColors[i * 3 + 1] = bc.g;
    budColors[i * 3 + 2] = bc.b;
  }
  bud.setAttribute("color", new THREE.BufferAttribute(budColors, 3));
  bud.setAttribute("aSway", new THREE.BufferAttribute(new Float32Array(budPos.count), 1));
  bud.setAttribute("aPhase", new THREE.BufferAttribute(new Float32Array(budPos.count), 1));
  bud.deleteAttribute("uv");

  const phase = rnd() * 6.28;
  const fronds: THREE.BufferGeometry[] = [bud];
  TIERS.forEach((tier, ti) => {
    const offset = rnd() * Math.PI * 2;
    for (let i = 0; i < tier.count; i++) {
      const jitter = (rnd() - 0.5) * 0.5;
      fronds.push(
        buildFrond(
          crownTop,
          {
            azimuth: offset + ((i + jitter) / tier.count) * Math.PI * 2 + ti * 0.4,
            elev: tier.elev + (rnd() - 0.5) * 0.18,
            bend: tier.bend * (0.9 + rnd() * 0.2),
            length: tier.length * (0.9 + rnd() * 0.2),
            width: tier.width,
            age: ti / (TIERS.length - 1),
            phase: phase + rnd() * 0.5,
          },
          mode,
        ),
      );
    }
  });
  return { foliage: merge(fronds, "palmFoliage"), wood: trunk };
}
