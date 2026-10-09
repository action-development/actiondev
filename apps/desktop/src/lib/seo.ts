/**
 * SEO/AEO single source of truth.
 *
 * Change the brand / domain here and the rest of the app follows:
 * metadata, OpenGraph, Twitter, JSON-LD structured data, sitemap, robots, manifest.
 *
 * NAP data (Name, Address, Phone) lives in @actiondev/shared so desktop and
 * mobile emit identical local-SEO signals. Keep it in sync with Google
 * Business Profile.
 */

import {
  BUSINESS,
  GOOGLE_RATING_TEXT,
  LEGAL_ENTITY,
  OFFICE_ADDRESS_LINE,
  REGISTERED_ADDRESS_LINE,
  REGISTRY_LINE,
} from "@actiondev/shared";

export {
  BUSINESS,
  LEGAL_ENTITY,
  OFFICE_ADDRESS_LINE,
  REGISTERED_ADDRESS_LINE,
  REGISTRY_LINE,
};

/**
 * Fecha de última revisión de los documentos legales (ISO).
 * Actualizar SIEMPRE que se toque el contenido de /legal/*.
 */
export const LEGAL_UPDATED = "2026-10-08";

export const SITE_URL = BUSINESS.domain;

/**
 * Nombre del sitio para lo que leen las máquinas: `og:site_name`,
 * `application-name` y el `name` del manifest. «Action Development», el mismo
 * que el `WebSite` y la `Organization` del JSON-LD y que la ficha de Google:
 * «Action» a secas es también la cadena de tiendas (plan AEO, §4.1).
 *
 * La plantilla VISIBLE de los títulos sigue en « — Action» (`BRAND.name`):
 * con « — Action Development» los títulos largos pasan de 60 caracteres y
 * Google cortaría justo la marca.
 */
export const SITE_NAME = BUSINESS.alternateName;

export const BRAND = {
  name: BUSINESS.name,
  legalName: BUSINESS.legalName,
  tagline: "Desarrollo de Aplicaciones y Webs en Vigo",
  shortDescription:
    `Agencia de desarrollo de aplicaciones y páginas web en Vigo. Apps iOS y Android, webs a medida y experiencias 3D para empresas de Pontevedra y toda Galicia. ★ ${GOOGLE_RATING_TEXT} en Google.`,
  keywords: [
    "desarrollo de aplicaciones Vigo",
    "desarrollo de apps Vigo",
    "desarrollo de aplicaciones móviles Vigo",
    "empresa desarrollo aplicaciones Vigo",
    "desarrollo web Vigo",
    "diseño web Vigo",
    "diseño de páginas web Vigo",
    "tienda online Vigo",
    "desarrollo de aplicaciones Pontevedra",
    "desarrollo web Pontevedra",
    "diseño web Pontevedra",
    "desarrollo de aplicaciones Galicia",
    "agencia desarrollo web Galicia",
  ],
  foundingYear: BUSINESS.foundingYear,
  locale: "es_ES",
  language: "es",
  country: BUSINESS.address.country,
  city: BUSINESS.address.locality,
  region: BUSINESS.address.region,
  contactEmail: BUSINESS.email,
  whatsappE164: "34614027410",
  services: BUSINESS.services,
} as const;

/**
 * URLs completas (no handles). `instagram`/`linkedin` derivan de
 * `BUSINESS.social` (shared) para que desktop y mobile no diverjan;
 * `twitter`/`github` no existen en shared porque hoy no hay cuenta activa.
 */
interface SocialUrls {
  twitter: string;
  instagram: string;
  linkedin: string;
  github: string;
}

export const SOCIAL: SocialUrls = {
  twitter: "",
  instagram: BUSINESS.social.instagram,
  linkedin: BUSINESS.social.linkedin,
  github: "",
};

export const OG_IMAGE = {
  url: `${SITE_URL}/api/og`,
  width: 1200,
  height: 630,
  alt: `${BRAND.name} — ${BRAND.tagline}`,
} as const;

/** Absolute URL helper. */
export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

/**
 * Imagen Open Graph de una página, CON `alt` (sin él, `og:image:alt` faltaba
 * en todas las páginas menos la home). `title` = el texto que pinta la imagen
 * dinámica de `/api/og?title=`; sin él, la genérica de la marca.
 */
export function ogImage(alt: string, title?: string) {
  return {
    url: title ? `${OG_IMAGE.url}?title=${encodeURIComponent(title)}` : OG_IMAGE.url,
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    alt,
  };
}

/** Largo máximo de una meta description (CLAUDE.md `[SEO]`). */
export const META_DESCRIPTION_MAX = 155;

/**
 * Meta description dentro de los 155 caracteres: si el texto de origen (la
 * descripción de un proyecto, la de un post del panel) se pasa, se corta en
 * la última palabra entera y se cierra con «…», en vez de dejar que Google la
 * corte a media palabra. El texto visible de la página no cambia: esto es solo
 * para `<meta name="description">` y Open Graph.
 */
export function metaDescription(text: string, max = META_DESCRIPTION_MAX): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const head = (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.·—–-]+$/, "");
  return `${head}…`;
}
