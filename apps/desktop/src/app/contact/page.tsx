import type { Metadata } from "next";
import { BRAND, BUSINESS, OG_IMAGE, absoluteUrl } from "@/lib/seo";
import { ContactPage } from "./ContactPage";

/**
 * /contact — el portal de C/ Colón 20 en 3D (ver `ContactPage`).
 * Server component: solo metadata; la calle y el HUD son client.
 */
export const metadata: Metadata = {
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
    description: "Sin formularios: WhatsApp o email directo, y te responde una persona.",
    images: [{ url: OG_IMAGE.url, width: OG_IMAGE.width, height: OG_IMAGE.height }],
  },
};

export default function Page() {
  return <ContactPage />;
}
