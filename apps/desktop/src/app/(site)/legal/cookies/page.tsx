import { LegalDocHeader } from "@/components/legal/LegalDocHeader";
import { LegalProse } from "@/components/legal/LegalSlots";
import { COOKIES_HEADER, COOKIES_JSON_LD, COOKIES_METADATA, CookiesBody } from "@/components/legal/docs/cookies";

/**
 * Política de cookies (escritorio). Metadatos, JSON-LD, cabecera y texto viven en
 * `components/legal/docs/cookies.tsx`, compartidos con la web móvil v2: el
 * contenido se cambia allí (y `LEGAL_UPDATED` en `lib/seo.ts`).
 */
export const metadata = COOKIES_METADATA;

export default function CookiesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(COOKIES_JSON_LD) }}
      />

      <LegalDocHeader {...COOKIES_HEADER} />

      <CookiesBody Prose={LegalProse} />
    </>
  );
}
