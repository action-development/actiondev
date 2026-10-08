import "server-only";
import { createHmac } from "node:crypto";
import { META_ID_RE, type MetaLead } from "./meta-map";

/**
 * Cliente MÍNIMO de la Graph API de Meta para los leads de los formularios
 * instantáneos: leer un lead, listar los de un formulario desde una fecha y
 * listar los formularios de la página. Sin SDK.
 *
 * - Token: `META_LEADS_TOKEN` (usuario del sistema). Se intenta canjear por el
 *   token de la página (`GET /{page_id}?fields=access_token`), que es el que
 *   Meta documenta para leer leads; si no se puede, se usa el del sistema.
 * - El token va en la cabecera `Authorization`, nunca en la URL, y nunca se
 *   registra. Con `META_APP_SECRET` se añade `appsecret_proof`.
 * - Versión: `META_GRAPH_VERSION` (por defecto la estable comprobada).
 * - Timeout de 8 s por llamada; los errores salen como `MetaGraphError` con
 *   código y `fbtrace_id`, sin datos del lead.
 */

/** Última versión estable comprobada el 2026-10-08 (`facebook-api-version: v26.0`; v27.0 no existe aún). */
export const META_GRAPH_DEFAULT_VERSION = "v26.0";
const GRAPH_HOST = "https://graph.facebook.com";
const TIMEOUT_MS = 8000;
const PAGE_LIMIT = "100";
/** Tope de páginas por listado (100 elementos cada una): corta bucles si Meta devolviera cursores sin fin. */
const MAX_PAGES = 50;

export const META_LEAD_FIELDS =
  "id,created_time,field_data,ad_id,ad_name,adset_name,campaign_name,form_id,platform,is_organic";
/** Si el token no puede leer los nombres de anuncio/campaña, lo imprescindible. */
const META_LEAD_FIELDS_BASIC = "id,created_time,field_data,form_id,platform,is_organic";

export class MetaGraphError extends Error {
  constructor(
    readonly status: number,
    readonly code: number | undefined,
    readonly fbtraceId: string | undefined,
    detail: string,
  ) {
    super(`Graph ${status}${code !== undefined ? ` code=${code}` : ""}${fbtraceId ? ` trace=${fbtraceId}` : ""}: ${detail}`);
    this.name = "MetaGraphError";
  }
}

/** Mensaje de error seguro para logs: sin nada que parezca un token. */
export function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/EA[A-Za-z0-9]{20,}/g, "EA***").slice(0, 300);
}

export function graphVersion(): string {
  const v = process.env.META_GRAPH_VERSION?.trim();
  return v && /^v\d{1,3}\.\d{1,2}$/.test(v) ? v : META_GRAPH_DEFAULT_VERSION;
}

function systemToken(): string {
  const token = process.env.META_LEADS_TOKEN?.trim();
  if (!token) throw new Error("META_LEADS_TOKEN no configurado");
  return token;
}

