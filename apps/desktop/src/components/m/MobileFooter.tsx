import Image from "next/image";
import { BUSINESS, LEGAL_ENTITY, REGISTERED_ADDRESS_LINE } from "@actiondev/shared";
import { GENERIC_WHATSAPP_TEXT, whatsappHref } from "@/lib/leads/whatsapp";
import { Cell, Cells } from "./Cell";
import { CookiePreferencesButton } from "./CookiePreferencesButton";
import { MLink } from "./MLink";
import { LEGAL_LINKS, OFFICE_LINE } from "./nav";

const FOOTER_NAV = [
  { href: "/projects", label: "Proyectos" },
  { href: "/servicios", label: "Servicios" },
  { href: BUSINESS.mapsUrl, label: "Google" },
  { href: "/contact", label: "Contacto" },
] as const;

const legalLinkClass =
  "font-display text-[13px] font-bold uppercase tracking-[0.1em] hover:text-paper hover:underline active:text-paper";

/**
 * Pie de la web móvil v2 (DESIGN.md §7, `.ftr`), sobre tinta: logo en papel a
 * todo el ancho → oficina, WhatsApp y email → cuatro enlaces 2 × 2 →
 * titularidad (LSSI art. 10: razón social, CIF, registro, oficina y domicilio
 * social) y enlaces legales con «Preferencias de cookies».
 *
 * `variant="minimal"` en landings de anuncios: sin logo grande ni navegación.
 * `withBar` (por defecto) reserva abajo el alto de la barra fija + safe area,
 * para que `StickyCta` no tape los enlaces legales.
 */
export function MobileFooter({
  variant = "full",
  withBar = true,
  whatsappText = GENERIC_WHATSAPP_TEXT,
}: {
  variant?: "full" | "minimal";
  withBar?: boolean;
  whatsappText?: string;
}) {
  const wa = whatsappHref(whatsappText);
  return (
    <footer
      data-testid="m-footer"
      className={`on-ink bg-ink text-paper ${withBar ? "pb-[calc(var(--spacing-bar)+env(safe-area-inset-bottom))]" : ""}`}
    >
      {variant === "full" && (
        <div className="border-b border-line-dark px-4 pt-8 pb-7">
          <Image
            src="/logos/logo-papel.png"
            alt="Action Development"
            width={900}
            height={271}
            sizes="(max-width: 480px) calc(100vw - 32px), 448px"
            className="h-auto w-full"
          />
        </div>
      )}

      <Cells dark className="border-b border-line-dark">
        <Cell label="Oficina" tone="ink" full>
          {OFFICE_LINE}
        </Cell>
        <Cell label="WhatsApp" tone="ink" href={wa} data-testid="m-footer-whatsapp">
          {BUSINESS.phoneDisplay}
        </Cell>
        <Cell label="Email" tone="ink" href={`mailto:${BUSINESS.email}`} data-testid="m-footer-email">
          <span className="normal-case">{BUSINESS.email}</span>
        </Cell>
      </Cells>

      {variant === "full" && (
        <nav aria-label="Pie de página" className="grid grid-cols-2 gap-px border-b border-line-dark bg-line-dark">
          {FOOTER_NAV.map((item) => (
            <MLink
              key={item.href}
              href={item.href}
              className="flex min-h-14 items-center bg-ink px-4 font-display text-xl font-extrabold uppercase hover:bg-paper hover:text-ink active:bg-paper active:text-ink"
            >
              {item.label}
            </MLink>
          ))}
        </nav>
      )}

      <div className="grid gap-2.5 px-4 pt-5 pb-7 text-sm leading-[1.45] text-muted-dark">
        <p>
          {LEGAL_ENTITY.tradeName} es el nombre comercial de {LEGAL_ENTITY.name}, CIF {LEGAL_ENTITY.taxId}, inscrita
          en el {LEGAL_ENTITY.registry.office}.
        </p>
        <p>Domicilio social: {REGISTERED_ADDRESS_LINE}.</p>
        <nav aria-label="Legal" data-testid="m-footer-legal">
          <ul className="flex flex-wrap gap-x-[18px] gap-y-2">
            {LEGAL_LINKS.map((item) => (
              <li key={item.href}>
                <MLink href={item.href} className={legalLinkClass}>
                  {item.label}
                </MLink>
              </li>
            ))}
            <li>
              <CookiePreferencesButton className={legalLinkClass} />
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
