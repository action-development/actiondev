"use client";

import Link from "next/link";
import { resetConsent } from "@actiondev/shared";
import { useT } from "@/lib/i18n";

export const LEGAL_DOCS = [
  { key: "legalNotice", href: "/legal/aviso-legal" },
  { key: "legalPrivacy", href: "/legal/privacy" },
  { key: "legalTerms", href: "/legal/terms" },
  { key: "legalCookies", href: "/legal/cookies" },
] as const;

/**
 * Documentos legales + reabrir el banner de cookies, para el pie de las
 * páginas de lectura (landings, `/servicios`, fichas de blog y de proyecto).
 *
 * Tiene que estar en TODA ruta: LSSI art. 10 (acceso permanente al aviso
 * legal) y RGPD art. 7.3 (retirar el consentimiento tan fácil como darlo).
 * `Footer.tsx` era el único sitio con estos enlaces y no lo monta ninguna
 * ruta; las pantallas 3D usan `LegalDock`.
 *
 * Client component solo por el botón de preferencias: los enlaces salen en el
 * HTML de servidor igual. Hereda tipografía y color del pie que lo contiene.
 */
export function LegalLinks({
  className,
  linkClassName,
}: {
  className?: string;
  linkClassName?: string;
}) {
  const t = useT();

  return (
    <nav aria-label={t.footer.legalTitle} className={className}>
      <ul className="flex flex-wrap gap-x-6 gap-y-2">
        {LEGAL_DOCS.map((doc) => (
          <li key={doc.href}>
            <Link href={doc.href} className={linkClassName}>
              {t.footer[doc.key]}
            </Link>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={resetConsent}
            className={linkClassName}
            data-testid="cookie-preferences-link"
          >
            {t.footer.cookiePreferences}
          </button>
        </li>
      </ul>
    </nav>
  );
}
