import { headers } from "next/headers";
import type { Locale } from "./dictionaries";

const SPANISH_LANG_PREFIXES = ["es", "gl", "ca", "eu"];

/**
 * Español por defecto: el público objetivo (y Googlebot, que no envía
 * Accept-Language) debe recibir contenido en español. Solo servimos inglés
 * cuando el navegador lo pide explícitamente por delante del español.
 */
export function pickLocaleFromHeader(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return "es";

  const candidates = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, qPart] = part.trim().split(";");
      const q = qPart?.startsWith("q=") ? parseFloat(qPart.slice(2)) : 1;
      return { tag: tag.toLowerCase(), q: Number.isFinite(q) ? q : 1 };
    })
    .filter((c) => c.tag)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of candidates) {
    const primary = tag.split("-")[0];
    if (SPANISH_LANG_PREFIXES.includes(primary)) return "es";
    if (primary === "en") return "en";
  }

  return "es";
}

export async function detectLocale(): Promise<Locale> {
  const headerList = await headers();
  return pickLocaleFromHeader(headerList.get("accept-language"));
}
