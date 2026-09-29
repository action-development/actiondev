import { NextResponse, userAgent, type NextRequest } from "next/server";

const MOBILE_ZONE_URL = process.env.MOBILE_ZONE_URL;

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

export function middleware(request: NextRequest) {
  if (!MOBILE_ZONE_URL) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
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
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|icon\\.svg|favicon\\.ico|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml).*)",
  ],
};
