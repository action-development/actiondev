import { BUSINESS } from "@actiondev/shared";

/**
 * Navegación y destinos comunes de la web móvil v2. Una sola fuente para el
 * menú, la barra fija, el pie y las páginas.
 */

/** Oficina en una línea, como en las maquetas: «Rúa Colón, 20. 36201 Vigo (Pontevedra)». */
export const OFFICE_LINE = `${BUSINESS.address.street}. ${BUSINESS.address.postalCode} ${BUSINESS.address.locality} (${BUSINESS.address.region})`;

/** Las cinco entradas del menú (DESIGN.md §7, «Menú a pantalla completa»). */
export const MOBILE_NAV = [
  { href: "/", label: "Inicio" },
  { href: "/servicios", label: "Servicios" },
  { href: "/projects", label: "Proyectos" },
  { href: "/resenas", label: "Reseñas" },
  { href: "/contact", label: "Contacto" },
] as const;

/**
 * Destino de «Contar mi proyecto» cuando la página no tiene formulario propio.
 * En una página con formulario se pasa su ancla (`#formulario`, `#proyecto`).
 */
export const PROJECT_CTA_HREF = "/contact";

/** Rótulo único de la acción principal en todo el recorrido (DESIGN.md §11). */
export const PROJECT_CTA_LABEL = "Contar mi proyecto";

/** Documentos legales: rutas del árbol de escritorio (`/legal/*` no cambia en fase 1). */
export const LEGAL_LINKS = [
  { href: "/legal/aviso-legal", label: "Aviso legal" },
  { href: "/legal/privacy", label: "Privacidad" },
  { href: "/legal/terms", label: "Términos" },
  { href: "/legal/cookies", label: "Cookies" },
] as const;

/**
 * Ruta pública de la página actual: con el rewrite del middleware
 * `usePathname()` ya devuelve la pública, pero se quita un `/m` por si acaso.
 */
export function publicPath(pathname: string | null): string {
  if (!pathname) return "/";
  if (pathname === "/m") return "/";
  return pathname.startsWith("/m/") ? pathname.slice(2) : pathname;
}

/** ¿`href` del menú es la página actual (o una hija: `/projects/fase` → Proyectos)? */
export function isCurrent(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
