import type { ReactNode } from "react";
import { BRAND } from "@/lib/seo";
import { StructuredData } from "@/components/seo/StructuredData";
import { LocaleProvider } from "@/lib/i18n";
import { PageTransition } from "@/components/animations/PageTransition";
import { GoogleTagManager } from "@/components/analytics/GoogleTagManager";
import { CookieConsent } from "@/components/ui/CookieConsent";
import { ContactPopup } from "@/components/ui/ContactPopup";
import { LegalDock } from "@/components/layout/LegalDock";
import "./globals.css";

/**
 * Documento del árbol de escritorio (`<html>`, `<body>`, providers y chrome
 * global), SIN la tipografía: la pone quien lo monta con `fontVariable`.
 *
 * Por qué está separado del layout: Next mete `app/global-not-found.tsx` en
 * la capa raíz de TODAS las rutas, y las fuentes de `next/font` que haya en su
 * grafo acaban en el manifiesto de precargas de cada página. Cuando el 404
 * importaba `(site)/layout`, la web móvil v2 precargaba Space Grotesk (que no
 * usa) junto a sus ocho archivos de Saira. Ahora `(site)/layout` monta esto
 * con su Space Grotesk de siempre (con precarga) y el 404 global, con una
 * instancia propia `preload: false`.
 */
export function SiteDocument({ fontVariable, children }: { fontVariable: string; children: ReactNode }) {
  return (
    // Space Grotesk autoalojada vía `next/font/google`: se sirve desde el propio
    // dominio (sin llamada a Google en runtime) y con `display: swap`, así que no
    // reintroduce el FOUT que motivó ir a Helvetica en su día.
    <html lang={BRAND.language} className={`h-full antialiased ${fontVariable}`}>
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
