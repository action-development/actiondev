/**
 * Límite por IP en memoria: 5 envíos cada 10 minutos. BEST-EFFORT: en
 * serverless cada instancia tiene su propio mapa y se pierde al reciclarla,
 * así que frena al bot ingenuo, no a uno distribuido (para eso, App Check o un
 * KV compartido). El honeypot y el tiempo mínimo hacen el resto.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;
const MAX_TRACKED_IPS = 5000;

const hits = new Map<string, number[]>();

export function clientIp(headers: Headers): string {
  // El primero de `x-forwarded-for` es el cliente; los siguientes, proxies.
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

/** `true` si esta petición cabe en el límite (y la apunta). */
export function allowRequest(ip: string, now = Date.now()): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_HITS) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);

  // Sin esto el mapa crecería con cada IP distinta mientras la instancia viva.
  if (hits.size > MAX_TRACKED_IPS) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return true;
}

/** Solo para tests. */
export function resetRateLimit(): void {
  hits.clear();
}
