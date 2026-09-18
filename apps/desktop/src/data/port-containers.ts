import type { ContainerData } from "@/components/canvas/port/CargoContainer";
import { SHIP_ROW } from "@/components/canvas/port/quay-rows";

/**
 * Contenedores del muelle. Cargar uno en la bodega del barco navega a `href`
 * (ruta real; un "#..." es un destino aún sin página y el juego lo ignora).
 *
 * Reglas de colocación — vienen de la mecánica, no del gusto:
 *
 * - `spawnX` es su hueco en el muelle. Ahí aparecen YA APOYADOS al cargar la
 *   web y ahí vuelven si se caen a la ría.
 * - `row` es su FILA en profundidad (índice de `QUAY_ROWS`): 0 la de delante,
 *   `SHIP_ROW` la del barco, 2 la del fondo. La grúa entera viaja en z hasta
 *   la fila antes de poder enganchar nada de ella.
 * - `tier` 0 es el suelo del muelle y cada nivel sube `CONTAINER_HALF_H * 2`.
 * - El spreader mide 3,4 de ancho (`SPREADER_HALF_W`), así que entre dos
 *   contenedores VECINOS DE LA MISMA FILA hace falta un paso de 3,2 entre
 *   centros: si no, al bajar sobre uno choca con el de al lado. Dos filas
 *   distintas SÍ pueden compartir x — para eso está la profundidad.
 * - Un contenedor con otro encima NO se puede enganchar hasta quitar el de
 *   arriba: el spreader necesita el aire libre. Así que la fila de navegación
 *   va suelta al suelo y solo se apilan los de proyecto.
 */
export const PORT_CONTAINERS: (ContainerData & { spawnX: number; tier: number; row: number })[] = [
  // Reparto por ZONAS pintadas en el suelo (`port/QuayLettering.tsx`,
  // `QUAY_ZONES`): cada zona es una columna que abarca las tres filas.
  // Dentro de una fila, paso ≥ 3.2 entre centros; entre filas se evita
  // repetir x para que la de delante no tape del todo a la de atrás.

  // --- Zona "TRABAJOS REALIZADOS" (x de -13 a -4.6) ---
  { id: "p-xaulabs",     label: "XAULABS",     href: "/projects", color: "#2f8f5b", halfW: 1.3, spawnX: -11.2, tier: 0, row: 0 },
  { id: "p-fase",        label: "FASE",        href: "/projects", color: "#b23a3a", halfW: 1.3, spawnX: -11.2, tier: 1, row: 0 },
  // TRABAJO en 40 pies y en la fila del barco: el viaje principal es el corto.
  { id: "projects",      labelKey: "work",     href: "/projects", color: "#c8ff00", halfW: 2.0, spawnX: -8.6,  tier: 0, row: SHIP_ROW },
  // TRUETRADING en 40 pies: en 20 el nombre no se lee.
  { id: "p-truetrading", label: "TRUETRADING", href: "/projects", color: "#2f8fd8", halfW: 2.0, spawnX: -10.4, tier: 0, row: 2 },
  { id: "p-lift",        label: "LIFT",        href: "/projects", color: "#e8891f", halfW: 1.3, spawnX: -10.4, tier: 1, row: 2 },
  { id: "d-galicia",     label: "GALICIA",     href: "#galicia",  color: "#d9432f", halfW: 1.3, spawnX: -6.0,  tier: 0, row: 2 },

  // --- Zona "ATENCIÓN AL CLIENTE" (x de -4.2 a 4.3) ---
  { id: "testimonials", labelKey: "reviews", href: "/resenas",  color: "#ff4f8b", halfW: 1.3, spawnX: -2.6, tier: 0, row: 0 },
  { id: "contact",      labelKey: "contact", href: "/contact",   color: "#ff7a1a", halfW: 1.3, spawnX: 2.2,  tier: 0, row: 0 },
  { id: "team",         label: "EQUIPO",     href: "#equipo",   color: "#4fd1ff", halfW: 1.3, spawnX: -0.2, tier: 0, row: SHIP_ROW },
  // Decorado jugable: se pueden enganchar, pero "#..." no navega.
  { id: "d-alcasi",     label: "ALCASI",     href: "#alcasi",   color: "#8a6bd1", halfW: 2.0, spawnX: -1.6, tier: 0, row: 2 },
  { id: "d-vigo",       label: "VIGO",       href: "#vigo",     color: "#1f8a70", halfW: 1.3, spawnX: 3.0,  tier: 0, row: 2 },
];
