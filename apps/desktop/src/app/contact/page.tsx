import type { Metadata } from "next";
import { BRAND, OG_IMAGE, absoluteUrl } from "@/lib/seo";
import { ContactPage } from "./ContactPage";

/**
 * /contact — el portal de C/ Colón 20 en 3D (ver `ContactPage`).
 * Server component: solo metadata; la calle y el HUD son client.
 */
export const metadata: Metadata = {
  // Sin la marca: el `template` del layout raíz ya añade " — Action".
  title: "Contacto",
  description:
    "Habla con Action, agencia de desarrollo web y de aplicaciones en Vigo. Sin formularios: escríbenos por WhatsApp al +34 614 02 74 10 o a hi@actiondev.es y te responde una persona.",
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: absoluteUrl("/contact"),
    siteName: BRAND.name,
    title: "Contacto — Action",
    description: "Sin formularios: WhatsApp o email directo, y te responde una persona.",
    images: [{ url: OG_IMAGE.url, width: OG_IMAGE.width, height: OG_IMAGE.height }],
  },
};

export default function Page() {
  return <ContactPage />;
}
