/**
 * Fuente de verdad SEO de la landing.
 *
 * NAP replicado a mano (esta app no depende de `@actiondev/shared` para
 * mantener su despliegue en Vercel aislado). DEBE coincidir carácter a
 * carácter con `packages/shared/src/seo.ts` y con la ficha de Google
 * Business Profile: una dirección distinta entre dominios rompe la
 * señal de entidad local en vez de reforzarla.
 */
export const SITE = {
  url: "https://pablo.actiondev.es",
  name: "Pablo Cabaleiro",
  jobTitle: "Desarrollador de aplicaciones móviles",
  email: "desarrollo1@actiondev.es",
  instagram: "pabl",
} as const;

/**
 * Perfil de Instagram — destino del CTA principal del pie.
 *
 * Existe también `ig.me/m/<usuario>`, que abriría el mensaje directo de
 * un toque, y se DESCARTÓ a propósito (decisión del usuario): el enlace
 * de perfil es el que está probado y no depende de un dominio de
 * redirección que puede cambiar de comportamiento. Un toque más a
 * cambio de que no falle nunca.
 */
export const IG_PROFILE = `https://instagram.com/${SITE.instagram}`;

export const AGENCY = {
  name: "Action",
  legalName: "Action Digital Agency",
  url: "https://actiondev.es",
  phoneE164: "+34614027410",
  address: {
    street: "Rúa Colón, 20",
    locality: "Vigo",
    region: "Pontevedra",
    postalCode: "36201",
    country: "ES",
  },
  geo: { latitude: 42.2372, longitude: -8.7203 },
} as const;

/** Palabras que la landing quiere ganar, en orden de intención real de
 *  contratación. No van en <meta keywords> (Google lo ignora desde
 *  2009): están aquí como contrato con el copy — si una keyword no
 *  aparece literalmente en el texto visible, sobra de esta lista. */
export const TARGET_QUERIES = [
  "desarrollo de aplicaciones móviles Vigo",
  "desarrollador de apps Vigo",
  "crear una app iOS y Android Galicia",
  "programador React Native Vigo",
] as const;
