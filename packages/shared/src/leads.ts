/**
 * Lead = documento de la colección `leads` de Firestore (el `id` es el ID del
 * documento, no un campo). Dos orígenes escriben aquí:
 * - `callback_form`: el «llámame tú» de /contact — solo `phone` + `notes`.
 * - `ads_landing` / `seo_landing`: el formulario cualificador de dos pasos
 *   (landings de campaña `/hablemos/*` y landings SEO) — rellena el resto.
 * Todo lo que no sea del «llámame tú» es opcional para que los documentos
 * antiguos sigan cumpliendo el tipo. `firestore.rules` valida las mismas
 * claves: si se añade un campo aquí, añadirlo también allí.
 */

/** Embudo comercial, en orden. `lost` exige `lostReason`. */
export const LEAD_STATUSES = ["new", "contacted", "qualified", "meeting", "proposal", "won", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_SOURCES = ["callback_form", "ads_landing", "seo_landing"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

/**
 * Todas las necesidades válidas (endpoint, reglas y panel). El formulario NO
 * las pinta todas: cada página elige 4 con la prop `needs` de `LeadForm`
 * (rejilla 2×2). Las de campaña usan `LEAD_NEEDS_CAMPAIGN`; las landings SEO
 * de web/tienda cambian `integration` por `web`.
 */
export const LEAD_NEEDS = ["app", "software", "integration", "web", "unsure"] as const;
export type LeadNeed = (typeof LEAD_NEEDS)[number];

export const LEAD_NEEDS_CAMPAIGN = ["app", "software", "integration", "unsure"] as const satisfies readonly LeadNeed[];
export const LEAD_NEEDS_WEB = ["web", "app", "software", "unsure"] as const satisfies readonly LeadNeed[];

export const LEAD_STAGES = ["idea", "defined", "existing"] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export const LEAD_BUDGETS = ["lt5k", "5k-15k", "15k-40k", "gt40k", "unknown"] as const;
export type LeadBudget = (typeof LEAD_BUDGETS)[number];

export const LEAD_CONTACT_PREFERENCES = ["call", "whatsapp", "email"] as const;
export type LeadContactPreference = (typeof LEAD_CONTACT_PREFERENCES)[number];

/** Textos en español: los usan el formulario (desktop) y el panel (admin). */
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  qualified: "Cualificado",
  meeting: "Reunión",
  proposal: "Propuesta",
  won: "Ganado",
  lost: "Perdido",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  callback_form: "Llámame tú (/contact)",
  ads_landing: "Landing de campaña",
  seo_landing: "Landing SEO",
};

export const LEAD_NEED_LABELS: Record<LeadNeed, string> = {
  app: "App móvil",
  software: "Software de gestión o ERP",
  integration: "Integración entre programas",
  web: "Web corporativa o tienda online",
  unsure: "Aún no lo tengo claro",
};

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  idea: "Es una idea",
  defined: "Sé lo que necesito",
  existing: "Ya existe y hay que mejorarlo o conectarlo",
};

export const LEAD_BUDGET_LABELS: Record<LeadBudget, string> = {
  lt5k: "Menos de 5.000 €",
  "5k-15k": "5.000 – 15.000 €",
  "15k-40k": "15.000 – 40.000 €",
  gt40k: "Más de 40.000 €",
  unknown: "Aún no lo sé",
};

export const LEAD_CONTACT_PREFERENCE_LABELS: Record<LeadContactPreference, string> = {
  call: "Llamada",
  whatsapp: "WhatsApp",
  email: "Email",
};

/**
 * De dónde vino el clic. Se lee de la URL de la landing al enviar (no se
 * guarda en el navegador). `gclid`/`gbraid`/`wbraid` permiten importar a
 * Google Ads las conversiones offline (lead cualificado / cliente ganado);
 * `fbclid`, lo mismo para Meta.
 */
export interface LeadAttribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  fbclid?: string;
  /** Ruta de la página donde se envió el formulario, sin query. */
  landingPath?: string;
}

export interface Lead {
  id: string;
  phone: string;
  notes: string;
  status: LeadStatus;
  /** ISO 8601. */
  createdAt: string;
  source?: LeadSource;
  name?: string;
  email?: string;
  company?: string;
  need?: LeadNeed;
  stage?: LeadStage;
  budget?: LeadBudget;
  contactPreference?: LeadContactPreference;
  attribution?: LeadAttribution;
  /** Decisión de cookies del visitante al enviar (solo informativo). */
  consent?: "granted" | "denied" | "unknown";
  /** `LEGAL_UPDATED` de la política de privacidad aceptada al enviar. */
  privacyVersion?: string;
  /** ISO 8601 del último cambio de `status` (lo pone el panel). */
  statusUpdatedAt?: string;
  /** ISO 8601 de la primera vez que pasó a `qualified` — hora de la conversión offline. */
  qualifiedAt?: string;
  /** ISO 8601 de cuando pasó a `won`. */
  wonAt?: string;
  /** Importe del proyecto ganado, en euros sin IVA (conversión offline con valor). */
  value?: number;
  lostReason?: string;
}
