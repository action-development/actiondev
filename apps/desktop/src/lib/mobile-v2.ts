/**
 * Web móvil v2: qué rutas tienen versión en el árbol `app/(m)/m` y cuándo se
 * sirve. Lo usan el middleware (rewrite por UA + flag + cookie) y los enlaces
 * del árbol móvil (`components/m/MLink.tsx`). Sin dependencias: corre en el
 * runtime del middleware.
 *
 * Dos conceptos distintos (`[DEPLOY]` de CLAUDE.md):
 * - RUTAS CON ÁRBOL MÓVIL (`MOBILE_TREE_ROUTES`): las que tienen página en
 *   `app/(m)/m`. Hoy, las de fase 1; las de fase 2 (landings SEO, `/blog`,
 *   `/legal/*`) se añaden aquí cuando existan.
 * - RUTAS PÚBLICAS (`MOBILE_V2_ROUTES`): las que ve cualquier visitante móvil.
 *
 * Flag `MOBILE_V2` = `off` (por defecto) | `qa` | `on`:
 * - `off`: nada cambia; `/` en móvil sigue yendo a la zona `apps/mobile`.
 * - `qa`: nadie ve nada sin la cookie `mv2=1`.
 * - `on`: las rutas de `MOBILE_V2_ROUTES` son públicas para todo dispositivo
 *   `mobile` (las tablets siguen en escritorio).
 * - `MOBILE_V2_ROUTES` (solo cuenta en `on`) = prefijos separados por comas
 *   (`/hablemos,/contact`), o `*` = todas las rutas con árbol. Sin definir o
 *   vacía: NINGUNA (encender `on` sin lista no publica nada). Un prefijo fuera
 *   de `MOBILE_TREE_ROUTES` se ignora (no hay página móvil detrás y daría 404).
 * - Vista previa: con la cookie `mv2=1`, en `qa` y en `on`, se sirven TODAS las
 *   rutas con árbol, estén o no publicadas. `?mv2=1` pone la cookie y `?mv2=0`
 *   la quita (en `qa` y en `on`).
 */

/** Rutas con árbol móvil. `/` casa solo consigo misma; el resto, también sus hijas. */
export const MOBILE_TREE_ROUTES = ["/", "/servicios", "/projects", "/resenas", "/contact", "/hablemos"] as const;

export type MobileV2Mode = "off" | "qa" | "on";

/** Cookie de QA: `mv2=1` activa el árbol móvil con `MOBILE_V2=qa`. */
export const MV2_COOKIE = "mv2";
/** Parámetro que pone (`1`) o quita (`0`) la cookie de QA. */
export const MV2_PARAM = "mv2";

export function mobileV2Mode(raw: string | undefined): MobileV2Mode {
  return raw === "qa" || raw === "on" ? raw : "off";
}

export function matchesRoute(pathname: string, prefix: string): boolean {
  if (prefix === "/") return pathname === "/";
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** ¿La ruta pública tiene página en el árbol móvil (publicada o no)? */
export function hasMobileTree(pathname: string): boolean {
  return MOBILE_TREE_ROUTES.some((prefix) => matchesRoute(pathname, prefix));
}

/** Prefijos PÚBLICOS según `MOBILE_V2_ROUTES` (ver arriba). */
export function enabledRoutes(raw: string | undefined): string[] {
  const value = raw?.trim();
  if (!value) return [];
  if (value === "*") return [...MOBILE_TREE_ROUTES];
  return value
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => (p.length > 1 ? p.replace(/\/+$/, "") : p))
    .filter(hasMobileTree);
}

/**
 * ¿Esta ruta se sirve con el árbol móvil? (El UA `mobile` se comprueba aparte.)
 * Con la cookie de vista previa, en `qa` y `on`: toda ruta con árbol. Sin
 * cookie: solo en `on` y si la ruta está en `publicRoutes`.
 */
export function servesMobileTree(
  mode: MobileV2Mode,
  pathname: string,
  hasPreviewCookie: boolean,
  publicRoutes: readonly string[],
): boolean {
  if (mode === "off" || !hasMobileTree(pathname)) return false;
  if (hasPreviewCookie) return true;
  return mode === "on" && publicRoutes.some((prefix) => matchesRoute(pathname, prefix));
}

/** Prefijo interno del árbol móvil. Público nunca: `/m/*` directo responde 308. */
export const MOBILE_PREFIX = "/m";
