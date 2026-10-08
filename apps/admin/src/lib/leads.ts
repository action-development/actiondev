import {
  LEAD_SOURCES,
  LEAD_STATUSES,
  type Lead,
  type LeadSource,
  type LeadStatus,
} from "@actiondev/shared";
import type { DocumentSnapshot } from "firebase-admin/firestore";

/** Minutos sin contactar a partir de los cuales un lead nuevo se marca como urgente. */
export const UNCONTACTED_MINUTES = 15;

/** Normaliza un documento crudo: `closed` (estado antiguo) pasa a `won`; lo desconocido, a `new`. */
export function normalizeLeadData(id: string, data: Record<string, unknown>): Lead {
  const rawStatus = data.status;
  let status: LeadStatus;
  if (rawStatus === "closed") status = "won";
  else if ((LEAD_STATUSES as readonly unknown[]).includes(rawStatus)) status = rawStatus as LeadStatus;
  else status = "new";

  return {
    ...(data as Omit<Lead, "id" | "status" | "phone" | "notes" | "createdAt">),
    id,
    status,
    phone: typeof data.phone === "string" ? data.phone : "",
    notes: typeof data.notes === "string" ? data.notes : "",
    createdAt: typeof data.createdAt === "string" ? data.createdAt : new Date(0).toISOString(),
  };
}

export function leadFromDoc(doc: DocumentSnapshot): Lead {
  return normalizeLeadData(doc.id, (doc.data() ?? {}) as Record<string, unknown>);
}

export interface LeadFilters {
  status?: LeadStatus;
  source?: LeadSource;
}

type Param = string | string[] | undefined;

export function parseLeadFilters(params: Record<string, Param>): LeadFilters {
  const first = (v: Param) => (Array.isArray(v) ? v[0] : v);
  const status = first(params.estado);
  const source = first(params.origen);
  return {
    status: (LEAD_STATUSES as readonly string[]).includes(status ?? "") ? (status as LeadStatus) : undefined,
    source: (LEAD_SOURCES as readonly string[]).includes(source ?? "") ? (source as LeadSource) : undefined,
  };
}

/** Más recientes primero. */
export function sortLeads(leads: Lead[]): Lead[] {
  return [...leads].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function applyLeadFilters(leads: Lead[], filters: LeadFilters): Lead[] {
  return leads.filter(
    (l) => (!filters.status || l.status === filters.status) && (!filters.source || l.source === filters.source),
  );
}

/** Contador por estado. Se calcula sobre los leads ya filtrados por origen. */
export function funnelCounts(leads: Lead[]): Record<LeadStatus, number> {
  const counts = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0])) as Record<LeadStatus, number>;
  for (const l of leads) counts[l.status] += 1;
  return counts;
}

export function isUncontacted(lead: Lead, now: number): boolean {
  return lead.status === "new" && now - Date.parse(lead.createdAt) > UNCONTACTED_MINUTES * 60_000;
}

/** Dígitos del teléfono; si son 9 (móvil/fijo ES) antepone 34. */
export function whatsappUrl(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 9) digits = `34${digits}`;
  return digits.length >= 8 ? `https://wa.me/${digits}` : null;
}

export function relativeTime(iso: string, now: number): string {
  const diff = Math.max(0, now - Date.parse(iso));
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "hace un momento";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "hace 1 día" : `hace ${d} días`;
}

export function formatAbsolute(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", { timeZone: "Europe/Madrid", dateStyle: "short", timeStyle: "short" });
}
