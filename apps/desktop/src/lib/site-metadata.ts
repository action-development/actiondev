import type { Metadata, Viewport } from "next";
import { BRAND, SITE_NAME, SITE_URL, SOCIAL, OG_IMAGE } from "@/lib/seo";

/**
 * Metadatos raíz del sitio, compartidos por los DOS layouts raíz
 * (`app/(site)/layout.tsx` y `app/(m)/m/layout.tsx`) y por
 * `app/global-not-found.tsx`. Viven aquí y no en un layout porque un layout
 * solo puede exportar los nombres que Next reconoce, y porque el árbol móvil
 * tiene que emitir EXACTAMENTE el mismo `<title>` (template incluido), la
 * misma descripción y el mismo Open Graph que el escritorio: paridad SEO por
 * construcción, no por copia.
 */

/**
 * Meta description de la home (≤155 caracteres: `BRAND.shortDescription`
 * pasa de 170 y Google la cortaba). La larga sigue en el texto indexable de
 * `app/(site)/page.tsx`, en el manifest y en el JSON-LD.
 */
export const HOME_DESCRIPTION =
  "Agencia de desarrollo de aplicaciones y webs en Vigo: apps iOS y Android, webs a medida y experiencias 3D para empresas de toda Galicia. ★ 5,0 en Google.";

export const ROOT_METADATA: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s — ${BRAND.name}`,
  },
  description: HOME_DESCRIPTION,
  keywords: [...BRAND.keywords],
  applicationName: SITE_NAME,
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
    siteName: SITE_NAME,
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: HOME_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE.url,
        width: OG_IMAGE.width,
        height: OG_IMAGE.height,
        alt: OG_IMAGE.alt,
      },
    ],
  },
  // Solo la tarjeta: con título y descripción aquí, toda página sin `twitter`
  // propio (servicios, blog, proyectos, reseñas, contacto, legales) heredaba
  // los de la HOME. Sin ellos, X cae a los `og:` de cada página.
  twitter: {
    card: "summary_large_image",
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
    // iOS (pantalla de inicio) y los bots que lo piden en la raíz: daba 404.
    // El mismo globo sobre blanco y sin transparencia (iOS pinta de negro el
    // alfa, y el glifo es negro).
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // Verificación del dominio en el portfolio de Meta "Action Development"
  // (Business Manager → Seguridad de la marca → Dominios). No quitar: Meta la
  // revisa de vez en cuando y sin ella el dominio pierde la verificación.
  verification: {
    other: { "facebook-domain-verification": "e71wok1pdzangvflowbby1m7b98t1m" },
  },
};

/**
 * Viewport del árbol de escritorio: lo usan `app/(site)/layout.tsx` y
 * `app/global-not-found.tsx`. Vive aquí (y no se importa del layout) para que
 * el 404 global no arrastre el módulo del layout: ver `SiteDocument`.
 */
export const SITE_VIEWPORT: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#0a0a0a" },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

/**
 * Metadatos de TODO 404: el global (`app/global-not-found.tsx`) y los de cada
 * árbol (`(site)/not-found.tsx`, `(m)/m/not-found.tsx`, que pintan los
 * `notFound()` de las páginas). Next lee el `metadata` del `not-found.tsx`
 * (server component) y lo pone encima del heredado: sin esto, un
 * `/blog/no-existe` salía con el title, la descripción, el canonical y el Open
 * Graph de la HOME e `index, follow` junto al `noindex` que añade Next.
 */
export const NOT_FOUND_METADATA: Metadata = {
  title: { absolute: "Página no encontrada — Action" },
  description: null,
  alternates: null,
  openGraph: null,
  robots: { index: false, follow: true },
};