async function graphGet<T>(path: string, params: Record<string, string>, token: string): Promise<T> {
  const url = new URL(`${GRAPH_HOST}/${graphVersion()}/${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const appSecret = process.env.META_APP_SECRET?.trim();
  if (appSecret) url.searchParams.set("appsecret_proof", createHmac("sha256", appSecret).update(token).digest("hex"));

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new MetaGraphError(0, undefined, undefined, error instanceof Error ? error.name : "network");
  }

  const body = (await response.json().catch(() => null)) as
    | (T & { error?: { code?: number; message?: string; fbtrace_id?: string } })
    | null;
  if (!response.ok || !body || body.error) {
    const e = body?.error;
    throw new MetaGraphError(response.status, e?.code, e?.fbtrace_id, describeError(e?.message ?? "sin cuerpo"));
  }
  return body;
}

/** 4xx que no es de token caducado/inválido (190): puede ser falta de permiso para algún campo. */
const isFieldPermissionError = (error: unknown) =>
  error instanceof MetaGraphError && error.status >= 400 && error.status < 500 && error.code !== 190;

const pageTokens = new Map<string, { token: string; until: number }>();

/** Token de la página si se puede canjear (1 h en memoria); si no, el del usuario del sistema (10 min). */
async function tokenFor(pageId: string | undefined): Promise<string> {
  const base = systemToken();
  if (!pageId || !META_ID_RE.test(pageId)) return base;
  const cached = pageTokens.get(pageId);
  if (cached && cached.until > Date.now()) return cached.token;

  let token = base;
  let ttl = 10 * 60_000;
  try {
    const page = await graphGet<{ access_token?: string }>(pageId, { fields: "access_token" }, base);
    if (typeof page.access_token === "string" && page.access_token) {
      token = page.access_token;
      ttl = 60 * 60_000;
    }
  } catch (error) {
    console.warn(`[meta-leads] sin token de página (${pageId}), se usa el del usuario del sistema: ${describeError(error)}`);
  }
  pageTokens.set(pageId, { token, until: Date.now() + ttl });
  return token;
}

/** Solo para tests. */
export function resetMetaTokenCache(): void {
  pageTokens.clear();
}

/** Lee un lead por su `leadgen_id`. */
export async function getMetaLead(leadgenId: string, pageId?: string): Promise<MetaLead> {
  if (!META_ID_RE.test(leadgenId)) throw new Error("leadgen_id no válido");
  const token = await tokenFor(pageId);
  try {
    return await graphGet<MetaLead>(leadgenId, { fields: META_LEAD_FIELDS }, token);
  } catch (error) {
    if (!isFieldPermissionError(error)) throw error;
    return graphGet<MetaLead>(leadgenId, { fields: META_LEAD_FIELDS_BASIC }, token);
  }
}

interface GraphList<T> {
  data?: T[];
  paging?: { cursors?: { after?: string }; next?: string };
}

/** Recorre un listado por el cursor `after` (nunca se sigue la URL `next` que devuelve Meta). */
async function listAll<T>(path: string, params: Record<string, string>, token: string): Promise<T[]> {
  const out: T[] = [];
  let after: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const body = await graphGet<GraphList<T>>(path, { ...params, limit: PAGE_LIMIT, ...(after ? { after } : {}) }, token);
    out.push(...(Array.isArray(body.data) ? body.data : []));
    after = body.paging?.next ? body.paging.cursors?.after : undefined;
    if (!after) break;
  }
  return out;
}

/** Leads de un formulario creados DESPUÉS de `sinceUnix` (segundos). */
export async function listMetaFormLeads(formId: string, sinceUnix: number, pageId?: string): Promise<MetaLead[]> {
  if (!META_ID_RE.test(formId)) throw new Error("form_id no válido");
  const token = await tokenFor(pageId);
  const filtering = JSON.stringify([{ field: "time_created", operator: "GREATER_THAN", value: Math.floor(sinceUnix) }]);
  try {
    return await listAll<MetaLead>(`${formId}/leads`, { fields: META_LEAD_FIELDS, filtering }, token);
  } catch (error) {
    if (!isFieldPermissionError(error)) throw error;
    return listAll<MetaLead>(`${formId}/leads`, { fields: META_LEAD_FIELDS_BASIC, filtering }, token);
  }
}

export interface MetaForm {
  id: string;
  name?: string;
  status?: string;
}

/** Formularios de la página (todos: también los archivados, por si tienen leads recientes). */
export async function listMetaPageForms(pageId: string): Promise<MetaForm[]> {
  if (!META_ID_RE.test(pageId)) throw new Error("page_id no válido");
  const token = await tokenFor(pageId);
  const forms = await listAll<MetaForm>(`${pageId}/leadgen_forms`, { fields: "id,name,status" }, token);
  return forms.filter((f) => typeof f.id === "string" && META_ID_RE.test(f.id));
}
