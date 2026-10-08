import type { Metadata } from "next";
import { BRAND, OG_IMAGE, absoluteUrl } from "@/lib/seo";
import { PlazaPage } from "./PlazaPage";

/**
 * /resenas — plaza 3D de reseñas ("sala de personajes" estilo Wii).
 *
 * Server component: solo metadata. Sin JSON-LD de reseñas a propósito: Google
 * no da estrellas a reseñas sobre el propio negocio. El texto de cada reseña
 * SÍ está en el HTML del servidor: la lista plegada ("Ver lista") de
 * `PlazaHud`, mismo patrón que la recreativa de /projects. Todo lo interactivo vive en
 * PlazaPage.tsx (client). La home mantiene su sección #reviews y su
 * redirect /reviews intactos — esta es una experiencia nueva e
 * independiente, no un reemplazo.
 */
export const metadata: Metadata = {
  // Sin la marca: el `template` del layout raíz ya añade " — Action".
  title: "Reseñas de clientes en Vigo",
  description:
    "Reseñas reales de clientes de Action, agencia de desarrollo web y de aplicaciones en Vigo: 5 estrellas en Google. Léelas en la plaza 3D o en la lista.",
  alternates: { canonical: "/resenas" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: absoluteUrl("/resenas"),
    siteName: BRAND.name,
    title: "Reseñas de clientes en Vigo — Action",
    description: "Lo que opinan nuestros clientes de Action, en una plaza 3D interactiva.",
    images: [{ url: OG_IMAGE.url, width: OG_IMAGE.width, height: OG_IMAGE.height }],
  },
};

export default function ResenasPage() {
  return <PlazaPage />;
}
