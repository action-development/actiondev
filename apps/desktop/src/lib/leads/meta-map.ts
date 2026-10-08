import {
  LEAD_BUDGETS,
  LEAD_BUDGET_LABELS,
  LEAD_NEEDS,
  LEAD_NEED_LABELS,
  LEAD_STAGES,
  LEAD_STAGE_LABELS,
  toE164,
  type LeadAttribution,
  type LeadBudget,
  type LeadNeed,
  type LeadStage,
} from "@actiondev/shared";
import { clean, singleLine, type ParsedLead } from "./parse";
import { LEAD_LIMITS, isValidEmail, isValidPhone } from "./validation";

/**
 * Lead de un formulario instantáneo de Meta (Graph API) → lead interno
 * (`ParsedLead`, el mismo que sale de `parse.ts` para la web). PURO: sin red ni
 * `server-only`, para testearlo sin nada alrededor.
 *
 * Las preguntas P1-P3 se traducen a los MISMOS valores que valida `parse.ts`.
 * Tolerante: compara normalizando (minúsculas, sin tildes, guiones/espacios/
 * guiones bajos iguales, separadores de miles fuera) porque Meta puede devolver
 * la opción con `_` en lugar de espacios. Lo que no casa cae en un valor por
 * defecto (`unsure` / `unknown`; la etapa se queda sin valor) y el texto
 * original va a las notas: nunca se pierde lo que escribió la persona.
 */

/** Lo que pide `lib/leads/meta.ts` a la Graph API (todo opcional: no fiarse). */
export interface MetaFieldData {
  name?: string;
  values?: unknown[];
}

export interface MetaLead {
  id?: string;
  created_time?: string;
  field_data?: MetaFieldData[];
  ad_id?: string;
  ad_name?: string;
  adset_name?: string;
  campaign_name?: string;
  form_id?: string;
  platform?: string;
  is_organic?: boolean;
}

export type MetaMapResult =
  | { ok: true; docId: string; createdAt: string; lead: ParsedLead }
  | { ok: false; reason: "invalid_id" | "organic" | "invalid_phone" };

export interface MetaMapOptions {
  /** `true` = también los leads orgánicos (`is_organic`). Por defecto se descartan. */
  includeOrganic?: boolean;
  /** Para los tests: hora de respaldo si `created_time` no se puede leer. */
  now?: Date;
}

/** ID de la Graph API: solo dígitos (va en URLs y en el ID del documento). */
export const META_ID_RE = /^\d{1,40}$/;

/** ID determinista del documento de Firestore y `externalId` del ERP. */
export function metaLeadDocId(leadgenId: string): string {
  return `meta_${leadgenId}`;
}

/**
 * Opciones aceptadas por pregunta: la etiqueta de la web (shared, la que se
 * copia en el formulario de Meta), los alias de la estrategia y el propio
 * valor interno. La tabla del formulario de Meta sale de aquí.
 */
type Options<T extends string> = ReadonlyArray<readonly [label: string, value: T]>;

const withValues = <T extends string>(labels: Record<T, string>, values: readonly T[], extra: Options<T> = []): Options<T> => [
  ...values.map((v) => [labels[v], v] as const),
  ...extra,
  ...values.map((v) => [v, v] as const),
];

export const META_NEED_OPTIONS: Options<LeadNeed> = withValues(LEAD_NEED_LABELS, LEAD_NEEDS);
export const META_STAGE_OPTIONS: Options<LeadStage> = withValues(LEAD_STAGE_LABELS, LEAD_STAGES, [
  // Texto corto de ESTRATEGIA-FINAL §2.3 (la web dice «… o conectarlo») y la
  // variante que §9 prevé si Meta lo recorta.
  ["Ya existe y hay que mejorarlo", "existing"],
  ["Ya existe, hay que mejorarlo", "existing"],
]);
export const META_BUDGET_OPTIONS: Options<LeadBudget> = withValues(LEAD_BUDGET_LABELS, LEAD_BUDGETS);

