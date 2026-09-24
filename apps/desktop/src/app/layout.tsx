import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { BRAND, SITE_URL, SOCIAL, OG_IMAGE } from "@/lib/seo";
import { StructuredData } from "@/components/seo/StructuredData";
import { LocaleProvider } from "@/lib/i18n";
import { PageTransition } from "@/components/animations/PageTransition";
import { GoogleTagManager } from "@/components/analytics/GoogleTagManager";
import { CookieConsent } from "@/components/ui/CookieConsent";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s — ${BRAND.name}`,
  },
  description: BRAND.shortDescription,
  keywords: [...BRAND.keywords],
  applicationName: BRAND.name,
  authors: [{ name: BRAND.legalName, url: SITE_URL }],
  creator: BRAND.legalName,
  publisher: BRAND.legalName,
  category: "Digital Agency",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: BRAND.locale,
    url: SITE_URL,
    siteName: BRAND.name,
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.shortDescription,
    images: [
      {
        url: OG_IMAGE.url,
        width: OG_IMAGE.width,
        height: OG_IMAGE.height,
        alt: OG_IMAGE.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.shortDescription,
    images: [OG_IMAGE.url],
    ...(SOCIAL.twitter && { creator: SOCIAL.twitter, site: SOCIAL.twitter }),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  /*
   * Favicon = el globo de MARCA, no el `src/app/icon.svg` genérico (que Next
   * serviría por convención de archivo si esto no estuviera): la pestaña es
   * branding, y el símbolo dibujado a mano no es el logo.
   *
   * Lo que sí se corrige es el peso: se declaraba `/logos/action_globe.webp`,
   * 1024×1024 y 35 KB descargados en CADA página para pintar 16px de pestaña.
   * `action_globe-64.png` es el MISMO glifo reescalado a 64px (2,2 KB). El
   * webp de 1024 sigue donde hace falta resolución: la textura de los
   * contenedores del hero (`canvas/port/container-textures.ts`) y el icono
   * del manifest.
   */
  icons: {
    icon: [
      { url: "/logos/action_globe-64.png", type: "image/png", sizes: "64x64" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

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
          <StructuredData kind="services" />
          <PageTransition>{children}</PageTransition>
          <CookieConsent />
        </LocaleProvider>
      </body>
    </html>
  );
}
