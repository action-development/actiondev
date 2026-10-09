import type { Metadata } from "next";
import { ORGANIZATION_ID, WEBSITE_ID } from "@actiondev/shared";
import { BUSINESS, SITE_NAME, SITE_URL, absoluteUrl, ogImage } from "@/lib/seo";

/**
 * Metadatos de `/contact`: una sola fuente para la calle 3D de escritorio
 * (`app/(site)/contact`) y la página del árbol móvil v2 (`app/(m)/m/contact`).
 * Extraído sin cambios de la página de escritorio.
 */
const TITLE = "Contacto — Agencia de desarrollo en Vigo";

export const CONTACT_METADATA: Metadata = {
  // Sin la marca: el `template` del layout raíz ya añade " — Action".
  title: TITLE,
  // NAP de `BUSINESS` (debe casar con Google Business Profile). ≤155 caracteres.
  description: `Action, agencia de desarrollo web y apps en ${BUSINESS.address.street}, ${BUSINESS.address.postalCode} ${BUSINESS.address.locality}. WhatsApp ${BUSINESS.phoneDisplay} o ${BUSINESS.email}: te responde una persona.`,
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: absoluteUrl("/contact"),
    siteName: SITE_NAME,
    title: "Contacto — Agencia de desarrollo en Vigo — Action",
    description: "WhatsApp, email o te llamamos nosotros: te responde una persona del equipo.",
    images: [ogImage(`${TITLE} — Action`)],
  },
};

const CONTACT_URL = absoluteUrl("/contact");

/**
 * `ContactPage` (sobre la organización, que ya lleva NAP, teléfono y email en
 * el JSON-LD del layout) + `BreadcrumbList`. Lo emiten la calle 3D y la página
 * móvil.
 */
export const CONTACT_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ContactPage",
      "@id": CONTACT_URL,
      url: CONTACT_URL,
      name: TITLE,
      description: CONTACT_METADATA.description,
      inLanguage: "es",
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": ORGANIZATION_ID },
      mainEntity: { "@id": ORGANIZATION_ID },
      breadcrumb: { "@id": `${CONTACT_URL}#breadcrumb` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${CONTACT_URL}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Contacto", item: CONTACT_URL },
      ],
    },
  ],
};
