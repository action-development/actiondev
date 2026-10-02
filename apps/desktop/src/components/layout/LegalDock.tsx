"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, readStoredConsent, resetConsent } from "@actiondev/shared";
import { useT } from "@/lib/i18n";

/** Pantallas 3D a pantalla completa: sin pie de página donde poner `LegalLinks`. */
const FULLSCREEN_ROUTES = new Set(["/", "/projects", "/resenas", "/contact"]);

/**
 * Acceso legal de las pantallas 3D: aviso legal, privacidad y reabrir el
 * banner de cookies (LSSI art. 10, RGPD art. 7.3 — ver `LegalLinks`).
 *
 * Abajo a la izquierda, pegada al borde (decisión del cliente; antes iba
 * arriba a la izquierda bajo el Header). En escritorio esa esquina está libre
 * en las cuatro pantallas; por debajo de ~1220px roza la esquina del panel de
 * `/contact` (`bottom-6`, 640px centrado) y en estrecho choca con la ficha de
 * la recreativa. Es la esquina de `ui/CookieConsent.tsx`: solo aparece con el
 * consentimiento ya decidido, para no coincidir con el banner. "Cookies"
 * reabre ese banner, que enlaza a la política — de ahí que su nombre
 * accesible sea "Preferencias de cookies" (contiene el texto visible).
 */
export function LegalDock() {
  const t = useT();
  const pathname = usePathname();
  const [decided, setDecided] = useState(false);

  useEffect(() => {
    const sync = () => setDecided(readStoredConsent() !== null);
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  if (!decided || !FULLSCREEN_ROUTES.has(pathname)) return null;

  const linkClass = "link-sweep text-muted hover:text-accent";

  return (
    <nav
      aria-label={t.footer.legalTitle}
      data-testid="legal-dock"
      className="holo-surface holo-solid fixed bottom-0 left-0 z-[60] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em]"
    >
      <ul className="flex gap-4">
        <li>
          <Link href="/legal/aviso-legal" className={linkClass}>
            {t.footer.legalNotice}
          </Link>
        </li>
        <li>
          <Link href="/legal/privacy" className={linkClass}>
            {t.footer.legalPrivacy}
          </Link>
        </li>
        <li>
          <button
            type="button"
            onClick={resetConsent}
            aria-label={t.footer.cookiePreferences}
            className={`${linkClass} uppercase`}
            data-testid="legal-dock-cookies"
          >
            {t.footer.legalCookies}
          </button>
        </li>
      </ul>
    </nav>
  );
}
