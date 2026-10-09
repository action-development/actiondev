import { getPosts } from "@/lib/blog";
import { buildLlmsTxt } from "@/lib/llms";

/**
 * `/llms.txt` generado desde los datos (`lib/llms.ts`): valoración de
 * `GOOGLE_RATING`, landings, `/sobre-nosotros` y los posts PUBLICADOS. Revalida
 * cada hora como el sitemap y `/api/revalidate` lo refresca al publicar; si
 * Firestore falla, Next sigue sirviendo la última versión buena.
 */
export const revalidate = 3600;

export async function GET() {
  return new Response(buildLlmsTxt(await getPosts()), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
