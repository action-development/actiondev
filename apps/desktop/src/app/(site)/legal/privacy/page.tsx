import { LegalDocHeader } from "@/components/legal/LegalDocHeader";
import { LegalProse } from "@/components/legal/LegalSlots";
import { PRIVACY_HEADER, PRIVACY_JSON_LD, PRIVACY_METADATA, PrivacyBody } from "@/components/legal/docs/privacy";

/**
 * Política de privacidad (escritorio). Metadatos, JSON-LD, cabecera y texto viven en
 * `components/legal/docs/privacy.tsx`, compartidos con la web móvil v2: el
 * contenido se cambia allí (y `LEGAL_UPDATED` en `lib/seo.ts`).
 */
export const metadata = PRIVACY_METADATA;

export default function PrivacyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PRIVACY_JSON_LD) }}
      />

      <LegalDocHeader {...PRIVACY_HEADER} />

      <PrivacyBody Prose={LegalProse} />
    </>
  );
}
