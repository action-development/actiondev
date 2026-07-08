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

import { BUSINESS } from "@actiondev/shared";

export { BUSINESS };

export const SITE_URL = BUSINESS.domain;

export const BRAND = {
  name: BUSINESS.name,
  legalName: BUSINESS.legalName,
  tagline: "Desarrollo de Aplicaciones y Webs en Vigo",
  shortDescription:
    "Agencia de desarrollo de aplicaciones y páginas web en Vigo. Apps iOS y Android, webs a medida y experiencias 3D para empresas de Pontevedra y toda Galicia. ★ 5,0 en Google.",
  longDescription:
    "Action es una agencia de desarrollo digital con sede en Vigo (Rúa Colón, 20) especializada en desarrollo de aplicaciones móviles iOS y Android, desarrollo web a medida, diseño web premium y experiencias 3D interactivas. Trabajamos con empresas de Vigo, Pontevedra y toda Galicia — del concepto a la publicación en App Store y Google Play, con el mismo equipo senior en todas las fases.",
  keywords: [
    "desarrollo de aplicaciones Vigo",
    "desarrollo de apps Vigo",
    "desarrollo de aplicaciones móviles Vigo",
    "empresa desarrollo aplicaciones Vigo",
    "desarrollo web Vigo",
    "diseño web Vigo",
    "diseño de páginas web Vigo",
    "desarrollo de aplicaciones Pontevedra",
    "desarrollo web Pontevedra",
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
  services: [
    "Desarrollo de aplicaciones móviles (iOS y Android)",
    "Desarrollo web a medida",
    "Diseño web premium",
    "Experiencias 3D interactivas",
    "Interfaces de producto y SaaS",
    "Estrategia y diseño",
  ],
} as const;

interface SocialHandles {
  twitter: string;
  instagram: string;
  linkedin: string;
  github: string;
}

export const SOCIAL: SocialHandles = {
  twitter: "",
  instagram: "action.dev",
  linkedin: "action-development",
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
