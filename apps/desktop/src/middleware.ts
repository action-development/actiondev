import { NextResponse, userAgent, type NextRequest } from "next/server";
import {
  MOBILE_PREFIX,
  MV2_COOKIE,
  MV2_PARAM,
  enabledRoutes,
  matchesRoute,
  mobileV2Mode,
} from "@/lib/mobile-v2";

const MOBILE_ZONE_URL = process.env.MOBILE_ZONE_URL;

// Web móvil v2 (árbol `app/(m)/m`): flag + rutas abiertas. Ver `lib/mobile-v2.ts`.
const MOBILE_V2 = mobileV2Mode(process.env.MOBILE_V2);
const MOBILE_V2_ROUTES = enabledRoutes(process.env.MOBILE_V2_ROUTES, MOBILE_V2);
/** La cookie de QA dura 30 días: se quita con `?mv2=0`. */
const MV2_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

// Assets estáticos que SOLO existen en `apps/mobile/public` y que pide la
// home mobile. Todo lo demás lo sirve desktop también con UA móvil: antes se
// reescribía CUALQUIER ruta con extensión, y con Googlebot smartphone
// `/llms.txt`, `/icons/*`, `/plaza/*`, `/projects_video/*`… daban 404 porque
// la zona mobile no los tiene. `/logos/` y `/projects/` existen idénticos en
// las dos apps y no necesitan reescritura. Si la home mobile estrena una
// carpeta en `public/`, hay que añadirla aquí o su useGLTF revienta sobre un
// 404 y crashea toda la app (pasó en 3db8f7f).
const MOBILE_ONLY_ASSETS = ["/3d/", "/ai-logos/", "/recursos/", "/mascot.webm"];

function isMobileAsset(pathname: string) {
  return MOBILE_ONLY_ASSETS.some((prefix) => pathname.startsWith(prefix));
}

/** Último segmento con punto = archivo (`/projects/fase.webp`), nunca una página. */
function isFile(pathname: string) {
  return /\.[^/]+$/.test(pathname);
}

/**
 * ¿Esta petición se sirve con el árbol móvil v2? Las TRES condiciones: UA
 * `mobile` (las tablets son `tablet` y siguen en escritorio), flag activo (`on`,
 * o `qa` + cookie `mv2=1`) y ruta abierta en `MOBILE_V2_ROUTES`. `/projects` es
 * a la vez página y carpeta de `public/`: sus imágenes no se reescriben.
 */
function servesMobileV2(request: NextRequest, pathname: string) {
  if (MOBILE_V2 === "off" || isFile(pathname)) return false;
  if (!MOBILE_V2_ROUTES.some((prefix) => matchesRoute(pathname, prefix))) return false;
  if (MOBILE_V2 === "qa" && request.cookies.get(MV2_COOKIE)?.value !== "1") return false;
  return userAgent(request).device.type === "mobile";
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // `/m/*` es interno: el HTML que se indexa es el de la URL PÚBLICA. Entrar
  // directo (enlace, rastreador, a mano) → 308 a la pública, con o sin flag.
  // El rewrite de abajo no vuelve a pasar por aquí.
  if (pathname === MOBILE_PREFIX || pathname.startsWith(`${MOBILE_PREFIX}/`)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(MOBILE_PREFIX.length) || "/";
    return NextResponse.redirect(url, 308);
  }

  // QA en producción: `?mv2=1` pone la cookie, `?mv2=0` la quita, y se
  // redirige a la misma URL sin el parámetro (307: no se cachea).
  if (MOBILE_V2 === "qa") {
    const flag = request.nextUrl.searchParams.get(MV2_PARAM);
    if (flag === "1" || flag === "0") {
      const url = request.nextUrl.clone();
      url.searchParams.delete(MV2_PARAM);
      const response = NextResponse.redirect(url, 307);
      if (flag === "1") {
        response.cookies.set(MV2_COOKIE, "1", {
          path: "/",
          maxAge: MV2_COOKIE_MAX_AGE,
          sameSite: "lax",
          httpOnly: true,
          secure: request.nextUrl.protocol === "https:",
        });
      } else {
        response.cookies.delete(MV2_COOKIE);
      }
      return response;
    }
  }

  if (servesMobileV2(request, pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? MOBILE_PREFIX : `${MOBILE_PREFIX}${pathname}`;
    // `Vary` también va en `headers()` de next.config.ts: aquí Next lo pisa en
    // algunas respuestas.
    const response = NextResponse.rewrite(url);
    response.headers.set("Vary", "User-Agent");
    return response;
  }

  if (!MOBILE_ZONE_URL) return NextResponse.next();

  const isHome = pathname === "/";
  // Solo `/` y sus assets propios salen de la zona mobile. Las rutas de
  // página (landings SEO, /contact, /projects…) se sirven desde desktop en
  // cualquier dispositivo: reescribirlas daba 404 a Googlebot smartphone.
  if (!isHome && !isMobileAsset(pathname)) return NextResponse.next();

  const isMobile = userAgent(request).device.type === "mobile";
  const response = isMobile
    ? NextResponse.rewrite(new URL(pathname + search, MOBILE_ZONE_URL))
    : NextResponse.next();

  // Dynamic serving: `/` responde HTML distinto según el dispositivo en la
  // MISMA URL. Google pide `Vary: User-Agent` para que ni él ni las cachés
  // intermedias sirvan la versión desktop al rastreador móvil o al revés.
  if (isHome) response.headers.set("Vary", "User-Agent");
  // El rewrite entre proyectos llega a la URL de despliegue de la zona
  // mobile (`actiondev-mobile-<hash>.vercel.app`), y Vercel pone
  // `x-robots-tag: noindex` a esas URLs. Sin esto, la home que indexa
  // Googlebot smartphone (mobile-first) salía noindex.
  if (isHome && isMobile) response.headers.set("X-Robots-Tag", "index, follow");
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|icon\\.svg|favicon\\.ico|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml).*)",
  ],
};
