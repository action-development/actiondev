import { seededRandom } from "@/components/canvas/plaza/plaza-config";

/**
 * Papeles de los pósits del tablero de `/blog` (`components/blog/PostIt.tsx`).
 * Desaturados a propósito: el único color vivo del tablero es el lima, y ese
 * se reserva para el post más reciente (lo decide el componente, no el hash).
 */
const PAPERS = ["#efe9d8", "#e3ddcc", "#d7dcc8", "#ebe2bd"] as const;

export interface PostItLayout {
  /** Giro en grados alrededor de la chincheta. */
  tilt: number;
  /** Desplazamiento dentro de su celda, en px: que no parezca una rejilla. */
  dx: number;
  dy: number;
  /** A cuántos px del corcho flota: cada pósit a su altura, para el paralaje. */
  z: number;
  /** Posición horizontal de la chincheta, en % del ancho del pósit. */
  pinX: number;
  paper: string;
}

/**
 * Cómo está clavado cada pósit, derivado del `slug`.
 *
 * Determinista (mismo PRNG que los muñecos de `/resenas`): el mismo post cae
 * siempre igual entre recargas y entre servidor y cliente, y no depende de su
 * posición en la lista — publicar uno nuevo no recoloca los demás.
 */
export function postItLayout(slug: string): PostItLayout {
  const rnd = seededRandom(`postit:${slug}`);
  const side = rnd() < 0.5 ? -1 : 1;
  return {
    tilt: side * (0.8 + rnd() * 2.7),
    dx: Math.round((rnd() - 0.5) * 16),
    dy: Math.round((rnd() - 0.5) * 20),
    pinX: Math.round(38 + rnd() * 24),
    paper: PAPERS[Math.floor(rnd() * PAPERS.length)],
    z: Math.round(12 + rnd() * 14),
  };
}
