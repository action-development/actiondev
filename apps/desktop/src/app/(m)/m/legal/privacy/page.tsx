import { PRIVACY_HEADER, PRIVACY_JSON_LD, PRIVACY_METADATA, PrivacyBody } from "@/components/legal/docs/privacy";
import { LegalDocPage } from "@/components/m/legal/LegalDocPage";
import { MobileLegalProse } from "@/components/m/legal/LegalSlots";

/**
 * Política de privacidad en la web móvil v2. Metadatos, JSON-LD, cabecera y TEXTO salen de
 * `components/legal/docs/privacy.tsx`, la misma fuente que escritorio: un
 * cambio allí cambia las dos versiones.
 */
export const metadata = PRIVACY_METADATA;

export default function MobilePrivacyPage() {
  return (
    <LegalDocPage href="/legal/privacy" header={PRIVACY_HEADER} jsonLd={PRIVACY_JSON_LD}>
      <PrivacyBody Prose={MobileLegalProse} />
    </LegalDocPage>
  );
}
