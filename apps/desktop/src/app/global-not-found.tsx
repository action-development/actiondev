import type { Metadata, Viewport } from "next";
import SiteLayout, { viewport as siteViewport } from "./(site)/layout";
import NotFound from "./(site)/not-found";
import { ROOT_METADATA } from "@/lib/site-metadata";

/**
 * 404 de las URLs que no casan con NINGUNA ruta (`/no-existe/de-verdad`).
 *
 * Hace falta desde que hay dos layouts raíz (`(site)` y `(m)`, route groups):
 * sin un `app/layout.tsx` único no hay dónde componer el 404 global, y Next
 * pide `global-not-found` (`experimental.globalNotFound` en `next.config.ts`).
 * Se monta con el MISMO layout y el MISMO contenido que el 404 de escritorio
 * de siempre, así que el HTML no cambia. Los `notFound()` de las páginas siguen
 * cayendo en el `not-found.tsx` de su árbol: `(site)/not-found.tsx` (este mismo
 * contenido) y `(m)/m/not-found.tsx` (versión móvil).
 */
export const metadata: Metadata = {
  ...ROOT_METADATA,
  // Ni el título de la home ni su canonical, y `noindex` también en los
  // metadatos: con los de `ROOT_METADATA`, el 404 llevaba el `<title>` de la
  // home, `canonical` a la home y `index, follow` junto al `noindex` que añade
  // Next. Google ignora el canonical de un 404, pero eran señales cruzadas.
  title: { absolute: "Página no encontrada — Action" },
  alternates: undefined,
  robots: { index: false, follow: true },
};
export const viewport: Viewport = siteViewport;

export default function GlobalNotFound() {
  return (
    <SiteLayout>
      <NotFound />
    </SiteLayout>
  );
}
