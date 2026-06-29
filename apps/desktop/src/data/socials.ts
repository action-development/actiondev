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

export const SOCIALS: readonly Social[] = [
  SOCIAL.linkedin && {
    name: "LinkedIn",
    url: `https://www.linkedin.com/company/${SOCIAL.linkedin}/`,
    handle: SOCIAL.linkedin,
  },
  SOCIAL.instagram && {
    name: "Instagram",
    url: `https://www.instagram.com/${SOCIAL.instagram}`,
    handle: `@${SOCIAL.instagram}`,
  },
].filter(Boolean) as readonly Social[];

export function buildWhatsappUrl(message: string): string {
  return `https://wa.me/${CONTACT.whatsappE164}?text=${encodeURIComponent(message)}`;
}
