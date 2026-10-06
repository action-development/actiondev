import * as THREE from "three";
import { merge } from "./decor-kit";
import {
  BASIN,
  GADROONS,
  GADROON_AMP,
  LOWER_BOWL,
  UPPER_BOWL,
  type BowlSpec,
} from "./fountain-config";
import { arcPoints, latheProfile, pt, type ProfilePoint } from "./fountain-lathe";

/**
 * Piedra de la fuente: cuatro sólidos de revolución con perfil real (pilón,
 * pedestal + taza baja, pie + taza alta, caño central), todos con los mismos 96
 * segmentos y aristas vivas entre molduras.
 *
 * Color por vértice en vez de textura: oclusión ambiental inventada (suelo,
 * bajos de la albardilla, hueco de las tazas), piedra MOJADA por debajo de la
 * línea de agua, sillares del murete con su junta y un leve degradado en
 * altura. Es el mismo truco que las sombras de contacto del resto de la plaza:
 * en un diorama mate la forma se lee por el valor, no por el detalle.
 */

type Shade = (pos: THREE.Vector3, n: THREE.Vector3) => [number, number, number];

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const hash = (n: number) => {
  const s = Math.sin(n * 91.3458 + 17.17) * 43758.5453;
  return s - Math.floor(s);
};

/** Tinte de la piedra mojada: más oscura y algo azulada. */
const WET: [number, number, number] = [0.58, 0.66, 0.7];

/** Sillares del murete: 16 sectores con su tono y una junta fina entre ellos. */
const SECTORS = 16;
function ashlar(pos: THREE.Vector3): number {
  const phi = (Math.atan2(pos.x, pos.z) + Math.PI * 2) % (Math.PI * 2);
  const f = (phi / (Math.PI * 2)) * SECTORS;
  const sector = Math.floor(f);
  const edge = Math.min(f - sector, sector + 1 - f);
  const tone = 0.93 + 0.09 * hash(sector + 3.1);
  return tone * (1 - 0.16 * (1 - smooth(0, 0.07, edge)));
}

function pilonShade(): Shade {
  return (pos, n) => {
    const r = Math.hypot(pos.x, pos.z);
    const radial = (n.x * pos.x + n.z * pos.z) / Math.max(r, 1e-4);
    let v = 1;
    // Cara exterior: sillares + oscurecimiento al llegar al suelo.
    if (radial > 0.3 && pos.y < BASIN.copingY0 + 0.01) {
      v *= ashlar(pos);
      v *= 0.68 + 0.32 * smooth(0, 0.22, pos.y);
    }
    // Albardilla: también con su despiece, y su cara inferior en sombra.
    if (pos.y >= BASIN.copingY0 - 0.001) v *= ashlar(pos);
    if (n.y < -0.5) v *= 0.7;
    // Interior del pilón: la pared que da al agua y el fondo.
    const inside = radial < -0.3 || (n.y > 0.5 && pos.y < BASIN.floorY + 0.01);
    if (inside && pos.y < BASIN.copingY0) {
      v *= 0.82;
      const wet = 1 - smooth(BASIN.waterY - 0.01, BASIN.waterY + 0.05, pos.y);
      return [v * (1 - wet * (1 - WET[0])), v * (1 - wet * (1 - WET[1])), v * (1 - wet * (1 - WET[2]))];
    }
    // Un poco de luz arriba: la piedra se aclara con la altura.
    v *= 0.96 + 0.06 * smooth(0, 0.4, pos.y);
    return [v, v, v];
  };
}

function pedestalShade(waterY: number, bowlFloor: number): Shade {
  return (pos, n) => {
    const r = Math.hypot(pos.x, pos.z);
    let v = 1;
    // Pedestal dentro del pilón: mojado hasta la línea de agua.
    const wet = pos.y < waterY + 0.03 ? 1 - smooth(waterY - 0.01, waterY + 0.04, pos.y) : 0;
    // Hueco de las tazas: más oscuro cuanto más hondo, y mojado bajo el agua.
    const inBowl = pos.y > bowlFloor - 0.02 && n.y > 0.2 && r < 0.7;
    if (inBowl) v *= 0.78 + 0.22 * smooth(bowlFloor, bowlFloor + 0.14, pos.y);
    // Cara inferior de las copas y rincón del pie: sombra.
    if (n.y < -0.4) v *= 0.66;
    // Cierre del plinto contra el fondo.
    v *= 0.78 + 0.22 * smooth(0.06, 0.2, pos.y);
    v *= 0.97 + 0.05 * smooth(0, 1.6, pos.y);
    return [v * (1 - wet * (1 - WET[0])), v * (1 - wet * (1 - WET[1])), v * (1 - wet * (1 - WET[2]))];
  };
}

