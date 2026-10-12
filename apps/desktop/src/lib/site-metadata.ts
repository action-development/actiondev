import type { Metadata, Viewport } from "next";
import { GOOGLE_RATING_TEXT, SITE_ICONS } from "@actiondev/shared";
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
export const HOME_DESCRIPTION = `Agencia de desarrollo de aplicaciones y webs en Vigo: apps iOS y Android, webs a medida y experiencias 3D para empresas de toda Galicia. ★ ${GOOGLE_RATING_TEXT} en Google.`;

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
   * Favicon = la mascota (`SITE_ICONS` de shared, el mismo que la zona
   * mobile). NO volver a poner un `app/icon.svg` de convención: con dos
   * layouts raíz Next no lo enlaza en el HTML, pero se servía en `/icon.svg`
   * (el manifest apuntaba ahí) con un símbolo dibujado a mano que no es la
   * marca. `/apple-touch-icon.png` sigue en la raíz para los que lo piden
   * ahí sin leer el HTML.
   */
  icons: SITE_ICONS,
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
