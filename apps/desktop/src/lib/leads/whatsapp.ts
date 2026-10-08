import { BUSINESS, type LeadNeed } from "@actiondev/shared";

/**
 * Enlaces de WhatsApp con el mensaje ya escrito. El número solo atiende
 * WhatsApp (nada de `tel:`), así que quien llega de un anuncio no debe caer en
 * un chat vacío. Sin datos personales: solo el tipo de proyecto.
 */
export function whatsappHref(message: string): string {
  return `${BUSINESS.whatsappUrl}?text=${encodeURIComponent(message)}`;
}

/** Cómo se nombra cada necesidad dentro de una frase («proyecto de app móvil»). */
export const NEED_PHRASE: Record<LeadNeed, string | null> = {
  app: "app móvil",
  web: "página web",
  software: "software de gestión",
  integration: "integración entre programas",
  unsure: null,
};

/** Mensaje genérico, para enlaces que no conocen la oferta (pie, error del formulario). */
export const GENERIC_WHATSAPP_TEXT = "Hola, vengo de vuestra web y quiero hablar de un proyecto";

/** Mensaje para el fallo del formulario: el lead no se ha guardado, así que lo cuenta por aquí. */
export function whatsappTextForNeed(need: LeadNeed): string {
  const phrase = NEED_PHRASE[need];
  return phrase ? `Hola, vengo de vuestra web y quiero hablar de un proyecto de ${phrase}` : GENERIC_WHATSAPP_TEXT;
}
