import {
  BUSINESS,
  LEAD_BUDGET_LABELS,
  LEAD_CONTACT_PREFERENCE_LABELS,
  LEAD_NEED_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STAGE_LABELS,
  toE164,
} from "@actiondev/shared";
import type { ParsedLead } from "./parse";

/**
 * Texto del aviso inmediato (email y Telegram). Puro y sin dependencias de
 * servidor: `notify.ts` lo manda; aquí solo se redacta.
 */

export const ADMIN_LEADS_URL = `${BUSINESS.domain}/admin/leads`;

const ATTRIBUTION_LABELS: Record<string, string> = {
  utmSource: "utm_source",
  utmMedium: "utm_medium",
  utmCampaign: "utm_campaign",
  utmTerm: "utm_term",
  utmContent: "utm_content",
  gclid: "gclid",
  gbraid: "gbraid",
  wbraid: "wbraid",
  fbclid: "fbclid",
  landingPath: "Página",
};

/** Dígitos para `wa.me` (con prefijo de país); sin E.164 fiable, los dígitos tal cual. */
function whatsappDigits(phone: string): string {
  return (toE164(phone) ?? phone).replace(/\D/g, "");
}

export function leadSubject(lead: ParsedLead): string {
  const need = lead.need ? LEAD_NEED_LABELS[lead.need] : LEAD_SOURCE_LABELS[lead.source];
  const budget = lead.budget ? LEAD_BUDGET_LABELS[lead.budget] : "sin presupuesto";
  return `Nuevo lead · ${need} · ${budget} · ${lead.name ?? lead.phone}`;
}

export function leadEmailText(lead: ParsedLead, id: string): string {
  const e164 = toE164(lead.phone);
  const lines: string[] = [`Nuevo lead (${LEAD_SOURCE_LABELS[lead.source]})`, ""];

  if (lead.name) lines.push(`Nombre: ${lead.name}`);
  if (lead.company) lines.push(`Empresa: ${lead.company}`);
  lines.push(`Teléfono: ${lead.phone}`, `  Llamar: tel:${e164 ?? lead.phone.replace(/[^\d+]/g, "")}`);
  lines.push(`  WhatsApp: https://wa.me/${whatsappDigits(lead.phone)}`);
  if (lead.email) lines.push(`Email: ${lead.email}`, `  Escribir: mailto:${lead.email}`);
  lines.push("");
  if (lead.need) lines.push(`Necesita: ${LEAD_NEED_LABELS[lead.need]}`);
  if (lead.stage) lines.push(`En qué punto está: ${LEAD_STAGE_LABELS[lead.stage]}`);
  if (lead.budget) lines.push(`Presupuesto orientativo: ${LEAD_BUDGET_LABELS[lead.budget]}`);
  if (lead.contactPreference) {
    lines.push(`Prefiere que le contactemos por: ${LEAD_CONTACT_PREFERENCE_LABELS[lead.contactPreference]}`);
  }
  if (lead.offer) lines.push(`Oferta de la landing: ${lead.offer}`);
  lines.push("", "Mensaje:", lead.notes || "(sin mensaje)", "");

  const attribution = Object.entries(lead.attribution);
  lines.push("Atribución:");
  if (attribution.length === 0) lines.push("  (sin parámetros de campaña)");
  for (const [key, value] of attribution) lines.push(`  ${ATTRIBUTION_LABELS[key] ?? key}: ${value}`);
  lines.push("", `Cookies del visitante: ${lead.consent}`, `ID: ${id}`, "", `Panel: ${ADMIN_LEADS_URL}`);

  return lines.join("\n");
}

/** Resumen corto para Telegram. */
export function leadTelegramText(lead: ParsedLead): string {
  const parts = [
    `Nuevo lead · ${lead.need ? LEAD_NEED_LABELS[lead.need] : LEAD_SOURCE_LABELS[lead.source]}`,
    lead.name && `${lead.name}${lead.company ? ` (${lead.company})` : ""}`,
    `Tel: ${lead.phone}`,
    lead.budget && `Presupuesto: ${LEAD_BUDGET_LABELS[lead.budget]}`,
    lead.contactPreference && `Prefiere: ${LEAD_CONTACT_PREFERENCE_LABELS[lead.contactPreference]}`,
    `WhatsApp: https://wa.me/${whatsappDigits(lead.phone)}`,
    ADMIN_LEADS_URL,
  ];
  return parts.filter(Boolean).join("\n");
}