/** Perfil de una taza: copa de elipse con borde de bocel y hueco interior. */
function bowlProfile(b: BowlSpec & { rimTop: number; floor: number; innerTop: number }, start: ProfilePoint): ProfilePoint[] {
  const out: ProfilePoint[] = [start];
  // Cara inferior plana desde el pie hasta el arranque de la panza (arista viva).
  const a = b.rRim - b.rStem;
  const h = b.yRim - b.yBase;
  // Panza: cuarto de elipse, tangente horizontal en el pie y vertical en el borde.
  const belly = arcPoints(b.rStem, b.yRim, a, h, -Math.PI / 2, 0, 14);
  out.push(...belly);
  // Labio: bocel exterior y cara superior plana.
  out.push(...arcPoints(b.rRim - 0.025, b.yRim + 0.015, 0.025, 0.025, 0, Math.PI / 2, 5));
  out.push(pt(b.rRim - 0.05, b.rimTop));
  // Bocel interior y pared del hueco (elipse que baja al fondo).
  out.push(...arcPoints(b.rRim - 0.05, b.rimTop - 0.02, 0.02, 0.02, Math.PI / 2, Math.PI, 5));
  const wallR = b.rRim - 0.07;
  out.push(...arcPoints(0, b.innerTop, wallR, b.innerTop - b.floor, 0, -Math.PI / 2, 14));
  return out;
}

/** Gallones: ondula el radio del labio. El peso sube con la altura para que el
 * pie siga siendo redondo y el borde dibuje los doce lóbulos. */
function gadroons(b: BowlSpec & { rimTop: number }) {
  return (_r: number, y: number, phi: number) => {
    const w = smooth(b.yBase + 0.35 * (b.yRim - b.yBase), b.yRim + 0.01, y);
    return 1 + GADROON_AMP * Math.cos(GADROONS * phi) * w;
  };
}

function buildPool(): THREE.BufferGeometry[] {
  const B = BASIN;
  const pts: ProfilePoint[] = [
    pt(B.outer, 0),
    pt(B.outer, B.plinthH, true),
    pt(B.wallR, B.plinthH, true),
    pt(B.wallR, B.copingY0, true),
    pt(B.copingOut, B.copingY0, true),
    pt(B.copingOut, B.copingTop - 0.03),
    ...arcPoints(B.copingOut - 0.03, B.copingTop - 0.03, 0.03, 0.03, 0, Math.PI / 2, 5),
    ...arcPoints(B.copingIn + 0.03, B.copingTop - 0.03, 0.03, 0.03, Math.PI / 2, Math.PI, 5),
    pt(B.copingIn, B.copingY0, true),
    pt(B.innerR, B.copingY0, true),
    pt(B.innerR, B.floorY, true),
    pt(B.pedestalR - 0.1, B.floorY),
  ];
  return latheProfile(pts, { shade: pilonShade() });
}

/** Pedestal abalaustrado + taza baja: plinto, bocel, escocia, fuste con éntasis
 * y nudo. */
