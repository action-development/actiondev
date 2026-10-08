import {
  LEAD_BUDGETS,
  LEAD_CONTACT_PREFERENCES,
  LEAD_NEEDS,
  LEAD_STAGES,
  LEAD_WEB_SOURCES,
  type LeadAttribution,
  type LeadBudget,
  type LeadContactPreference,
  type LeadNeed,
  type LeadSource,
  type LeadStage,
} from "@actiondev/shared";
import { LEAD_LIMITS, isValidEmail, isValidPhone } from "./validation";

/**
 * Validación ESTRICTA del cuerpo de `POST /api/lead`. Todo lo que llega es
 * hostil: se comprueban tipos, uniones y longitudes, se recortan los espacios,
 * se descartan los caracteres de control y las claves desconocidas no pasan.
 * Lo que sale de aquí (`ParsedLead`) es lo único que se guarda.
 */

export type LeadConsent = "granted" | "denied" | "unknown";

export interface ParsedLead {
  source: LeadSource;
  phone: string;
  notes: string;
  name?: string;
  email?: string;
  company?: string;
  need?: LeadNeed;
  stage?: LeadStage;
  budget?: LeadBudget;
  contactPreference?: LeadContactPreference;
  attribution: LeadAttribution;
  consent: LeadConsent;
  /** Solo para el aviso (no se guarda: no es un campo de `Lead`). */
  offer?: string;
}

export interface ParsedRequest {
  lead: ParsedLead;
  /** Relleno del honeypot `website`. */
  honeypot: string;
  /** `null` si no vino o no es un número finito. */
  elapsedMs: number | null;
  /**
   * Clave de idempotencia del formulario (la misma en cada reintento, ver
   * `useLeadForm`). Solo si tiene forma de ID aleatorio seguro; si no, se
   * ignora (el lead se guarda igual, con ID automático).
   */
  submissionId?: string;
}

export type ParseResult = { ok: true; value: ParsedRequest } | { ok: false; error: string };

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

/** `crypto.randomUUID()` (36) o 32 hex del respaldo: letras, dígitos y guiones. Nada de `/` ni `.`. */
const SUBMISSION_ID_RE = /^[A-Za-z0-9-]{32,64}$/;

/** Caracteres de control (salvo salto de línea y tabulador) fuera: cabeceras y logs limpios. */
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function clean(value: string): string {
  return value.replace(CONTROL_RE, "").trim();
}

/** Un campo de una línea: sin saltos. */
export function singleLine(value: string): string {
  return clean(value).replace(/\s+/g, " ");
}

function oneOf<T extends string>(list: readonly T[], value: unknown): T | undefined {
  return typeof value === "string" && (list as readonly string[]).includes(value) ? (value as T) : undefined;
}

export function parseLeadRequest(body: unknown): ParseResult {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "invalid_body" };
  }
  const raw = body as Record<string, unknown>;

  // Solo orígenes de la web: `meta_lead_form` entra por `/api/meta/leads`, nunca por aquí.
  const source = oneOf(LEAD_WEB_SOURCES, raw.source);
  if (!source) return { ok: false, error: "invalid_source" };

  const honeypot = typeof raw.website === "string" ? raw.website : "";
  const elapsedMs = typeof raw.elapsedMs === "number" && Number.isFinite(raw.elapsedMs) ? raw.elapsedMs : null;
  const submissionId =
    typeof raw.submissionId === "string" && SUBMISSION_ID_RE.test(raw.submissionId) ? raw.submissionId : undefined;

  const str = (key: string, max: number, multiline = false): string | undefined | null => {
    const v = raw[key];
    if (v === undefined || v === null || v === "") return undefined;
    if (typeof v !== "string") return null;
    const out = multiline ? clean(v) : singleLine(v);
    if (out.length > max) return null;
    return out || undefined;
  };

  const phoneRaw = str("phone", LEAD_LIMITS.phoneMax);
  if (!phoneRaw || !isValidPhone(phoneRaw)) return { ok: false, error: "invalid_phone" };

  const notes = str("notes", LEAD_LIMITS.notes, true);
  if (notes === null) return { ok: false, error: "invalid_notes" };

  const lead: ParsedLead = {
    source,
    phone: phoneRaw,
    notes: notes ?? "",
    attribution: {},
    consent: oneOf(["granted", "denied", "unknown"] as const, raw.consent) ?? "unknown",
  };

  // El «llámame tú» solo trae teléfono y notas; el cualificador de dos pasos
  // (`ads_landing`, `seo_landing` y `contact_page`), todo lo demás.
  if (source !== "callback_form") {
    const name = str("name", LEAD_LIMITS.name);
    if (!name) return { ok: false, error: "invalid_name" };
    const email = str("email", LEAD_LIMITS.email);
    if (!email || !isValidEmail(email)) return { ok: false, error: "invalid_email" };
    const company = str("company", LEAD_LIMITS.company);
    if (company === null) return { ok: false, error: "invalid_company" };

    const need = oneOf(LEAD_NEEDS, raw.need);
    const stage = oneOf(LEAD_STAGES, raw.stage);
    const budget = oneOf(LEAD_BUDGETS, raw.budget);
    const contactPreference = oneOf(LEAD_CONTACT_PREFERENCES, raw.contactPreference);
    if (!need) return { ok: false, error: "invalid_need" };
    if (!stage) return { ok: false, error: "invalid_stage" };
    if (!budget) return { ok: false, error: "invalid_budget" };
    if (!contactPreference) return { ok: false, error: "invalid_contact_preference" };

    Object.assign(lead, { name, email, need, stage, budget, contactPreference });
    if (company) lead.company = company;

    if (typeof raw.offer === "string" && /^[a-z0-9_-]{1,60}$/.test(raw.offer)) lead.offer = raw.offer;
  }

  if (raw.attribution !== undefined && raw.attribution !== null) {
    if (typeof raw.attribution !== "object" || Array.isArray(raw.attribution)) {
      return { ok: false, error: "invalid_attribution" };
    }
    const a = raw.attribution as Record<string, unknown>;
    for (const key of ATTRIBUTION_KEYS) {
      const v = a[key];
      if (v === undefined || v === null || v === "") continue;
      if (typeof v !== "string") return { ok: false, error: "invalid_attribution" };
      const out = singleLine(v);
      if (out.length > LEAD_LIMITS.attribution) return { ok: false, error: "invalid_attribution" };
      if (out) lead.attribution[key] = out;
    }
  }

  return { ok: true, value: { lead, honeypot, elapsedMs, ...(submissionId && { submissionId }) } };
}
