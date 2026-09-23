"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, readStoredConsent, storeConsent } from "@actiondev/shared";
import { useI18n } from "@/lib/i18n/context";

/**
 * Banner de consentimiento de la zona mobile. Visible mientras no haya una
 * decisión guardada (misma clave que desktop, vía `@actiondev/shared`).
 * Estilo propio de esta app — blanco, negro, minimalista — no el lenguaje
 * holográfico de desktop, que no existe aquí.
 *
 * Abajo a la izquierda y del tamaño de su contenido (no un `inset-x-0`
 * centrado a todo lo ancho), y `role="region"` en vez de `role="dialog"` —
 * mismo criterio que el gemelo de desktop, para no robar clicks a otro
 * elemento interactivo de la home ni colisionar con selectores de dialog.
 */
export function CookieConsent() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

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
      className="fixed bottom-4 left-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-4 border border-black bg-white p-5 text-black shadow-[4px_4px_0_0_#000]"
    >
      <p className="text-[13px] leading-relaxed">
        {t.cookieConsent.message}{" "}
        <Link href="/legal/cookies" className="underline underline-offset-2">
          {t.cookieConsent.linkLabel}
        </Link>
      </p>
      <div className="flex shrink-0 gap-3">
        <button
          type="button"
          onClick={() => storeConsent("denied")}
          data-testid="cookie-consent-reject"
          className="border border-black px-4 py-2 text-[11px] font-semibold uppercase tracking-wide"
        >
          {t.cookieConsent.reject}
        </button>
        <button
          type="button"
          onClick={() => storeConsent("granted")}
          data-testid="cookie-consent-accept"
          className="border border-black bg-black px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-white"
        >
          {t.cookieConsent.accept}
        </button>
      </div>
    </div>
  );
}