/** Minúsculas, sin tildes, sin separador de miles y todo lo que no sea letra o dígito = un espacio. */
export function normalizeAnswer(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/(\d)[.,\s_](?=\d{3}(?!\d))/g, "$1")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Exacta tras normalizar; si no, prefijo inequívoco (opción recortada por Meta o ampliada). */
export function matchOption<T extends string>(raw: string, options: Options<T>): T | undefined {
  const v = normalizeAnswer(raw);
  if (!v) return undefined;
  const exact = options.find(([label]) => normalizeAnswer(label) === v);
  if (exact) return exact[1];
  if (v.length < 8) return undefined;
  const hits = new Set(
    options
      .filter(([label]) => {
        const n = normalizeAnswer(label);
        return n.length >= 8 && (n.startsWith(v) || v.startsWith(n));
      })
      .map(([, value]) => value),
  );
  return hits.size === 1 ? [...hits][0] : undefined;
}

type Question = "need" | "stage" | "budget" | "notes";

/**
 * Pregunta por su clave. Meta genera la clave de una pregunta personalizada a
 * partir del texto (`¿qué_necesitas?`); se aceptan también claves cortas.
 */
const QUESTION_KEYS: ReadonlyArray<readonly [Question, RegExp]> = [
  ["need", /\b(necesitas|necesidad|need|p1)\b/],
  ["stage", /\b(punto|etapa|fase|stage|p2)\b/],
  ["budget", /\b(presupuesto|budget|p3)\b/],
  ["notes", /\b(frase|proceso|resolver|mensaje|nota|notas|notes|comentario|comentarios|p4)\b/],
];

function questionByKey(key: string): Question | undefined {
  const k = normalizeAnswer(key);
  return QUESTION_KEYS.find(([, re]) => re.test(k))?.[0];
}

/** Si la clave no dice nada, la respuesta: solo si casa EXACTA con las opciones de una única pregunta. */
function questionByValue(value: string): Question | undefined {
  const v = normalizeAnswer(value);
  const found = (
    [
      ["need", META_NEED_OPTIONS],
      ["stage", META_STAGE_OPTIONS],
      ["budget", META_BUDGET_OPTIONS],
    ] as const
  ).filter(([, options]) => options.some(([label]) => normalizeAnswer(label) === v));
  return found.length === 1 ? found[0][0] : undefined;
}

const CONTACT_KEYS = {
  fullName: ["full_name"],
  firstName: ["first_name"],
  lastName: ["last_name"],
  email: ["email", "work_email"],
  phone: ["phone_number", "work_phone_number", "phone"],
  company: ["company_name", "company"],
} as const;
const CONTACT_KEY_SET = new Set<string>(Object.values(CONTACT_KEYS).flat());

/** `created_time` de Meta (`2026-10-08T20:15:04+0000`) → ISO 8601 UTC. */
export function metaTimeToIso(value: string | undefined, now: Date = new Date()): string {
  if (value) {
    const withColon = value.trim().replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
    const time = Date.parse(withColon);
    if (!Number.isNaN(time)) return new Date(time).toISOString();
  }
  return now.toISOString();
}

const cut = (value: string, max: number) => (value.length > max ? value.slice(0, max) : value);
const ellipsis = (value: string, max: number) => (value.length > max ? `${value.slice(0, Math.max(0, max - 1))}…` : value);

/** P4 + «[Formulario Meta · <anuncio>]» + respuestas que no casaron, sin pasar del tope de `notes`. */
function composeNotes(p4: string, adName: string | undefined, extras: string[]): string {
  const max = LEAD_LIMITS.notes;
  const tag = `[Formulario Meta${adName ? ` · ${ellipsis(adName, 140)}` : ""}]`;
  const tail = ellipsis([tag, ...extras].join("\n"), max);
  if (!p4) return tail;
  const room = max - tail.length - 2;
  if (room <= 0) return tail;
  return `${ellipsis(p4, room)}\n\n${tail}`;
}

