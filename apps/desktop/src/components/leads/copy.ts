import { BUSINESS } from "@actiondev/shared";

/**
 * Textos de conversión compartidos por las dos pieles (escritorio y web móvil
 * v2) de las landings de campaña, el formulario y `/hablemos/gracias`. Solo
 * promesas ya confirmadas: la primera reunión gratis (DESIGN.md §11), en Rúa
 * Colón o por videollamada (paso 01 de `data/ads-landings.ts`), las 24 horas
 * laborables y el número público de la ficha de Google y de WhatsApp.
 */

/**
 * La oferta de la primera reunión («Primera reunión gratis», «Reunión inicial
 * sin coste», «Oficina en Vigo») bajo «Siguiente» en el formulario de las
 * landings SEO (`lead-offer`). En `/hablemos/*` va `ADS_OFFER_LINE`.
 */
export const FIRST_MEETING_OFFER = "Primera reunión gratis, en Vigo o por videollamada.";

/**
 * La oferta de los anuncios en la primera pantalla de `/hablemos/*`: bajo la
 * valoración en móvil (`m-ads-offer`) y bajo «Siguiente» en escritorio
 * (`lead-offer`, prop `offerLine` de `LeadForm`). Sale de los RSA Local
 * aprobados ("…para empresas de toda Galicia") y del hero.
 */
export const ADS_OFFER_LINE = "Para empresas de toda Galicia. Primera reunión gratis, en Vigo o por videollamada.";

/** «614 02 74 10»: el número público, sin prefijo, como se reconoce al recibir la llamada. */
const PUBLIC_PHONE = BUSINESS.phoneDisplay.replace(/^\+34\s*/, "");

/**
 * Página de gracias: quién y desde dónde va a contactar, para que el lead no
 * ignore un número desconocido. Texto, nunca `tel:` (ver `lib/leads/whatsapp.ts`).
 */
export const CONTACT_EXPECTATION = `Te escribimos por WhatsApp o te llamamos desde el ${PUBLIC_PHONE} (L-V).`;

/**
 * Fallo de envío (red, tiempo límite o 5xx): lo escrito se conserva y el
 * reintento lleva el mismo `submissionId`, así que no duplica el lead.
 */
export const SUBMIT_ERROR_MESSAGE =
  "No se ha podido enviar. Lo que has escrito sigue aquí: vuelve a pulsar «Enviar mi proyecto» o escríbenos por WhatsApp y te atendemos igual.";

/** Envío aceptado sin `id` (la API lo descartó como bot): confirmación neutra, sin conversión ni redirección. */
export const RECEIVED_MESSAGE = "Recibido. Te contactamos en 24 horas laborables.";
