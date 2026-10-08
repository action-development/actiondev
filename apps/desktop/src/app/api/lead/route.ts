import { after, NextResponse } from "next/server";
import { parseLeadRequest } from "@/lib/leads/parse";
import { isFirestoreConfigured, saveLead } from "@/lib/leads/firestore";
import { dispatchLead } from "@/lib/leads/dispatch";
import { allowRequest, clientIp } from "@/lib/leads/rate-limit";

/**
 * POST /api/lead — única puerta de entrada de leads (formulario cualificador de
 * `/hablemos/*`, landings SEO y «llámame tú» de `/contact`).
 *
 * Valida, guarda en Firestore por REST (sin SDK ni cuenta de servicio) y avisa
 * por email/Telegram y reenvía al ERP DESPUÉS de responder (`after`). El lead solo se da por
 * enviado si Firestore responde: si falla, 502.
 */

export const runtime = "nodejs";

/** Cuerpo máximo aceptado: el lead más largo cabe de sobra en 8 KB. */
const MAX_BODY_BYTES = 8 * 1024;

/** Tiempo mínimo desde que se monta el formulario hasta enviarlo. Un humano no baja de aquí. */
const MIN_ELAPSED_MS = 3000;
/** El «llámame tú» es un campo: un teléfono autocompletado + Enter puede tardar menos. */
const MIN_ELAPSED_CALLBACK_MS = 1000;

const json = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  // Misma origen: la web es la única que debería escribir aquí. Sin cabecera
  // `Origin` (curl, tests) se deja pasar; la defensa real es la validación.
  const origin = request.headers.get("origin");
  if (origin) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    let originHost: string | null = null;
    try {
      originHost = new URL(origin).host;
    } catch {
      /* origen mal formado → se rechaza abajo */
    }
    if (!host || originHost !== host) return json({ ok: false, error: "forbidden" }, 403);
  }

  if (!allowRequest(clientIp(request.headers))) {
    return json({ ok: false, error: "rate_limited" }, 429);
  }

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return json({ ok: false, error: "too_large" }, 413);
    body = JSON.parse(text);
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const parsed = parseLeadRequest(body);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, 400);
  const { lead, honeypot, elapsedMs } = parsed.value;

  // Bot (honeypot relleno o demasiado rápido): éxito FALSO y sin guardar, para
  // no darle pistas de qué lo ha delatado.
  const minElapsed = lead.source === "callback_form" ? MIN_ELAPSED_CALLBACK_MS : MIN_ELAPSED_MS;
  if (honeypot.trim() !== "" || elapsedMs === null || elapsedMs < minElapsed) {
    return json({ ok: true });
  }

  if (!isFirestoreConfigured()) {
    if (process.env.NODE_ENV === "production") {
      console.error("[lead] Firebase no configurado: el lead no se puede guardar");
      return json({ ok: false, error: "not_configured" }, 500);
    }
    console.info("[lead] Firebase no configurado, no se guarda (desarrollo):", {
      source: lead.source,
      need: lead.need,
    });
    return json({ ok: true, id: `dev-${Date.now()}` });
  }

  // Mismo instante en Firestore y en el ERP.
  const createdAt = new Date().toISOString();
  let id: string;
  try {
    id = await saveLead(lead, createdAt);
  } catch (error) {
    console.error("[lead] no se pudo guardar:", error instanceof Error ? error.message : error);
    return json({ ok: false, error: "storage_failed" }, 502);
  }

  after(() => dispatchLead(lead, id, createdAt));
  return json({ ok: true, id });
}
