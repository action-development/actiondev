import type { Metadata } from "next";
import { BRAND, OG_IMAGE, absoluteUrl } from "@/lib/seo";

/**
 * Metadatos de /resenas SOLO para la web móvil. COPIA literal del `metadata`
 * de `app/(site)/resenas/page.tsx` (esa página tiene un cambio del usuario sin
 * commitear y no se toca). Pendiente: cuando se pueda editar, que la página de
 * escritorio importe este módulo y desaparezca la duplicación.
 *
 * Sin JSON-LD de reseñas a propósito (ni `aggregateRating` ni `Review`): Google
 * no da estrellas a reseñas sobre el propio negocio y CLAUDE.md lo prohíbe.
 */
export const RESENAS_METADATA: Metadata = {
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
