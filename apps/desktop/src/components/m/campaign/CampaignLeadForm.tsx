import { LEAD_NEEDS_CAMPAIGN, type LeadNeed } from "@actiondev/shared";
import { MobileLeadForm } from "../leads/MobileLeadForm";

/**
 * `MobileLeadForm` en su variante compacta de landing (`compact`, DESIGN.md
 * §7): el paso 1 entero —con «Siguiente»— cabe en la primera pantalla a
 * 390×844 bajo la cabecera y el hero, incluso con el banner de cookies
 * abierto (medido en `e2e/mobile-contact-hablemos.spec.ts`). Lógica, datos,
 * validación, envío y medición: los de `MobileLeadForm` (`useLeadForm`).
 */
export function CampaignLeadForm({
  id,
  privacyBelowSubmit,
  defaultNeed,
  needs = LEAD_NEEDS_CAMPAIGN,
  source,
  offer,
  whatsappText,
}: {
  id: string;
  /** Primera capa RGPD debajo del botón (UD-10, solo `/hablemos/*`): ver `MobileLeadForm`. */
  privacyBelowSubmit?: boolean;
  defaultNeed: LeadNeed;
  needs?: readonly LeadNeed[];
  source: "ads_landing";
  offer: string;
  /** Mensaje fijo de los WhatsApp del formulario (`AdsLanding.whatsappText`). */
  whatsappText?: string;
}) {
  return (
    <MobileLeadForm
      id={id}
      privacyBelowSubmit={privacyBelowSubmit}
      defaultNeed={defaultNeed}
      needs={needs}
      source={source}
      offer={offer}
      whatsappText={whatsappText}
      compact
    />
  );
}
