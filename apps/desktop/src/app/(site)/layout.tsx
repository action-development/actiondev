import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { ROOT_METADATA, SITE_VIEWPORT } from "@/lib/site-metadata";
import { SiteDocument } from "./SiteDocument";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

/**
 * Metadatos raíz en `lib/site-metadata.ts`: los comparten este layout, el
 * layout raíz del árbol móvil (`app/(m)/m/layout.tsx`) y
 * `app/global-not-found.tsx`, para que title, descripción y Open Graph no
 * puedan divergir entre los dos árboles.
 */
export const metadata: Metadata = ROOT_METADATA;

export const viewport: Viewport = SITE_VIEWPORT;

/**
 * Layout raíz de escritorio: el documento (`SiteDocument`) con Space Grotesk.
 * NADIE más debe importar este archivo (en especial `global-not-found.tsx`):
 * su `next/font` con precarga se colaría en el árbol móvil. Ver `SiteDocument`.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SiteDocument fontVariable={spaceGrotesk.variable}>{children}</SiteDocument>;
}
