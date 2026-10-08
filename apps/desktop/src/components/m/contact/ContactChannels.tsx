import { BUSINESS } from "@actiondev/shared";
import { GENERIC_WHATSAPP_TEXT, whatsappHref } from "@/lib/leads/whatsapp";
import { Cell, Cells } from "../Cell";
import { OFFICE_LINE } from "../nav";

/**
 * Canales directos de `/contact`: WhatsApp (con el mensaje ya escrito, nunca
 * `tel:`: el número solo atiende WhatsApp), email y la oficina con su enlace a
 * la ficha real de Google (`BUSINESS.mapsUrl`, NAP de `packages/shared`).
 * Cada celda entera es el enlace.
 *
 * WhatsApp en lima: es la superficie que más se pulsa (una de las ≤ 3 de la
 * pantalla, DESIGN.md §3).
 */
export function ContactChannels({ emailSubject, emailBody }: { emailSubject: string; emailBody: string }) {
  const mailto = `mailto:${BUSINESS.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  return (
    <Cells className="border-t-2 border-ink">
      <Cell label="WhatsApp" tone="lime" full href={whatsappHref(GENERIC_WHATSAPP_TEXT)} data-testid="m-contact-whatsapp">
        {BUSINESS.phoneDisplay}
      </Cell>
      <Cell label="Email" full href={mailto} data-testid="m-contact-email">
        <span className="normal-case">{BUSINESS.email}</span>
      </Cell>
      <Cell label="Oficina · Cómo llegar" tone="grey" full href={BUSINESS.mapsUrl} data-testid="m-contact-office">
        {OFFICE_LINE}
      </Cell>
    </Cells>
  );
}
