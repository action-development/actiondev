import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// `/_next/` NO se bloquea: ahí viven el JS y el CSS que Googlebot necesita
// para renderizar (Google pide no bloquear recursos de render). `/api/og` es
// la imagen Open Graph: bloqueada, Twitterbot y compañía se quedan sin ella.
const DISALLOW = ["/api/", "/admin/"];
const ALLOW = ["/", "/api/og"];

// Crawlers de buscadores de IA — bienvenidos (AEO). Cada grupo propio ANULA
// al de `*` para ese bot, así que repite allow/disallow; si no, GPTBot y
// compañía rastrearían `/api/` y `/admin/`.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ALLOW, disallow: DISALLOW },
      { userAgent: AI_CRAWLERS, allow: ALLOW, disallow: DISALLOW },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