export function mapMetaLead(raw: MetaLead, options: MetaMapOptions = {}): MetaMapResult {
  const leadgenId = typeof raw.id === "string" ? raw.id.trim() : "";
  if (!META_ID_RE.test(leadgenId)) return { ok: false, reason: "invalid_id" };
  if (raw.is_organic === true && !options.includeOrganic) return { ok: false, reason: "organic" };

  // Campo → texto (varias respuestas se unen con coma).
  const fields: Array<{ key: string; value: string }> = [];
  for (const field of Array.isArray(raw.field_data) ? raw.field_data : []) {
    if (!field || typeof field.name !== "string") continue;
    const values = (Array.isArray(field.values) ? field.values : [])
      .filter((v): v is string | number => typeof v === "string" || typeof v === "number")
      .map((v) => clean(String(v)))
      .filter(Boolean);
    if (values.length > 0) fields.push({ key: field.name.trim(), value: values.join(", ") });
  }
  const byKey = (keys: readonly string[]) =>
    fields.find((f) => keys.includes(f.key.toLowerCase()))?.value;

  // Contacto.
  const firstLast = [byKey(CONTACT_KEYS.firstName), byKey(CONTACT_KEYS.lastName)].filter(Boolean).join(" ");
  const name = singleLine(byKey(CONTACT_KEYS.fullName) ?? firstLast);
  const company = singleLine(byKey(CONTACT_KEYS.company) ?? "");
  const emailRaw = singleLine(byKey(CONTACT_KEYS.email) ?? "");
  const phoneRaw = singleLine(byKey(CONTACT_KEYS.phone) ?? "");
  const phone = toE164(phoneRaw) ?? phoneRaw;
  if (!phone || !isValidPhone(phone)) return { ok: false, reason: "invalid_phone" };

  // Preguntas.
  const extras: string[] = [];
  let need: LeadNeed | undefined;
  let stage: LeadStage | undefined;
  let budget: LeadBudget | undefined;
  const p4: string[] = [];

  for (const { key, value } of fields) {
    if (CONTACT_KEY_SET.has(key.toLowerCase())) continue;
    const label = singleLine(key.replace(/_/g, " "));
    // Respuesta de opción que no casa: texto original a las notas, en una línea.
    const unmatched = () => extras.push(ellipsis(`${label}: ${singleLine(value)}`, 160));
    const question = questionByKey(key) ?? questionByValue(value);
    if (question === "need" && !need) {
      need = matchOption(value, META_NEED_OPTIONS);
      if (!need) unmatched();
    } else if (question === "stage" && !stage) {
      stage = matchOption(value, META_STAGE_OPTIONS);
      if (!stage) unmatched();
    } else if (question === "budget" && !budget) {
      budget = matchOption(value, META_BUDGET_OPTIONS);
      if (!budget) unmatched();
    } else if (question === "notes") {
      p4.push(value);
    } else {
      // Pregunta que no conocemos (clave sin pista o una nueva en otra versión
      // del formulario): se conserva con su pregunta, como texto libre.
      p4.push(`${label}: ${value}`);
    }
  }

  if (emailRaw && !isValidEmail(emailRaw)) extras.push(ellipsis(`Email sin validar: ${emailRaw}`, 160));
  const email = emailRaw && isValidEmail(emailRaw) ? emailRaw : undefined;

  const adName = raw.ad_name ? singleLine(raw.ad_name) : undefined;
  const attribution: LeadAttribution = {
    utmSource: "facebook",
    utmMedium: "instant_form",
  };
  const campaign = raw.campaign_name ? singleLine(raw.campaign_name) : "";
  if (campaign) attribution.utmCampaign = cut(campaign, LEAD_LIMITS.attribution);
  if (adName) attribution.utmContent = cut(adName, LEAD_LIMITS.attribution);
  const formId = typeof raw.form_id === "string" && META_ID_RE.test(raw.form_id) ? raw.form_id : undefined;
  attribution.landingPath = formId ? `/meta/${formId}` : "/meta";

  const lead: ParsedLead = {
    source: "meta_lead_form",
    phone,
    notes: composeNotes(p4.join("\n"), adName, extras),
    attribution,
    // El aviso de privacidad del formulario de Meta NO es una decisión de
    // cookies (Consent Mode): no se inventa `granted`.
    consent: "unknown",
    need: need ?? "unsure",
    budget: budget ?? "unknown",
  };
  if (stage) lead.stage = stage;
  if (name) lead.name = cut(name, LEAD_LIMITS.name);
  if (email) lead.email = email;
  if (company) lead.company = cut(company, LEAD_LIMITS.company);

  return {
    ok: true,
    docId: metaLeadDocId(leadgenId),
    createdAt: metaTimeToIso(raw.created_time, options.now),
    lead,
  };
}
