import Link from "next/link";
import type { ReactNode } from "react";
import { isPhase1Route } from "@/lib/mobile-v2";

export type MLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-current"?: "page";
  "data-testid"?: string;
  onClick?: () => void;
};

/** `https://`, `mailto:`, `tel:`… — todo lo que sale del sitio. */
export function isExternalHref(href: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(href);
}

/**
 * Enlace del árbol móvil que elige solo el elemento correcto:
 * - Externo (`wa.me`, `mailto:`, Google…): `<a>`; los `https://` en pestaña
 *   nueva. Los `wa.me` son SIEMPRE `<a href>` reales: `listenContactClicks`
 *   mide `click_whatsapp` por el `href`, no por un `onClick`.
 * - Ruta con versión móvil (`lib/mobile-v2.ts` → `PHASE1_ROUTES`):
 *   `next/link`, navegación suave dentro del mismo layout raíz.
 * - Resto (`/legal/*`, landings, blog, anclas `#…`): `<a>` normal. Son del
 *   layout raíz de escritorio: con `<Link>` Next prefetchea su árbol para
 *   acabar haciendo igualmente una carga completa al cambiar de layout raíz.
 */
export function MLink({ href, children, ...rest }: MLinkProps) {
  if (isExternalHref(href)) {
    const newTab = href.startsWith("http");
    return (
      <a href={href} {...(newTab && { target: "_blank", rel: "noopener noreferrer" })} {...rest}>
        {children}
      </a>
    );
  }
  const path = href.split(/[?#]/)[0];
  if (path && isPhase1Route(path)) {
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}
