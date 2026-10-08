import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { BRAND } from "@/lib/seo";
import { ROOT_METADATA } from "@/lib/site-metadata";
import { StructuredData } from "@/components/seo/StructuredData";
import { LocaleProvider } from "@/lib/i18n";
import { PageTransition } from "@/components/animations/PageTransition";
import { GoogleTagManager } from "@/components/analytics/GoogleTagManager";
import { CookieConsent } from "@/components/ui/CookieConsent";
import { ContactPopup } from "@/components/ui/ContactPopup";
import { LegalDock } from "@/components/layout/LegalDock";
import "./globals.css";

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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#0a0a0a" },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Space Grotesk autoalojada vía `next/font/google`: se sirve desde el propio
    // dominio (sin llamada a Google en runtime) y con `display: swap`, así que no
    // reintroduce el FOUT que motivó ir a Helvetica en su día.
    <html
      lang={BRAND.language}
      className={`h-full antialiased ${spaceGrotesk.variable}`}
    >
      <body className="min-h-full flex flex-col bg-black">
        <GoogleTagManager />
        {/*
          Salto al contenido. El texto va en ESPAÑOL fijo y no por `useT()`:
          este layout es server component y el documento es `lang="es"` — un
          rótulo en inglés dentro de un documento declarado en español se lee
          con la voz equivocada. El destino `#main-content` tiene que existir
          en TODAS las rutas (ver `[PÁGINAS]` de CLAUDE.md): sin `<main
          id="main-content">` el enlace no enfoca nada y axe lo marca como
          "skip link not focusable". Sin `rounded`: esquinas vivas.
        */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-mono focus:text-background focus:outline-none"
        >
          Saltar al contenido
        </a>
        <LocaleProvider>
          <StructuredData kind="organization" />
          <StructuredData kind="website" />
          <PageTransition>
            {children}
            <ContactPopup />
          </PageTransition>
          <CookieConsent />
          <LegalDock />
        </LocaleProvider>
      </body>
    </html>
  );
}
