import { AVISO_LEGAL_HEADER, AVISO_LEGAL_JSON_LD, AVISO_LEGAL_METADATA, AvisoLegalBody } from "@/components/legal/docs/aviso-legal";
import { LegalDocPage } from "@/components/m/legal/LegalDocPage";
import { MobileLegalEntity, MobileLegalProse } from "@/components/m/legal/LegalSlots";

/**
 * Aviso legal en la web móvil v2. Metadatos, JSON-LD, cabecera y TEXTO salen de
 * `components/legal/docs/aviso-legal.tsx`, la misma fuente que escritorio: un
 * cambio allí cambia las dos versiones.
 */
export const metadata = AVISO_LEGAL_METADATA;

export default function MobileAvisoLegalPage() {
  return (
    <LegalDocPage href="/legal/aviso-legal" header={AVISO_LEGAL_HEADER} jsonLd={AVISO_LEGAL_JSON_LD}>
      <AvisoLegalBody Prose={MobileLegalProse} EntityCard={MobileLegalEntity} />
    </LegalDocPage>
  );
}
