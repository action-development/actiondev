"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, readStoredConsent, storeConsent } from "@actiondev/shared";
import { useT } from "@/lib/i18n";

/**
 * Banner de consentimiento (LSSI art. 22.2 / RGPD) — condición para que
 * `analytics/GoogleTagManager.tsx` cargue algo. Mismo lenguaje que
 * `layout/HoloBar.tsx`: cápsula lima translúcida con corchetes en las
 * esquinas.
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
 * Visible mientras no haya una decisión guardada. `resetConsent()` (llamado
 * desde el Footer y desde `/legal/cookies`) la vuelve a mostrar sin recargar
 * la página — por eso escucha el mismo evento que escribe.
 */
export function CookieConsent() {
  const t = useT();
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
      className="holo-surface holo-corners holo-glass fixed bottom-4 left-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-4 p-5"
    >
      <p className="text-[13px] leading-relaxed text-foreground/85">
        {t.cookieConsent.message}{" "}
        <Link href="/legal/cookies" className="link-sweep holo-tint">
          {t.cookieConsent.linkLabel}
        </Link>
      </p>
      <div className="flex shrink-0 gap-3">
        <button
          type="button"
          className="holo-btn holo-btn-quiet holo-btn-sm"
          onClick={() => storeConsent("denied")}
          data-testid="cookie-consent-reject"
        >
          {t.cookieConsent.reject}
        </button>
        <button
          type="button"
          className="holo-btn holo-btn-solid holo-btn-sm"
          onClick={() => storeConsent("granted")}
          data-testid="cookie-consent-accept"
        >
          {t.cookieConsent.accept}
        </button>
      </div>
    </div>
  );
}
