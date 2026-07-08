import { NextResponse, userAgent, type NextRequest } from "next/server";

const MOBILE_ZONE_URL = process.env.MOBILE_ZONE_URL;

export function middleware(request: NextRequest) {
  if (!MOBILE_ZONE_URL) return NextResponse.next();

  const { device } = userAgent(request);
  if (device.type !== "mobile") return NextResponse.next();

  // La zona mobile solo implementa la home. El resto de rutas (landings SEO,
  // redirects /contact|/projects|/reviews) deben servirse desde desktop —
  // reescribirlas producía 404 para usuarios y para Googlebot smartphone.
  if (request.nextUrl.pathname !== "/") return NextResponse.next();

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
