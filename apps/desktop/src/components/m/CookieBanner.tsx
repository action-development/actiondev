"use client";

import { storeConsent } from "@actiondev/shared";
import { MLink } from "./MLink";
import { useConsentDecision } from "./useConsentDecision";

/**
 * UNA clase para los dos botones (guía de cookies de la AEPD: rechazar tan
 * visible como aceptar; uno más apagado es patrón engañoso). No separarlas.
 */
const BUTTON_CLASS =
  "flex min-h-11 items-center justify-center bg-ink px-4 font-display text-[17px] font-extrabold uppercase leading-none tracking-[0.06em] text-paper hover:bg-lime hover:text-ink active:translate-y-px active:bg-lime active:text-ink";

/**
 * Banner de cookies de la web móvil v2: misma lógica que `ui/CookieConsent.tsx`
 * de escritorio (`readStoredConsent`/`storeConsent` de shared, misma clave de
 * `localStorage`: decidir en un árbol vale para el otro), piel nueva. Fijo
 * abajo, a sangre, ≤ 120 px de alto a 390 px (medido en `e2e/mobile.spec.ts`).
 * Mientras está abierto, la barra fija (`StickyCta`) no aparece.
 *
 * `role="region"` y no `dialog`: no atrapa el foco ni bloquea la página.
 * Mismos `data-testid` que el de escritorio.
 */
export function CookieBanner() {
  const consent = useConsentDecision();
  if (consent !== null) return null;

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      data-testid="cookie-consent"
      className="fixed inset-x-0 bottom-0 z-70 grid gap-2 border-t-2 border-ink bg-paper px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] text-ink"
    >
      <p className="text-sm leading-[1.35]">
        Usamos cookies de analítica y de medición de campañas (Google y Meta) solo si las aceptas.{" "}
        <MLink href="/legal/cookies" className="font-semibold underline underline-offset-2">
          Política de cookies
        </MLink>
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={BUTTON_CLASS} onClick={() => storeConsent("denied")} data-testid="cookie-consent-reject">
          Rechazar
        </button>
        <button type="button" className={BUTTON_CLASS} onClick={() => storeConsent("granted")} data-testid="cookie-consent-accept">
          Aceptar
        </button>
      </div>
    </div>
  );
}
