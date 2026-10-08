/**
 * Web móvil v2: qué rutas PÚBLICAS tienen versión en el árbol `app/(m)/m` y
 * cómo se decide servirla. Lo usan el middleware (rewrite por UA + flag) y los
 * enlaces del árbol móvil (`components/m/MLink.tsx`). Sin dependencias: corre
 * en el runtime del middleware.
 *
 * Flag (`[DEPLOY]` de CLAUDE.md):
 * - `MOBILE_V2` = `off` (por defecto) | `qa` | `on`.
 *   - `off`: nada cambia; `/` en móvil sigue yendo a la zona `apps/mobile`.
 *   - `qa`: solo con la cookie `mv2=1` (`?mv2=1` la pone, `?mv2=0` la quita).
 *   - `on`: para todo dispositivo `mobile` (las tablets siguen en escritorio).
 * - `MOBILE_V2_ROUTES` = prefijos separados por comas (`/hablemos,/contact`)
 *   para abrir ruta a ruta. Sin definir: TODAS las de fase 1 en `qa` y
 *   NINGUNA en `on` (en público solo se abre lo que se nombra: así encender
 *   `on` sin lista no publica páginas a medio hacer). `*` = todas. Solo
 *   cuentan las de `PHASE1_ROUTES`: un prefijo fuera de esa lista se ignora
 *   (no hay página móvil detrás y daría 404).
 */

/** Rutas de fase 1 con árbol móvil. `/` casa solo consigo misma; el resto, también sus hijas. */
export const PHASE1_ROUTES = ["/", "/servicios", "/projects", "/resenas", "/contact", "/hablemos"] as const;

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

/** ¿La ruta pública tiene página en el árbol móvil (fase 1)? */
export function isPhase1Route(pathname: string): boolean {
  return PHASE1_ROUTES.some((prefix) => matchesRoute(pathname, prefix));
}

/** Prefijos habilitados por `MOBILE_V2_ROUTES` (ver arriba qué pasa sin definir). */
export function enabledRoutes(raw: string | undefined, mode: MobileV2Mode): string[] {
  const value = raw?.trim();
  if (!value) return mode === "qa" ? [...PHASE1_ROUTES] : [];
  if (value === "*") return [...PHASE1_ROUTES];
  return value
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => (p.length > 1 ? p.replace(/\/+$/, "") : p))
    .filter((p) => PHASE1_ROUTES.some((phase) => matchesRoute(p, phase)));
}

/** Prefijo interno del árbol móvil. Público nunca: `/m/*` directo responde 308. */
export const MOBILE_PREFIX = "/m";
