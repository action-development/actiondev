import { seededRandom, type DollSpec } from "../plaza-config";

/**
 * Vestuario que NO está en la ficha (`DollSpec`): pantalón, zapato, mangas y
 * estampado. Sale de una semilla APARTE (`:outfit`) para no desplazar ni un
 * sorteo del PRNG de `buildDolls` — el mismo cliente sigue teniendo la misma
 * piel, pelo, cara y camiseta que siempre.
 */

/** Pantalones: vaquero, caqui, antracita, oliva, burdeos, crudo… siempre más
 * apagados que la camiseta para que la prenda protagonista sea la de arriba. */
const PANTS_COLORS = [
  "#3A4866", // vaquero oscuro
  "#4F6A94", // vaquero claro
  "#4A5263", // gris azulado
  "#2F3A52", // marino
  "#8C7B63", // caqui
  "#5B6B4A", // oliva
  "#6B3A44", // burdeos
  "#2E2E34", // antracita
  "#A89E8A", // crudo
] as const;

/** Zapatillas: [empeine, suela]. Suela clara casi siempre: es lo que despega
 * el pie del suelo y le da forma de zapato y no de guijarro. */
const SHOES: ReadonlyArray<readonly [string, string]> = [
  ["#F1EEE6", "#CFC8BA"], // blancas
  ["#2B2B31", "#E9E4D8"], // negras
  ["#C8433A", "#EFEAE0"], // rojas
  ["#8A5A3B", "#D8CDB6"], // cuero
  ["#34455F", "#E9E4D8"], // marino
  ["#D9A93A", "#EFEAE0"], // mostaza
];

export interface DollOutfit {
  pants: string;
  shoe: string;
  sole: string;
  /** Mangas cortas = antebrazo al aire. */
  shortSleeves: boolean;
  /** Camiseta de rayas horizontales (una de cada cuatro). */
  stripes: boolean;
  /** Semilla de la forma del pelo (mechones, cola). */
  hairSeed: string;
}

export function outfitFor(spec: Pick<DollSpec, "id">): DollOutfit {
  const rnd = seededRandom(`${spec.id}:outfit`);
  const pants = PANTS_COLORS[Math.floor(rnd() * PANTS_COLORS.length)];
  const [shoe, sole] = SHOES[Math.floor(rnd() * SHOES.length)];
  return {
    pants,
    shoe,
    sole,
    shortSleeves: rnd() < 0.5,
    stripes: rnd() < 0.25,
    hairSeed: `${spec.id}:hair`,
  };
}
