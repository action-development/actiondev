import "server-only";
import { dispatchLead } from "./dispatch";
import { createLeadWithId, isFirestoreConfigured } from "./firestore";
import { describeError, getMetaLead, listMetaFormLeads, listMetaPageForms } from "./meta";
import { META_ID_RE, mapMetaLead, type MetaLead } from "./meta-map";

/**
 * Entrada de los leads de Meta en el MISMO pipeline que los de la web:
 * Firestore (id determinista `meta_<leadgen_id>`, solo si no existe) →
 * `dispatchLead` (email a hi@ + Telegram + ERP con `externalId` igual al id).
 * Si el documento ya existía, NO se avisa ni se reenvía: así el webhook y la
 * sincronización periódica pueden pasar por el mismo lead sin duplicar nada.
 *
 * Logs: solo ids y recuentos, nunca datos personales.
 */

export type IngestOutcome = "created" | "exists" | "organic" | "invalid" | "error";

/** `META_LEADS_INCLUDE_ORGANIC=1|true` = también los leads orgánicos (por defecto se descartan). */
function includeOrganic(): boolean {
  return /^(1|true|yes|si|sí)$/i.test(process.env.META_LEADS_INCLUDE_ORGANIC?.trim() ?? "");
}

export async function ingestMetaLead(raw: MetaLead): Promise<IngestOutcome> {
  const mapped = mapMetaLead(raw, { includeOrganic: includeOrganic() });
  const ref = typeof raw.id === "string" && META_ID_RE.test(raw.id) ? raw.id : "?";
  if (!mapped.ok) {
    if (mapped.reason === "organic") {
      console.info(`[meta-leads] lead orgánico descartado: leadgen=${ref}`);
      return "organic";
    }
    // No se puede guardar (sin teléfono válido o id raro): queda en el Centro de clientes potenciales de Meta.
    console.error(`[meta-leads] lead no válido (${mapped.reason}): leadgen=${ref}`);
    return "invalid";
  }

  let outcome: "created" | "exists";
  try {
    outcome = await createLeadWithId(mapped.lead, mapped.docId, mapped.createdAt);
  } catch (error) {
    console.error(`[meta-leads] no se pudo guardar: id=${mapped.docId} ${describeError(error)}`);
    return "error";
  }
  if (outcome === "exists") return "exists";

  await dispatchLead(mapped.lead, mapped.docId, mapped.createdAt);
  console.info(`[meta-leads] lead nuevo: id=${mapped.docId}`);
  return "created";
}

export interface LeadgenEvent {
  leadgenId: string;
  pageId?: string;
}

/** Webhook: lee cada lead por su id y lo mete en el pipeline. Nunca lanza. */
export async function ingestLeadgenEvents(events: LeadgenEvent[]): Promise<Record<IngestOutcome, number>> {
  const counts: Record<IngestOutcome, number> = { created: 0, exists: 0, organic: 0, invalid: 0, error: 0 };
  if (!isFirestoreConfigured()) {
    console.error("[meta-leads] Firebase no configurado: los leads de Meta no se pueden guardar");
    counts.error = events.length;
    return counts;
  }
  for (const event of events) {
    let outcome: IngestOutcome;
    try {
      outcome = await ingestMetaLead(await getMetaLead(event.leadgenId, event.pageId));
    } catch (error) {
      // La sincronización periódica lo recogerá en su siguiente pasada.
      console.error(`[meta-leads] no se pudo leer el lead: leadgen=${event.leadgenId} ${describeError(error)}`);
      outcome = "error";
    }
    counts[outcome] += 1;
  }
  return counts;
}

