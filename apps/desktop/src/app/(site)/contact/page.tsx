import type { Metadata } from "next";
import { CONTACT_JSON_LD, CONTACT_METADATA } from "@/lib/contact-metadata";
import { ContactPage } from "./ContactPage";

/**
 * /contact — el portal de C/ Colón 20 en 3D (ver `ContactPage`).
 * Server component: metadata + JSON-LD (`ContactPage`); la calle y el HUD son
 * client. Metadatos y JSON-LD compartidos con la versión móvil
 * (`lib/contact-metadata.ts`).
 */
export const metadata: Metadata = CONTACT_METADATA;

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(CONTACT_JSON_LD) }} />
      <ContactPage />
    </>
  );
}
