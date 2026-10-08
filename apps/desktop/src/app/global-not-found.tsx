import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { SiteDocument } from "./(site)/SiteDocument";
import { NotFoundView } from "@/components/ui/NotFoundView";
import { NOT_FOUND_METADATA, ROOT_METADATA, SITE_VIEWPORT } from "@/lib/site-metadata";

/**
 * Space Grotesk SIN precarga, instancia propia del 404 global. Next mete este
 * archivo en la capa raíz de todas las rutas, y una fuente con precarga aquí
 * (antes, la del `(site)/layout` que importaba) entraba en el manifiesto de
 * precargas de TODAS las páginas, también las de la web móvil v2, que no la
 * usan. Mismas opciones que `(site)/layout.tsx` salvo `preload`.
 */
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
  preload: false,
});

/**
 * 404 de las URLs que no casan con NINGUNA ruta (`/no-existe/de-verdad`).
 *
 * Hace falta desde que hay dos layouts raíz (`(site)` y `(m)`, route groups):
 * sin un `app/layout.tsx` único no hay dónde componer el 404 global, y Next
 * pide `global-not-found` (`experimental.globalNotFound` en `next.config.ts`).
 * Mismo documento (`SiteDocument`) y mismo contenido (`NotFoundView`) que el
 * 404 de escritorio. NO importar `(site)/layout`: ver arriba. Los `notFound()`
 * de las páginas caen en el `not-found.tsx` de su árbol (`(site)/not-found.tsx`
 * y `(m)/m/not-found.tsx`), con los mismos metadatos (`NOT_FOUND_METADATA`).
 */
export const metadata: Metadata = { ...ROOT_METADATA, ...NOT_FOUND_METADATA };
export const viewport: Viewport = SITE_VIEWPORT;

export default function GlobalNotFound() {
  return (
    <SiteDocument fontVariable={spaceGrotesk.variable}>
      <NotFoundView />
    </SiteDocument>
  );
}
