import { NextResponse, userAgent, type NextRequest } from "next/server";

const MOBILE_ZONE_URL = process.env.MOBILE_ZONE_URL;

export function middleware(request: NextRequest) {
  if (!MOBILE_ZONE_URL) return NextResponse.next();

  const { device } = userAgent(request);
  if (device.type !== "mobile") return NextResponse.next();

  // La zona mobile solo implementa la home, pero SÍ sirve sus propios
  // assets estáticos (GLBs, webp) referenciados por esa home — hay que
  // reescribirlos o el useGLTF de R3F revienta sobre un 404 y crashea
  // toda la app (pasó antes en 3db8f7f). Las rutas de página (landings
  // SEO, /contact|/projects|/reviews) sí deben servirse desde desktop —
  // reescribirlas producía 404 para usuarios y para Googlebot smartphone.
  const isAsset = /\.[a-zA-Z0-9]+$/.test(request.nextUrl.pathname);
  if (request.nextUrl.pathname !== "/" && !isAsset) {
    return NextResponse.next();
  }

  const target = new URL(
    request.nextUrl.pathname + request.nextUrl.search,
    MOBILE_ZONE_URL,
  );
  return NextResponse.rewrite(target);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|icon\\.svg|favicon\\.ico|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml).*)",
  ],
};
