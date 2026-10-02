import { BRAND, SOCIAL } from "@/lib/seo";

export const CONTACT = {
  email: BRAND.contactEmail,
  whatsappE164: BRAND.whatsappE164,
  location: { city: BRAND.city, country: BRAND.country },
} as const;

export interface Social {
  name: string;
  url: string;
  handle: string;
}

/** Último segmento de la URL del perfil: `…/actiondev.es/` → `actiondev.es`. */
function handleFromUrl(url: string): string {
  return new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";
}

// `SOCIAL` ya trae URLs completas (`lib/seo.ts`): construirlas otra vez
// componía `https://www.instagram.com/https://instagram.com/…`.
export const SOCIALS: readonly Social[] = [
  SOCIAL.linkedin && {
    name: "LinkedIn",
    url: SOCIAL.linkedin,
    handle: handleFromUrl(SOCIAL.linkedin),
  },
  SOCIAL.instagram && {
    name: "Instagram",
    url: SOCIAL.instagram,
    handle: `@${handleFromUrl(SOCIAL.instagram)}`,
  },
].filter(Boolean) as readonly Social[];

export function buildWhatsappUrl(message: string): string {
  return `https://wa.me/${CONTACT.whatsappE164}?text=${encodeURIComponent(message)}`;
}

export function buildMailtoUrl(subject: string, body: string): string {
  const query = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return `mailto:${CONTACT.email}?${query}`;
}
