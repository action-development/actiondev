import Image from "next/image";
import Link from "next/link";
import { GENERIC_WHATSAPP_TEXT, whatsappHref } from "@/lib/leads/whatsapp";
import { navigatesWithinMobileTree } from "@/lib/mobile-v2";
import { Icon } from "./Icon";
import { MobileMenu } from "./MobileMenu";
import { MOBILE_NAV, PROJECT_CTA_HREF } from "./nav";

/**
 * Cabecera de la web móvil v2 (DESIGN.md §7, `.hdr`): 60 px, filete de 2 px,
 * logo de tinta (34 px de alto) | WhatsApp en una celda de 60 × 60 | «MENÚ»
 * en negro. NO es fija: la barra inferior (`StickyCta`) ya da acceso
 * permanente.
 *
 * En landings de anuncios: `menu={false}` y `logoHref={null}` (logo sin enlace,
 * para que el tráfico de pago no se escape de la landing).
 */
export function MobileHeader({
  whatsappText = GENERIC_WHATSAPP_TEXT,
  menu = true,
  logoHref = "/",
  ctaHref = PROJECT_CTA_HREF,
}: {
  /** Mensaje precargado de WhatsApp (sin datos personales ni emojis). */
  whatsappText?: string;
  /** `false` en landings de anuncios: logo y WhatsApp, sin menú. */
  menu?: boolean;
  /** Destino del logo; `null` = logo sin enlace. */
  logoHref?: string | null;
  /** Destino de «Contar mi proyecto» dentro del menú. */
  ctaHref?: string;
}) {
  const logo = (
    <Image
      src="/logos/logo-tinta.png"
      alt="Action Development"
      width={113}
      height={34}
      priority
      className="h-[34px] w-auto"
    />
  );

  return (
    <header data-testid="m-header" className="flex min-h-[60px] items-stretch border-b-2 border-ink bg-paper">
      {logoHref === null ? (
        <span className="mr-auto flex items-center px-4">{logo}</span>
      ) : (
        <Link href={logoHref} aria-label="Action Development, inicio" className="mr-auto flex items-center px-4">
          {logo}
        </Link>
      )}
      <a
        href={whatsappHref(whatsappText)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escribir por WhatsApp"
        data-testid="m-header-whatsapp"
        className="flex w-[60px] items-center justify-center border-l border-ink hover:bg-ink hover:text-paper active:bg-ink active:text-paper"
      >
        <Icon name="whatsapp" size={28} />
      </a>
      {menu && (
        <MobileMenu
          whatsappText={whatsappText}
          ctaHref={ctaHref}
          // Se decide AQUÍ (servidor): `MOBILE_V2*` no existen en el navegador.
          softHrefs={MOBILE_NAV.filter((item) => navigatesWithinMobileTree(item.href)).map((item) => item.href)}
        />
      )}
    </header>
  );
}
