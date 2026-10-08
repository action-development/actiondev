import {
  LEAD_BUDGET_LABELS,
  LEAD_CONTACT_PREFERENCE_LABELS,
  LEAD_NEED_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STAGE_LABELS,
  LEAD_STATUS_LABELS,
  type Lead,
} from "@actiondev/shared";

/** Nombres EXACTOS de las acciones de conversión en Google Ads. */
export const CONVERSION_QUALIFIED = "Lead cualificado";
export const CONVERSION_WON = "Cliente ganado";

export const OFFLINE_TIME_ZONE = "Europe/Madrid";
/** Google Ads solo acepta clics de los últimos 90 días. */
export const OFFLINE_MAX_DAYS = 90;

/** Escapa una celda CSV (RFC 4180): comillas si hay `,` `"` o saltos de línea. */
export function csvCell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "";
  const text = String(value);
  return /[",\r\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function csvRow(cells: Array<string | number | undefined | null>): string {
  return cells.map(csvCell).join(",");
}

/** Neutraliza fórmulas (=, +, -, @) en texto libre abierto con Excel/Sheets. */
function safeText(value: string | undefined): string {
  if (!value) return "";
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/** `yyyy-MM-dd HH:mm:ss` en hora de Madrid (la plantilla lleva `Parameters:TimeZone`). */
export function formatMadridTime(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: OFFLINE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
}

export interface OfflineOptions {
  now: Date;
  /** `YYYY-MM-DD` opcional; se aplica además del tope de 90 días. */
  desde?: string;
}

/** Límite inferior de `createdAt` (ms): el más restrictivo entre `desde` y 90 días. */
export function offlineCutoff({ now, desde }: OfflineOptions): number {
  const max = now.getTime() - OFFLINE_MAX_DAYS * 24 * 60 * 60 * 1000;
  const parsed = desde && /^\d{4}-\d{2}-\d{2}$/.test(desde) ? Date.parse(`${desde}T00:00:00Z`) : NaN;
  return Number.isNaN(parsed) ? max : Math.max(max, parsed);
}

/**
 * Consentimiento del lead para las columnas `Ad User Data` / `Ad Personalization`.
 * `consent` es la decisión del banner al enviar (un único interruptor: el
 * Consent Mode lo aplica igual a ad_user_data y ad_personalization). Sin dato
 * (leads antiguos) o `unknown` (no decidió): vacío, nunca se inventa `Granted`.
 */
export function googleConsent(consent: Lead["consent"]): "Granted" | "Denied" | "" {
  if (consent === "granted") return "Granted";
  if (consent === "denied") return "Denied";
  return "";
}

/**
 * CSV de la plantilla «Importar conversiones por clic» de Google Ads.
 * Solo leads con `gclid`: la subida por archivo no tiene columnas GBRAID/WBRAID.
 * Sin BOM: la primera celda debe ser literalmente `Parameters:TimeZone=…`.
 */
export function buildOfflineConversionsCsv(leads: Lead[], options: OfflineOptions): string {
  const cutoff = offlineCutoff(options);
  const lines = [
    `Parameters:TimeZone=${OFFLINE_TIME_ZONE}`,
    csvRow([
      "Google Click ID",
      "Conversion Name",
      "Conversion Time",
      "Conversion Value",
      "Conversion Currency",
      "Ad User Data",
      "Ad Personalization",
    ]),
  ];

  for (const lead of leads) {
    const gclid = lead.attribution?.gclid?.trim();
    if (!gclid) continue;
    const consent = googleConsent(lead.consent);
    const created = Date.parse(lead.createdAt);
    if (Number.isNaN(created) || created < cutoff) continue;

    if (lead.qualifiedAt && !Number.isNaN(Date.parse(lead.qualifiedAt))) {
      lines.push(csvRow([gclid, CONVERSION_QUALIFIED, formatMadridTime(lead.qualifiedAt), "", "", consent, consent]));
    }
    if (
      lead.status === "won" &&
      lead.wonAt &&
      !Number.isNaN(Date.parse(lead.wonAt)) &&
      typeof lead.value === "number" &&
      lead.value > 0
    ) {
      lines.push(csvRow([gclid, CONVERSION_WON, formatMadridTime(lead.wonAt), lead.value, "EUR", consent, consent]));
    }
  }

  return lines.join("\r\n") + "\r\n";
}

const GENERIC_HEADERS = [
  "id", "createdAt", "status", "statusUpdatedAt", "source", "name", "company", "email", "phone",
  "need", "stage", "budget", "contactPreference", "notes",
  "utmSource", "utmMedium", "utmCampaign", "utmTerm", "utmContent",
  "gclid", "gbraid", "wbraid", "fbclid", "landingPath",
  "consent", "privacyVersion", "qualifiedAt", "wonAt", "value", "lostReason",
];

/** CSV de todos los leads, con valores legibles (labels) en las uniones. Con BOM para Excel. */
export function buildLeadsCsv(leads: Lead[]): string {
  const lines = [csvRow(GENERIC_HEADERS)];
  for (const l of leads) {
    const a = l.attribution;
    lines.push(
      csvRow([
        l.id,
        l.createdAt,
        LEAD_STATUS_LABELS[l.status],
        l.statusUpdatedAt,
        l.source ? LEAD_SOURCE_LABELS[l.source] : "",
        safeText(l.name),
        safeText(l.company),
        safeText(l.email),
        safeText(l.phone),
        l.need ? LEAD_NEED_LABELS[l.need] : "",
        l.stage ? LEAD_STAGE_LABELS[l.stage] : "",
        l.budget ? LEAD_BUDGET_LABELS[l.budget] : "",
        l.contactPreference ? LEAD_CONTACT_PREFERENCE_LABELS[l.contactPreference] : "",
        safeText(l.notes),
        safeText(a?.utmSource),
        safeText(a?.utmMedium),
        safeText(a?.utmCampaign),
        safeText(a?.utmTerm),
        safeText(a?.utmContent),
        a?.gclid,
        a?.gbraid,
        a?.wbraid,
        a?.fbclid,
        a?.landingPath,
        l.consent,
        l.privacyVersion,
        l.qualifiedAt,
        l.wonAt,
        l.value,
        safeText(l.lostReason),
      ]),
    );
  }
  return "﻿" + lines.join("\r\n") + "\r\n";
}
