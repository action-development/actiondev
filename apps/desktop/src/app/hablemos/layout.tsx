import type { Viewport } from "next";
import { CampaignBar } from "@/components/layout/CampaignBar";
import { LegalLinks } from "@/components/layout/LegalLinks";
import { StickyCta } from "@/components/leads/StickyCta";
import { BUSINESS } from "@/lib/seo";

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

export default function HablemosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CampaignBar />
      {children}
      <footer className="border-t border-border pb-24 lg:pb-0">
        <div className="container-editorial flex flex-col gap-2 pt-10 pb-5 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <p>Action es una marca de Alcasi Systems, S.L.</p>
          <p>
            {BUSINESS.address.street}, {BUSINESS.address.postalCode} {BUSINESS.address.locality}
          </p>
        </div>
        <LegalLinks
          className="container-editorial pb-10 font-mono text-xs uppercase tracking-widest text-muted"
          linkClassName="link-sweep uppercase tracking-widest hover:text-accent"
        />
      </footer>
      <StickyCta />
    </>
  );
}
