"use client";

import { resetConsent } from "@actiondev/shared";

/**
 * «Preferencias de cookies»: borra la decisión guardada y el banner vuelve a
 * salir sin recargar (RGPD art. 7.3: retirar el consentimiento tan fácil como
 * darlo). Única isla cliente del pie.
 */
export function CookiePreferencesButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={resetConsent} className={className} data-testid="cookie-preferences-link">
      Preferencias de cookies
    </button>
  );
}
