"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, readStoredConsent, storeConsent } from "@actiondev/shared";
import { useT } from "@/lib/i18n";

/**
 * Banner de consentimiento (LSSI art. 22.2 / RGPD) — condición para que
 * `analytics/GoogleTagManager.tsx` cargue algo. Mismo lenguaje que
 * `layout/HoloBar.tsx` (franjas, fresnel, corchetes) pero `holo-solid`: lleva
 * texto largo sobre contenido de página y el cristal al 30 % lo dejaba
 * ilegible. En móvil, compacto (≤ ~140 px a 390 de ancho): menos padding,
 * 14 px y los dos botones en una fila de igual ancho.
 *
 * Abajo a la IZQUIERDA y del tamaño de su contenido (no un `inset-x-0`
 * centrado): el mando de la grúa (`overlays/RemoteControl.tsx`) vive abajo
 * al CENTRO del hero, y una franja invisible a todo lo ancho le robaba los
 * clicks aunque el banner solo se viera en el centro. `PlazaHint` ocupa
 * arriba-centro y el enlace a Google de `/resenas` abajo a la derecha — este
 * es el único hueco libre en las tres pantallas donde importa.
 *
 * `role="region"`, NO `role="dialog"`: no atrapa foco (`aria-modal` no
 * aplicaría) y la ficha de reseña de `/resenas` ya usa `role="dialog"` — un
 * segundo dialog rompía cualquier selector `[role="dialog"]` de los tests
 * (`Error: strict mode violation ... resolved to 2 elements`).
 *
 * «Rechazar» y «Aceptar» llevan EXACTAMENTE la misma clase (`holo-btn-solid`):
 * la guía de cookies de la AEPD pide que rechazar sea tan visible como aceptar,
 * y a «Rechazar» más apagado se le llama patrón engañoso. No volver a `quiet`.
 *
 * En `/hablemos/*` y por debajo de `sm` el banner es COMPACTO (≤ 76 px a 390):
 * una línea de texto + enlace y los dos botones en otra. El formulario de
 * campaña tiene su «Siguiente» justo encima de la esquina del banner y, con la
 * variante normal (~128 px), lo tapaba entero.
 *
 * Visible mientras no haya una decisión guardada. `resetConsent()` (llamado
 * desde el Footer y desde `/legal/cookies`) la vuelve a mostrar sin recargar
 * la página — por eso escucha el mismo evento que escribe.
 */
/** UNA sola clase para los dos botones: misma variante, tamaño y peso. */
const BUTTON_CLASS = "holo-btn holo-btn-solid holo-btn-sm flex-1 sm:flex-none";

export function CookieConsent() {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const compact = usePathname()?.startsWith("/hablemos") ?? false;

  useEffect(() => {
    const sync = () => setVisible(readStoredConsent() === null);
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label={t.cookieConsent.ariaLabel}
      data-testid="cookie-consent"
      data-compact={compact}
      className={`holo-surface holo-solid holo-corners bg-background fixed bottom-2 left-2 z-[70] flex w-[calc(100%-1rem)] max-w-sm flex-col sm:bottom-4 sm:left-4 sm:w-[calc(100%-2rem)] sm:gap-4 sm:p-5 ${
        compact ? "gap-1.5 p-2" : "gap-2.5 p-3"
      }`}
    >
      <p
        className={`text-foreground/85 sm:text-[13px] sm:leading-relaxed ${
          compact ? "text-[11px] leading-[15px]" : "text-sm leading-snug"
        }`}
      >
        {compact ? (
          <>
            <span className="sm:hidden">{t.cookieConsent.compactMessage}</span>
            <span className="hidden sm:inline">{t.cookieConsent.message}</span>
          </>
        ) : (
          t.cookieConsent.message
        )}{" "}
        <Link href="/legal/cookies" className="link-sweep holo-tint">
          {compact ? (
            <>
              <span className="sm:hidden">{t.cookieConsent.compactLinkLabel}</span>
              <span className="hidden sm:inline">{t.cookieConsent.linkLabel}</span>
            </>
          ) : (
            t.cookieConsent.linkLabel
          )}
        </Link>
      </p>
      <div className="flex shrink-0 gap-2 sm:gap-3">
        <button
          type="button"
          className={BUTTON_CLASS}
          onClick={() => storeConsent("denied")}
          data-testid="cookie-consent-reject"
        >
          {t.cookieConsent.reject}
        </button>
        <button
          type="button"
          className={BUTTON_CLASS}
          onClick={() => storeConsent("granted")}
          data-testid="cookie-consent-accept"
        >
          {t.cookieConsent.accept}
        </button>
      </div>
    </div>
  );
}
