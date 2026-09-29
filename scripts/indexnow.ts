/**
 * IndexNow — avisa a Bing, Yandex, Seznam, Naver… de URLs nuevas o cambiadas
 * de actiondev.es (un solo POST a api.indexnow.org lo reparte a todos). Bing
 * alimenta en parte la búsqueda de ChatGPT/Copilot, así que acorta lo que
 * tarda un cambio en aparecer ahí. Google NO participa en IndexNow.
 *
 * Uso:
 *   pnpm seo:indexnow                                   # todo el sitemap
 *   npx tsx scripts/indexnow.ts                         # ídem
 *   npx tsx scripts/indexnow.ts /blog/mi-post https://actiondev.es/contact
 *
 * Sin argumentos descarga https://actiondev.es/sitemap.xml y manda todos sus
 * <loc>. Con argumentos manda solo esas URLs (rutas relativas o absolutas del
 * mismo host). Ejecutarlo DESPUÉS de desplegar: el buscador rastrea la URL al
 * recibir el aviso.
 *
 * La clave es pública por diseño: se verifica en `keyLocation`, servida desde
 * `apps/desktop/public/<clave>.txt`. Si se cambia, cambiar los dos sitios.
 */

const HOST = "actiondev.es";
const ORIGIN = `https://${HOST}`;
const KEY = "ae0fe17c76258830bbabcdaa2a1365de";
const KEY_LOCATION = `${ORIGIN}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";
/** Límite del protocolo por petición. */
const MAX_URLS = 10_000;

function normalize(input: string): string {
  const url = new URL(input, ORIGIN);
  if (url.host !== HOST) {
    throw new Error(`URL fuera de ${HOST}: ${input}`);
  }
  return url.toString();
}

async function sitemapUrls(): Promise<string[]> {
  const res = await fetch(`${ORIGIN}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap.xml respondió ${res.status}`);
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) =>
    m[1].replace(/&amp;/g, "&"),
  );
  if (urls.length === 0) throw new Error("sitemap.xml sin <loc>");
  return urls;
}

async function main() {
  const args = process.argv.slice(2);
  const raw = args.length > 0 ? args : await sitemapUrls();
  const urlList = [...new Set(raw.map(normalize))];

  for (let i = 0; i < urlList.length; i += MAX_URLS) {
    const batch = urlList.slice(i, i + MAX_URLS);
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: batch }),
    });
    // 200 = recibido; 202 = recibido, clave pendiente de verificar. El resto
    // (400 formato, 403 clave no válida, 422 URL de otro host, 429 spam) es error.
    const body = await res.text();
    console.log(`IndexNow ${res.status} — ${batch.length} URL(s)${body ? `: ${body}` : ""}`);
    if (res.status !== 200 && res.status !== 202) process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
