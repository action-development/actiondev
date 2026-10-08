import { LegalDocHeader } from "@/components/legal/LegalDocHeader";
import { LegalEntityCard } from "@/components/legal/LegalEntityCard";
import { LegalProse } from "@/components/legal/LegalSlots";
import { AVISO_LEGAL_HEADER, AVISO_LEGAL_JSON_LD, AVISO_LEGAL_METADATA, AvisoLegalBody } from "@/components/legal/docs/aviso-legal";

/**
 * Aviso legal (escritorio). Metadatos, JSON-LD, cabecera y texto viven en
 * `components/legal/docs/aviso-legal.tsx`, compartidos con la web móvil v2: el
 * contenido se cambia allí (y `LEGAL_UPDATED` en `lib/seo.ts`).
 */
export const metadata = AVISO_LEGAL_METADATA;

export default function AvisoLegalPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(AVISO_LEGAL_JSON_LD) }}
      />

      <LegalDocHeader {...AVISO_LEGAL_HEADER} />

      <AvisoLegalBody Prose={LegalProse} EntityCard={LegalEntityCard} />
    </>
  );
}
