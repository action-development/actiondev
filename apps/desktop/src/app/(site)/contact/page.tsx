import type { Metadata } from "next";
import { CONTACT_METADATA } from "@/lib/contact-metadata";
import { ContactPage } from "./ContactPage";

/**
 * /contact — el portal de C/ Colón 20 en 3D (ver `ContactPage`).
 * Server component: solo metadata; la calle y el HUD son client.
 * Metadatos compartidos con la versión móvil (`lib/contact-metadata.ts`).
 */
export const metadata: Metadata = CONTACT_METADATA;

export default function Page() {
  return <ContactPage />;
}
