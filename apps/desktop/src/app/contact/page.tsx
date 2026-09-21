import type { Metadata } from "next";
import { SectionPage } from "@/components/layout/SectionPage";
import { Contact } from "@/components/sections/Contact";
import { BRAND, OG_IMAGE, absoluteUrl } from "@/lib/seo";

/**
 * /contact — antigua sección #contact de la home, movida a su propia ruta.
 * Server component: metadata. El formulario es client (GSAP + WhatsApp).
 */
export const metadata: Metadata = {
  title: "Contacto — Action",
  description:
    "Cuéntanos tu proyecto. Action, agencia de desarrollo web y de aplicaciones en Vigo: escríbenos y te respondemos por WhatsApp.",
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: absoluteUrl("/contact"),
    siteName: BRAND.name,
    title: "Contacto — Action",
    description: "Cuéntanos tu proyecto y te respondemos por WhatsApp.",
    images: [{ url: OG_IMAGE.url, width: OG_IMAGE.width, height: OG_IMAGE.height }],
  },
};

export default function ContactPage() {
  return (
    <SectionPage>
      <div id="contact" className="pt-12">
        <Contact />
      </div>
    </SectionPage>
  );
}
