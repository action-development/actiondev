import type { ContainerData } from "@/components/canvas/port/CargoContainer";

/**
 * Contenedores del muelle. Cargar uno en la bodega del barco navega a `href`
 * (ruta real; un "#..." es un destino aún sin página y el juego lo ignora).
 *
 * Reglas de colocación — vienen de la mecánica, no del gusto:
 *
 * - `spawnX` es su hueco en el muelle. Ahí aparecen YA APOYADOS al cargar la
 *   web y ahí vuelven si se caen a la ría.
 * - `tier` 0 es el suelo del muelle y cada nivel sube `CONTAINER_HALF_H * 2`.
 * - El spreader mide 3,4 de ancho (`SPREADER_HALF_W`), así que entre dos
 *   contenedores VECINOS hace falta un paso de 3,2 entre centros: si no, al
 *   bajar sobre uno choca con el de al lado. Por eso la fila está tan medida.
 * - Un contenedor con otro encima NO se puede enganchar hasta quitar el de
 *   arriba: el spreader necesita el aire libre. Así que la fila de navegación
 *   va suelta al suelo y solo se apilan los de proyecto.
 */
export const PORT_CONTAINERS: (ContainerData & { spawnX: number; tier: number })[] = [
  // Pila de proyectos 1. TRUETRADING va en 40 pies: en 20 el nombre no se lee.
  { id: "p-truetrading", label: "TRUETRADING", href: "/projects", color: "#2f8fd8", halfW: 2.0, spawnX: -15.2, tier: 0 },
  { id: "p-lift",        label: "LIFT",        href: "/projects", color: "#e8891f", halfW: 1.3, spawnX: -15.2, tier: 1 },
  // Pila de proyectos 2
  { id: "p-xaulabs",     label: "XAULABS",     href: "/projects", color: "#2f8f5b", halfW: 1.3, spawnX: -12.0, tier: 0 },
  { id: "p-fase",        label: "FASE",        href: "/projects", color: "#b23a3a", halfW: 1.3, spawnX: -12.0, tier: 1 },

  // Fila de navegación, en el orden del recorrido del visitante y acabando
  // pegada al barco: el viaje más corto de la grúa es la acción final.
  { id: "projects",     labelKey: "work",    href: "/projects", color: "#c8ff00", halfW: 2.0, spawnX: -8.3, tier: 0 },
  { id: "testimonials", labelKey: "reviews", href: "/resenas",  color: "#ff4f8b", halfW: 1.3, spawnX: -4.6, tier: 0 },
  { id: "team",         label: "EQUIPO",     href: "#equipo",   color: "#4fd1ff", halfW: 1.3, spawnX: -1.4, tier: 0 },
  { id: "contact",      labelKey: "contact", href: "/contact",   color: "#ff7a1a", halfW: 1.3, spawnX: 1.8,  tier: 0 },
];
