import type { Metadata } from "next";
import { BRAND, SITE_URL, SOCIAL, OG_IMAGE } from "@/lib/seo";

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
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};
