import type { Metadata } from "next";
import { SectionPage } from "@/components/layout/SectionPage";
import { Contact } from "@/components/sections/Contact";
import { BRAND, OG_IMAGE, absoluteUrl } from "@/lib/seo";

/**
 * /contact — antigua sección #contact de la home, movida a su propia ruta.
 * Server component: metadata. Los canales son client (GSAP + i18n).
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

export default function ContactPage() {
  return (
    <SectionPage>
      {/* Sin padding extra: la sección ya mide 100dvh, y sumarlo dejaría
          asomar el footer antes de hacer scroll. */}
      <div id="contact">
        <Contact />
      </div>
    </SectionPage>
  );
}
