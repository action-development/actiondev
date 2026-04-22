/**
 * SEO/AEO single source of truth.
 *
 * Change the brand / domain here and the rest of the app follows:
 * metadata, OpenGraph, Twitter, JSON-LD structured data, sitemap, robots, manifest.
 *
 * If the canonical domain is not actiondev.es, update SITE_URL only.
 */

export const SITE_URL = "https://actiondev.es";

export const BRAND = {
  name: "Action",
  legalName: "Action Digital Agency",
  tagline: "Digital Agency",
  shortDescription:
    "We craft digital experiences that matter. Strategy, design, and development for brands that refuse to blend in.",
  longDescription:
    "Action is a boutique digital agency specialising in premium brand websites, 3D interactive experiences, and high-converting product interfaces. We pair strategy with craft to build work that earns attention on its own merits — no templates, no compromises.",
  keywords: [
    "digital agency",
    "web design",
    "web development",
    "3D web experiences",
    "brand websites",
    "interactive design",
    "Next.js agency",
    "Three.js",
    "award-winning web design",
  ],
  foundingYear: 2020,
  locale: "en_US",
  language: "en",
  country: "ES",
  contactEmail: "hello@actiondev.es",
} as const;

interface SocialHandles {
  twitter: string;
  instagram: string;
  linkedin: string;
  github: string;
}

// Fill these with real handles when available. Empty strings are omitted from metadata.
export const SOCIAL: SocialHandles = {
  twitter: "", // e.g. "@actiondev"
  instagram: "",
  linkedin: "",
  github: "",
};

export const OG_IMAGE = {
  url: `${SITE_URL}/og-image.jpg`,
  width: 1200,
  height: 630,
  alt: `${BRAND.name} — ${BRAND.tagline}`,
} as const;

/** Absolute URL helper. */
export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}
