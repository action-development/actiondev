import type { Metadata } from "next";
import { BRAND, BUSINESS, OG_IMAGE, absoluteUrl } from "@/lib/seo";

/**
 * Metadatos de `/contact`: una sola fuente para la calle 3D de escritorio
 * (`app/(site)/contact`) y la página del árbol móvil v2 (`app/(m)/m/contact`).
 * Extraído sin cambios de la página de escritorio.
 */
export const CONTACT_METADATA: Metadata = {
  // Sin la marca: el `template` del layout raíz ya añade " — Action".
  title: "Contacto — Agencia de desarrollo en Vigo",
  // NAP de `BUSINESS` (debe casar con Google Business Profile). ≤155 caracteres.
  description: `Action, agencia de desarrollo web y apps en ${BUSINESS.address.street}, ${BUSINESS.address.postalCode} ${BUSINESS.address.locality}. WhatsApp ${BUSINESS.phoneDisplay} o ${BUSINESS.email}: te responde una persona.`,
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: absoluteUrl("/contact"),
    siteName: BRAND.name,
    title: "Contacto — Agencia de desarrollo en Vigo — Action",
    description: "WhatsApp, email o te llamamos nosotros: te responde una persona del equipo.",
    images: [{ url: OG_IMAGE.url, width: OG_IMAGE.width, height: OG_IMAGE.height }],
  },
};
