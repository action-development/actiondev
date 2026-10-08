import { LegalDocHeader } from "@/components/legal/LegalDocHeader";
import { LegalProse } from "@/components/legal/LegalSlots";
import { TERMS_HEADER, TERMS_JSON_LD, TERMS_METADATA, TermsBody } from "@/components/legal/docs/terms";

/**
 * Términos y condiciones (escritorio). Metadatos, JSON-LD, cabecera y texto viven en
 * `components/legal/docs/terms.tsx`, compartidos con la web móvil v2: el
 * contenido se cambia allí (y `LEGAL_UPDATED` en `lib/seo.ts`).
 */
export const metadata = TERMS_METADATA;

export default function TermsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(TERMS_JSON_LD) }}
      />

      <LegalDocHeader {...TERMS_HEADER} />

      <TermsBody Prose={LegalProse} />
    </>
  );
}