/** Saca los `leadgen_id` de un evento de webhook `page`/`leadgen` (sin repetir, como mucho 100). */
export function extractLeadgenEvents(body: unknown): LeadgenEvent[] {
  if (!body || typeof body !== "object") return [];
  const { object, entry } = body as { object?: unknown; entry?: unknown };
  if (object !== "page" || !Array.isArray(entry)) return [];

  const seen = new Map<string, LeadgenEvent>();
  for (const e of entry.slice(0, 100)) {
    if (!e || typeof e !== "object") continue;
    const { id: entryId, changes } = e as { id?: unknown; changes?: unknown };
    if (!Array.isArray(changes)) continue;
    for (const change of changes.slice(0, 100)) {
      if (!change || typeof change !== "object") continue;
      const { field, value } = change as { field?: unknown; value?: unknown };
      if (field !== "leadgen" || !value || typeof value !== "object") continue;
      const v = value as { leadgen_id?: unknown; page_id?: unknown };
      const leadgenId = typeof v.leadgen_id === "number" ? String(v.leadgen_id) : v.leadgen_id;
      if (typeof leadgenId !== "string" || !META_ID_RE.test(leadgenId) || seen.has(leadgenId)) continue;
      const pageCandidate = typeof v.page_id === "number" ? String(v.page_id) : (v.page_id ?? entryId);
      const pageId = typeof pageCandidate === "string" && META_ID_RE.test(pageCandidate) ? pageCandidate : undefined;
      seen.set(leadgenId, { leadgenId, pageId });
      if (seen.size >= 100) return [...seen.values()];
    }
  }
  return [...seen.values()];
}

/** IDs de una lista separada por comas; solo los numéricos. */
function idList(value: string | undefined): string[] {
  return [...new Set((value ?? "").split(",").map((s) => s.trim()).filter((s) => META_ID_RE.test(s)))];
}

export interface SyncResult {
  ok: boolean;
  hours: number;
  forms: number;
  fetched: number;
  created: number;
  existing: number;
  organic: number;
  invalid: number;
  errors: number;
  /** `true` si se cortó por tiempo: la siguiente pasada sigue. */
  partial: boolean;
  error?: "not_configured";
}

/**
 * Red de seguridad del webhook: recorre los formularios (`META_FORM_IDS` o
 * todos los de `META_PAGE_ID`) y mete los leads de las últimas `hours`. Es
 * idempotente: lo ya guardado cuenta como `existing` y no se vuelve a avisar.
 */
export async function syncMetaLeads(
  hours: number,
  { now = Date.now(), budgetMs = 40_000 }: { now?: number; budgetMs?: number } = {},
): Promise<SyncResult> {
  const result: SyncResult = {
    ok: true,
    hours,
    forms: 0,
    fetched: 0,
    created: 0,
    existing: 0,
    organic: 0,
    invalid: 0,
    errors: 0,
    partial: false,
  };
  const pageId = process.env.META_PAGE_ID?.trim();
  const configuredForms = idList(process.env.META_FORM_IDS);
  const validPage = pageId && META_ID_RE.test(pageId) ? pageId : undefined;
  if (!process.env.META_LEADS_TOKEN?.trim() || (!validPage && configuredForms.length === 0) || !isFirestoreConfigured()) {
    return { ...result, ok: false, error: "not_configured" };
  }

  const started = Date.now();
  let formIds = configuredForms;
  if (formIds.length === 0 && validPage) {
    try {
      formIds = (await listMetaPageForms(validPage)).map((f) => f.id);
    } catch (error) {
      console.error(`[meta-leads] no se pudieron listar los formularios: ${describeError(error)}`);
      return { ...result, ok: false, errors: 1 };
    }
  }
  result.forms = formIds.length;

  const since = Math.floor(now / 1000) - hours * 3600;
  for (const formId of formIds) {
    if (Date.now() - started > budgetMs) {
      result.partial = true;
      break;
    }
    let leads: MetaLead[];
    try {
      leads = await listMetaFormLeads(formId, since, validPage);
    } catch (error) {
      console.error(`[meta-leads] no se pudieron listar los leads del formulario ${formId}: ${describeError(error)}`);
      result.errors += 1;
      continue;
    }
    result.fetched += leads.length;
    for (const lead of leads) {
      if (Date.now() - started > budgetMs) {
        result.partial = true;
        break;
      }
      const outcome = await ingestMetaLead(lead);
      if (outcome === "created") result.created += 1;
      else if (outcome === "exists") result.existing += 1;
      else if (outcome === "organic") result.organic += 1;
      else if (outcome === "invalid") result.invalid += 1;
      else result.errors += 1;
    }
  }

  result.ok = result.errors === 0;
  return result;
}
