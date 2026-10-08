import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Comprobaciones de las rutas de Meta, en tiempo constante. Puras (solo
 * `node:crypto`) para testearlas sin servidor.
 */

/** Secreto compartido: se comparan los SHA-256 (misma longitud siempre, no filtra la del secreto). */
export function safeEqual(provided: string | null | undefined, expected: string): boolean {
  if (!provided || !expected) return false;
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

const SIGNATURE_RE = /^sha256=([0-9a-f]{64})$/i;

/**
 * `X-Hub-Signature-256: sha256=<hex>` = HMAC-SHA256 del cuerpo CRUDO con el
 * secreto de la app. Se calcula sobre los bytes tal cual llegan (nunca sobre un
 * JSON re-serializado: Meta firma su versión con los unicode escapados).
 */
export function verifyMetaSignature(rawBody: Uint8Array, header: string | null | undefined, appSecret: string): boolean {
  if (!appSecret || !header) return false;
  const match = SIGNATURE_RE.exec(header.trim());
  if (!match) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody).digest();
  return timingSafeEqual(expected, Buffer.from(match[1], "hex"));
}
