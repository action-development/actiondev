import type { Metadata } from "next";
import { ORGANIZATION_ID, WEBSITE_ID } from "@actiondev/shared";
import { BRAND, OG_IMAGE, SITE_URL, absoluteUrl } from "@/lib/seo";

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

const RESENAS_URL = absoluteUrl("/resenas");

/**
 * JSON-LD de la PÁGINA (`WebPage` + `BreadcrumbList`), compartido por los dos
 * árboles. Sigue sin `Review` ni `aggregateRating`: la página habla de la
 * organización (`about`), no marca las reseñas. Escritorio lo emite desde
 * `app/(site)/resenas/layout.tsx` para no tocar su `page.tsx`.
 */
export const RESENAS_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": RESENAS_URL,
      url: RESENAS_URL,
      name: "Reseñas de clientes en Vigo",
      description: RESENAS_METADATA.description,
      inLanguage: "es",
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": ORGANIZATION_ID },
      breadcrumb: { "@id": `${RESENAS_URL}#breadcrumb` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${RESENAS_URL}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Reseñas", item: RESENAS_URL },
      ],
    },
  ],
};
