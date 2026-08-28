import type { Metadata, Viewport } from "next";
import { PixelLoader } from "@/components/layout/PixelLoader";
import { FrameMarks } from "@/components/ui/FrameMarks";
import { StructuredData } from "@/components/seo/StructuredData";
import { displayFont } from "@/lib/fonts";
import { SITE } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "Desarrollo de aplicaciones móviles en Vigo — Pablo Cabaleiro",
  description:
    "Diseño y desarrollo apps para iOS y Android en Action, estudio digital de Vigo. De la idea a la App Store y Google Play. Cuéntame tu proyecto: respuesta en 24 h.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    locale: "es_ES",
    url: SITE.url,
    siteName: SITE.name,
    title: "Desarrollo de aplicaciones móviles en Vigo — Pablo Cabaleiro",
    description:
      "Apps iOS y Android de la idea a la tienda, desde Vigo. Parte del equipo de Action.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Desarrollo de aplicaciones móviles en Vigo — Pablo Cabaleiro",
    description:
      "Apps iOS y Android de la idea a la tienda, desde Vigo. Parte del equipo de Action.",
  },
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

/**
 * `viewportFit: "cover"` es el interruptor de todo esto: sin él, iOS
 * letterboxea las safe areas Y `env(safe-area-inset-*)` devuelve 0px
 * siempre, así que ningún cálculo con env() serviría de nada.
 *
 * `themeColor` pinta del crema del hero la barra de estado y el chrome
 * del navegador, para que el borde superior no corte en blanco.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#e9e7e3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={displayFont.variable}>
      <head>
        {/* Bootzy va por @font-face manual (necesitamos unicode-range),
            así que el preload se declara aquí a mano. */}
        <link
          rel="preload"
          href="/fonts/BootzyTM.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <StructuredData />
      </head>
      <body className="grain antialiased">
        <PixelLoader />
        <FrameMarks />
        {children}
      </body>
    </html>
  );
}
