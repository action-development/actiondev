import { NextResponse } from "next/server";
import { safeEqual } from "@/lib/leads/meta-auth";
import { syncMetaLeads } from "@/lib/leads/meta-ingest";

/**
 * POST /api/meta/leads/sync?hours=48 — red de seguridad del webhook de Meta.
 * La llama el cron de GitHub (`.github/workflows/meta-leads-sync.yml`, cada
 * 10 min) con la cabecera `x-sync-secret` == `META_LEADS_SYNC_SECRET`.
 *
 * Recorre los formularios (`META_FORM_IDS` o todos los de `META_PAGE_ID`) y
 * mete en el pipeline los leads de las últimas `hours` (por defecto 72, máximo
 * 720 = 30 días). Idempotente: lo ya guardado no se vuelve a avisar. Devuelve
 * SOLO recuentos (el repo es público y el cron imprime el estado). 502 si hubo
 * errores de lectura o de guardado, para que el cron lo marque como fallido.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DEFAULT_HOURS = 72;
const MAX_HOURS = 720;

const json = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** `null` = parámetro no válido. Se acota a 1..720. */
function parseHours(value: string | null): number | null {
  if (value === null || value.trim() === "") return DEFAULT_HOURS;
  if (!/^\d{1,4}$/.test(value.trim())) return null;
  return Math.min(MAX_HOURS, Math.max(1, Number(value)));
}

export async function POST(request: Request) {
  const expected = process.env.META_LEADS_SYNC_SECRET;
  if (!expected) return json({ ok: false, error: "not_configured" }, 503);
  if (!safeEqual(request.headers.get("x-sync-secret"), expected)) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  const hours = parseHours(new URL(request.url).searchParams.get("hours"));
  if (hours === null) return json({ ok: false, error: "invalid_hours" }, 400);

  const result = await syncMetaLeads(hours);
  if (result.error === "not_configured") {
    console.error("[meta-leads] sync sin configurar (META_LEADS_TOKEN, META_PAGE_ID/META_FORM_IDS o Firebase)");
    return json({ ...result }, 503);
  }
  return json({ ...result }, result.ok ? 200 : 502);
}
