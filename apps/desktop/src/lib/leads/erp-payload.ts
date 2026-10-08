import type {
  LeadAttribution,
  LeadBudget,
  LeadContactPreference,
  LeadNeed,
  LeadSource,
  LeadStage,
} from "@actiondev/shared";

/**
 * Contrato de `POST /api/leads/inbound` del ERP interno (actionerp.vercel.app).
 * Módulo PURO y sin `server-only`: lo comparten `erp.ts` (la web) y
 * `scripts/backfill-leads-to-erp.ts` (leads antiguos), y los tests. Solo
 * importa TIPOS, para que `tsx` lo ejecute sin resolver alias.
 */

export type ErpConsent = "granted" | "denied" | "unknown";

/** Forma mínima que aceptan tanto el `ParsedLead` como un documento de Firestore. */
export interface ErpLeadInput {
  source: LeadSource;
  phone: string;
  notes?: string;
  name?: string;
  email?: string;
  company?: string;
  need?: LeadNeed;
  stage?: LeadStage;
  budget?: LeadBudget;
  contactPreference?: LeadContactPreference;
  attribution?: LeadAttribution;
  consent?: ErpConsent;
  privacyVersion?: string;
}

export interface ErpLeadPayload {
  externalId: string;
  createdAt: string;
  source: LeadSource;
  phone: string;
  name?: string;
  email?: string;
  company?: string;
  notes?: string;
  need?: LeadNeed;
  stage?: LeadStage;
  budget?: LeadBudget;
  contactPreference?: LeadContactPreference;
  attribution?: LeadAttribution;
  consent?: ErpConsent;
  privacyVersion?: string;
}

const ATTRIBUTION_KEYS = [
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "utmTerm",
  "utmContent",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
  "landingPath",
] as const satisfies readonly (keyof LeadAttribution)[];

const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

/** Aplica el contrato exacto: solo claves presentes, nada vacío, atribución filtrada a sus claves. */
export function toErpPayload(lead: ErpLeadInput, id: string, createdAt: string): ErpLeadPayload {
  const payload: ErpLeadPayload = {
    externalId: id,
    createdAt,
    source: lead.source,
    phone: lead.phone,
  };

  const optional = [
    "name",
    "email",
    "company",
    "notes",
    "need",
    "stage",
    "budget",
    "contactPreference",
    "consent",
    "privacyVersion",
  ] as const;
  for (const key of optional) {
    const value = lead[key];
    if (nonEmpty(value)) Object.assign(payload, { [key]: value });
  }

  if (lead.attribution) {
    const attribution: LeadAttribution = {};
    for (const key of ATTRIBUTION_KEYS) {
      const value = lead.attribution[key];
      if (nonEmpty(value)) attribution[key] = value;
    }
    if (Object.keys(attribution).length > 0) payload.attribution = attribution;
  }

  return payload;
}
