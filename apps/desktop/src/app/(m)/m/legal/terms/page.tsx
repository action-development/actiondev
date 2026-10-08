import { TERMS_HEADER, TERMS_JSON_LD, TERMS_METADATA, TermsBody } from "@/components/legal/docs/terms";
import { LegalDocPage } from "@/components/m/legal/LegalDocPage";
import { MobileLegalProse } from "@/components/m/legal/LegalSlots";

/**
 * Términos y condiciones en la web móvil v2. Metadatos, JSON-LD, cabecera y TEXTO salen de
 * `components/legal/docs/terms.tsx`, la misma fuente que escritorio: un
 * cambio allí cambia las dos versiones.
 */
export const metadata = TERMS_METADATA;

export default function MobileTermsPage() {
  return (
    <LegalDocPage href="/legal/terms" header={TERMS_HEADER} jsonLd={TERMS_JSON_LD}>
      <TermsBody Prose={MobileLegalProse} />
    </LegalDocPage>
  );
}
