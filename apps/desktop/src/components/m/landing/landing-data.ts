import type { Landing } from "@/data/landings";

/**
 * Datos de presentación de las landings SEO en la web móvil v2. El CONTENIDO
 * (copy, casos, reseñas, FAQ) sale de `data/landings.ts` y `lib/landing-seo.ts`,
 * los mismos que escritorio; aquí solo lo que es del móvil.
 */

/** Id del bloque lima del hero: lo observa `StickyCta` para aparecer al salir de pantalla. */
export const LANDING_HERO_CTA_ID = "hero-cta";

/** Mensaje precargado de WhatsApp: dice desde qué página escribe, sin datos personales ni emojis. */
export function landingWhatsappText(landing: Landing): string {
  const service = landing.serviceName.charAt(0).toLowerCase() + landing.serviceName.slice(1);
  return `Hola, he visto vuestra página de ${service} y quiero contaros mi proyecto`;
}

/**
 * Pasos del proceso sin el «1. » del dato: en el móvil el número va en su
 * columna (`Steps`), como en el resto del sistema.
 */
export function landingSteps(landing: Landing): { title: string; text: string }[] {
  return landing.process.map((step) => ({ ...step, title: step.title.replace(/^\d+\.\s*/, "") }));
}
