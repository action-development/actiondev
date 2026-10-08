import { COOKIES_HEADER, COOKIES_JSON_LD, COOKIES_METADATA, CookiesBody } from "@/components/legal/docs/cookies";
import { LegalDocPage } from "@/components/m/legal/LegalDocPage";
import { MobileLegalProse } from "@/components/m/legal/LegalSlots";

/**
 * Política de cookies en la web móvil v2. Metadatos, JSON-LD, cabecera y TEXTO salen de
 * `components/legal/docs/cookies.tsx`, la misma fuente que escritorio: un
 * cambio allí cambia las dos versiones.
 */
export const metadata = COOKIES_METADATA;

export default function MobileCookiesPage() {
  return (
    <LegalDocPage href="/legal/cookies" header={COOKIES_HEADER} jsonLd={COOKIES_JSON_LD}>
      <CookiesBody Prose={MobileLegalProse} />
    </LegalDocPage>
  );
}
