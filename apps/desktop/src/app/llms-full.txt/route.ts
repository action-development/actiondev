import { getPosts } from "@/lib/blog";
import { buildLlmsFullTxt } from "@/lib/llms";

/**
 * `/llms-full.txt` (plan AEO, §4.7): el texto completo de `/sobre-nosotros`, las
 * landings y los casos con ficha, generado desde las mismas fuentes que la web
 * (`lib/llms.ts`). Mismo `revalidate` y webhook que `/llms.txt`.
 */
export const revalidate = 3600;

export async function GET() {
  return new Response(buildLlmsFullTxt(await getPosts()), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
