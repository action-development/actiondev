import type { Viewport } from "next";
import { CampaignBar } from "@/components/layout/CampaignBar";
import { LegalLinks } from "@/components/layout/LegalLinks";
import { StickyCta } from "@/components/leads/StickyCta";
import { adsLandings } from "@/data/ads-landings";
import { GENERIC_WHATSAPP_TEXT, whatsappHref } from "@/lib/leads/whatsapp";
import { BUSINESS, LEGAL_ENTITY, OFFICE_ADDRESS_LINE, REGISTERED_ADDRESS_LINE } from "@/lib/seo";

/**
 * Layout de las landings de campaña (Google Ads / Meta Ads): barra y pie
 * propios, sin Header ni salidas al juego. Ver `[PÁGINAS]` → `/hablemos/*`.
 *
 * El root layout sigue envolviendo (GTM tras consentimiento, banner de
 * cookies…), pero aquí no entra ni Lenis ni GSAP ni 3D, y `PageTransition` y
 * `ContactPopup` se apartan de `/hablemos` por su cuenta.
 */

// `cover` hace que `env(safe-area-inset-bottom)` valga algo en iPhone: lo usa
// la barra fija de móvil para no quedar bajo el indicador de inicio.
export const viewport: Viewport = { viewportFit: "cover" };

/** `slug de oferta → mensaje de WhatsApp`, para la barra y la barra fija (client). */
const whatsappTexts = Object.fromEntries(adsLandings.map((l) => [l.slug, l.whatsappText]));

export default function HablemosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CampaignBar whatsappTexts={whatsappTexts} />
      {children}
      <footer className="border-t border-border pb-24 lg:pb-0">
        <div className="container-editorial flex flex-col gap-6 pt-10 pb-5 text-sm text-muted md:flex-row md:justify-between">
          <div className="flex flex-col gap-1.5">
            <p>
              Action Development es una marca de {LEGAL_ENTITY.name} · CIF {LEGAL_ENTITY.taxId}
            </p>
            <p>Oficina: {OFFICE_ADDRESS_LINE}</p>
            <p>Domicilio social: {REGISTERED_ADDRESS_LINE}</p>
          </div>
          <div className="flex flex-col gap-1.5 md:items-end">
            <p>
              <a href={`mailto:${BUSINESS.email}`} data-testid="footer-email" className="link-sweep hover:text-accent">
                {BUSINESS.email}
              </a>
            </p>
            <p>
              <a
                href={whatsappHref(GENERIC_WHATSAPP_TEXT)}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="footer-whatsapp"
                className="link-sweep hover:text-accent"
              >
                WhatsApp {BUSINESS.phoneDisplay}
              </a>
            </p>
          </div>
        </div>
        <LegalLinks
          className="container-editorial pb-10 font-mono text-xs uppercase tracking-widest text-muted"
          linkClassName="link-sweep uppercase tracking-widest hover:text-accent"
        />
      </footer>
      <StickyCta whatsappTexts={whatsappTexts} />
    </>
  );
}
