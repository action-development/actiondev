import type { Metadata, Viewport } from "next";
import { Saira_Condensed, Saira_Semi_Condensed } from "next/font/google";
import { GoogleTagManager } from "@/components/analytics/GoogleTagManager";
import { CookieBanner } from "@/components/m/CookieBanner";
import { StructuredData } from "@/components/seo/StructuredData";
import { BRAND } from "@/lib/seo";
import { ROOT_METADATA } from "@/lib/site-metadata";
import "./mobile.css";

/**
 * Layout RAÍZ de la web móvil v2 (`app/(m)/m/**`). El middleware reescribe
 * aquí la URL PÚBLICA (`/servicios` → `/m/servicios`) solo con UA móvil +
 * flag `MOBILE_V2` + ruta habilitada; `/m/*` directo responde 308 a la
 * pública. Ver `lib/mobile-v2.ts` y `[PÁGINAS]` de CLAUDE.md.
 *
 * Segundo layout raíz (route groups) para que el móvil NO cargue nada del
 * escritorio: ni `globals.css`, ni Space Grotesk, ni PageTransition, Lenis,
 * LegalDock, ContactPopup, Header o Three. Sí monta lo que no puede faltar:
 * GTM tras consentimiento (+ `listenContactClicks`, dentro de
 * `GoogleTagManager`), el banner de cookies y el JSON-LD de la entidad.
 *
 * Tipografía (DESIGN.md §5): Saira Condensed 600-900 (display) y Saira Semi
 * Condensed 400-700 (texto), autoalojadas por `next/font`.
 */
const sairaCondensed = Saira_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-saira-condensed",
  display: "swap",
  fallback: ["Arial Narrow", "sans-serif"],
});

const sairaSemiCondensed = Saira_Semi_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-saira-semi-condensed",
  display: "swap",
  fallback: ["Arial Narrow", "sans-serif"],
});

/**
 * Los MISMOS metadatos raíz que el escritorio (`lib/site-metadata.ts`):
 * template de título, descripción, Open Graph, robots e iconos. Sin
 * `alternates`: cada página móvil declara su canonical, que es SIEMPRE la URL
 * pública (reutilizando el `metadata`/`generateMetadata` de su página de
 * escritorio). Heredar el `canonical: "/"` del raíz pondría la home como
 * canonical de cualquier página que se olvidara del suyo. Sin `noindex`: el
 * HTML reescrito ES el que indexa Google (mobile-first).
 */
export const metadata: Metadata = { ...ROOT_METADATA, alternates: undefined };

// `cover`: `env(safe-area-inset-bottom)` vale algo en iPhone (barra fija y banner).
export const viewport: Viewport = {
  themeColor: "#edeae3",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function MobileRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={BRAND.language} className={`${sairaCondensed.variable} ${sairaSemiCondensed.variable}`}>
      <body className="min-h-dvh bg-paper font-body text-ink">
        <GoogleTagManager />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-90 focus:bg-lime focus:px-4 focus:py-3 focus:font-display focus:font-extrabold focus:uppercase focus:text-ink"
        >
          Saltar al contenido
        </a>
        <StructuredData kind="organization" />
        <StructuredData kind="website" />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