function buildLowerBowl(): THREE.BufferGeometry[] {
  const B = BASIN;
  const L = LOWER_BOWL;
  const pts: ProfilePoint[] = [pt(B.pedestalR, B.floorY), pt(B.pedestalR, 0.13), pt(B.pedestalR - 0.03, 0.155, true)];
  // Cara superior del plinto hasta el bocel.
  pts.push(pt(0.37, 0.155));
  // Bocel (toro): semicírculo tangente a la cara del plinto.
  pts.push(...arcPoints(0.34, 0.205, 0.05, 0.05, -Math.PI / 2 + 0.3, Math.PI / 2, 8).map((q) => ({ ...q })));
  // Escocia: cuarto de elipse cóncavo que lleva al fuste.
  pts.push(...arcPoints(0.34, 0.31, 0.09, 0.06, -Math.PI / 2, -Math.PI, 8).map((q) => ({ r: q.r, y: q.y })));
  // Fuste con éntasis: se ensancha hacia el centro y se estrecha arriba.
  const y0 = 0.31;
  const y1 = 0.6;
  for (let i = 1; i <= 8; i++) {
    const t = i / 8;
    pts.push(pt(0.25 + (0.185 - 0.25) * t + 0.03 * Math.sin(Math.PI * t), y0 + (y1 - y0) * t));
  }
  // Collarín y nudo bulboso.
  pts.push(pt(0.185, 0.6, true), pt(0.235, 0.6, true), pt(0.235, 0.635), pt(0.215, 0.655, true), pt(0.185, 0.655, true));
  pts.push(...arcPoints(0.185, 0.735, 0.085, 0.075, -Math.PI / 2, Math.PI / 2, 10).map((q) => ({ r: q.r, y: q.y })));
  const top = pts[pts.length - 1];
  pts[pts.length - 1] = { ...top, h: true };
  // Taza baja.
  pts.push(...bowlProfile(L, pt(L.rStem, L.yBase, true)).slice(1));
  return latheProfile(pts, { shade: pedestalShade(B.waterY, L.floor), disp: (r, y, phi) => (y >= L.yBase - 0.001 ? gadroons(L)(r, y, phi) : 1) });
}

/** Pie corto con nudo + taza alta + caño central. */
function buildUpperBowl(): THREE.BufferGeometry[] {
  const L = LOWER_BOWL;
  const U = UPPER_BOWL;
  const pts: ProfilePoint[] = [pt(0.21, L.floor - 0.01), pt(0.21, L.floor + 0.03), pt(0.17, L.floor + 0.065, true)];
  pts.push(pt(0.15, L.floor + 0.065), pt(0.15, L.floor + 0.09));
  // Fuste afinado hacia arriba.
  const y0 = L.floor + 0.09;
  const y1 = 1.14;
  for (let i = 1; i <= 7; i++) {
    const t = i / 7;
    pts.push(pt(0.15 + (0.095 - 0.15) * t + 0.022 * Math.sin(Math.PI * t), y0 + (y1 - y0) * t));
  }
  pts.push(pt(0.095, 1.14, true), pt(0.14, 1.14, true), pt(0.14, 1.16), pt(0.12, 1.175, true), pt(0.1, 1.175, true));
  pts.push(...arcPoints(0.1, 1.238, 0.06, 0.063, -Math.PI / 2, Math.PI / 2, 8).map((q) => ({ r: q.r, y: q.y })));
  const top = pts[pts.length - 1];
  pts[pts.length - 1] = { ...top, h: true };
  pts.push(...bowlProfile(U, pt(U.rStem, U.yBase, true)).slice(1));
  return latheProfile(pts, {
    shade: pedestalShade(L.water, U.floor),
    disp: (r, y, phi) => (y >= U.yBase - 0.001 ? gadroons(U)(r, y, phi) : 1),
  });
}

/** Caño del surtidor: tubo corto con remate cónico, sale del fondo de la taza alta. */
function buildSpout(): THREE.BufferGeometry[] {
  const U = UPPER_BOWL;
  const pts: ProfilePoint[] = [
    pt(0.075, U.floor - 0.01),
    pt(0.075, U.floor + 0.04, true),
    pt(0.045, U.floor + 0.04, true),
    pt(0.045, U.floor + 0.17),
    pt(0.062, U.floor + 0.17, true),
    pt(0.062, U.floor + 0.2, true),
    pt(0.03, U.floor + 0.2, true),
    pt(0.0, U.floor + 0.2),
  ];
  return latheProfile(pts, { shade: () => [0.92, 0.92, 0.92] });
}

/** Toda la piedra en una geometría (1 draw call), en coordenadas de mundo. */
export function buildFountainStone(): THREE.BufferGeometry {
  return merge([...buildPool(), ...buildLowerBowl(), ...buildUpperBowl(), ...buildSpout()], "fountainStone");
}
