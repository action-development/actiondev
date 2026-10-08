"use client";

import { usePathname } from "next/navigation";
import { GENERIC_WHATSAPP_TEXT, whatsappHref } from "@/lib/leads/whatsapp";

/**
 * Enlace de WhatsApp con el mensaje de la landing en la que estás
 * (`/hablemos/{oferta}`). El layout de `/hablemos` es común a las ofertas y a
 * `/gracias`, así que el texto se resuelve aquí por la ruta; `texts` sale de
 * `adsLandings[].whatsappText`. Sin oferta conocida, mensaje genérico.
 */
export function useCampaignWhatsappHref(texts: Record<string, string>): string {
  const slug = usePathname()?.split("/")[2] ?? "";
  return whatsappHref(Object.hasOwn(texts, slug) ? texts[slug] : GENERIC_WHATSAPP_TEXT);
}
