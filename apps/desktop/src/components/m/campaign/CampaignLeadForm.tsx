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
  defaultNeed,
  needs = LEAD_NEEDS_CAMPAIGN,
  source,
  offer,
}: {
  id: string;
  defaultNeed: LeadNeed;
  needs?: readonly LeadNeed[];
  source: "ads_landing";
  offer: string;
}) {
  return (
    <MobileLeadForm id={id} defaultNeed={defaultNeed} needs={needs} source={source} offer={offer} compact />
  );
}
