import "server-only";
import { LEGAL_UPDATED } from "@/lib/seo";
import { toErpPayload } from "./erp-payload";
import type { ParsedLead } from "./parse";

/**
 * Reenvío de cada lead nuevo al ERP interno (`POST /api/leads/inbound`). Se
 * llama desde `after()` del route handler: si falla solo se registra, nunca
 * rompe el envío (el lead ya está en Firestore). Sin `LEAD_ERP_URL` y
 * `LEAD_ERP_SECRET` no hace nada. El ERP deduplica por `externalId`, así que
 * reintentar es seguro.
 */

const TIMEOUT_MS = 8000;

/** `null` = error de red/timeout; si no, el status HTTP. */
async function post(url: string, secret: string, body: string): Promise<number | null> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-leads-secret": secret },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return response.status;
  } catch {
    return null;
  }
}

export async function forwardLeadToErp(lead: ParsedLead, id: string, createdAt: string): Promise<void> {
  const url = process.env.LEAD_ERP_URL;
  const secret = process.env.LEAD_ERP_SECRET;
  if (!url || !secret) return;

  try {
    const body = JSON.stringify(toErpPayload({ ...lead, privacyVersion: LEGAL_UPDATED }, id, createdAt));

    let status = await post(url, secret, body);
    // Un único reintento ante error de red o 5xx; los 4xx son definitivos.
    if (status === null || status >= 500) status = await post(url, secret, body);

    if (status === null || status >= 400) {
      console.error(`[lead] reenvío al ERP fallido: id=${id} status=${status ?? "network"}`);
    }
  } catch {
    console.error(`[lead] reenvío al ERP fallido: id=${id} status=error`);
  }
}
