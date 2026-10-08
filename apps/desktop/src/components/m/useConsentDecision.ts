"use client";

import { useSyncExternalStore } from "react";
import { CONSENT_EVENT, readStoredConsent, type ConsentValue } from "@actiondev/shared";

function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_EVENT, onChange);
}

/**
 * Decisión de cookies guardada (`packages/shared/src/analytics.ts`), viva:
 * cambia al aceptar, rechazar o `resetConsent()` sin recargar.
 * `undefined` = aún no se sabe (servidor e hidratación); `null` = sin decidir
 * (banner abierto).
 */
export function useConsentDecision(): ConsentValue | null | undefined {
  return useSyncExternalStore<ConsentValue | null | undefined>(subscribe, readStoredConsent, () => undefined);
}
