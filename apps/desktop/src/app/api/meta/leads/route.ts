import { after, NextResponse } from "next/server";
import { safeEqual, verifyMetaSignature } from "@/lib/leads/meta-auth";
import { extractLeadgenEvents, ingestLeadgenEvents } from "@/lib/leads/meta-ingest";

/**
 * Webhook de Meta (Lead Ads, objeto `page`, campo `leadgen`).
 *
 * - GET: verificación de la suscripción (`hub.mode=subscribe`,
 *   `hub.verify_token` == `META_WEBHOOK_VERIFY_TOKEN` en tiempo constante →
 *   devuelve `hub.challenge` en texto plano).
 * - POST: evento firmado. `X-Hub-Signature-256` se comprueba con
 *   `META_APP_SECRET` sobre el cuerpo CRUDO; se responde 200 al momento y el
 *   lead se lee y se mete en el pipeline dentro de `after()` (Firestore →
 *   email/Telegram → ERP, ver `lib/leads/meta-ingest.ts`).
 *
 * Si algo falla dentro de `after()`, `/api/meta/leads/sync` (cron de GitHub
 * cada 10 min) lo recoge: el webhook es la vía rápida, no la única.
 * Fuera del middleware de la web móvil (su matcher excluye `api`).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Un evento `leadgen` ocupa < 1 KB; Meta agrupa como mucho unos pocos. */
const MAX_BODY_BYTES = 256 * 1024;

const json = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

const text = (body: string, status: number) =>
  new Response(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });

export function GET(request: Request) {
  const expected = process.env.META_WEBHOOK_VERIFY_TOKEN;
  if (!expected) return text("not_configured", 503);

  const params = new URL(request.url).searchParams;
  const challenge = params.get("hub.challenge") ?? "";
  if (params.get("hub.mode") !== "subscribe" || !safeEqual(params.get("hub.verify_token"), expected)) {
    return text("forbidden", 403);
  }
  // Meta manda un número; solo se devuelve algo con esa forma (nada de HTML reflejado).
  if (!/^[A-Za-z0-9._-]{1,256}$/.test(challenge)) return text("invalid_challenge", 400);
  return text(challenge, 200);
}

export async function POST(request: Request) {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error("[meta-leads] META_APP_SECRET no configurado: webhook cerrado");
    return json({ ok: false, error: "not_configured" }, 503);
  }

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return json({ ok: false, error: "too_large" }, 413);
  const raw = new Uint8Array(await request.arrayBuffer());
  if (raw.byteLength > MAX_BODY_BYTES) return json({ ok: false, error: "too_large" }, 413);

  if (!verifyMetaSignature(raw, request.headers.get("x-hub-signature-256"), appSecret)) {
    return json({ ok: false, error: "invalid_signature" }, 401);
  }

  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const events = extractLeadgenEvents(body);
  if (events.length > 0) {
    after(async () => {
      const counts = await ingestLeadgenEvents(events);
      if (counts.error > 0 || counts.invalid > 0) {
        console.error("[meta-leads] webhook con incidencias:", counts);
      }
    });
  }
  return json({ ok: true, received: events.length });
}
