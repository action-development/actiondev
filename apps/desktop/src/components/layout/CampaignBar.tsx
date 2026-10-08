"use client";

import { WhatsappIcon } from "@/components/icons/channel-icons";
import { HoloButton } from "@/components/ui/HoloButton";
import { useCampaignWhatsappHref } from "@/components/leads/useCampaignWhatsapp";

/**
 * Barra de las landings de campaña (`/hablemos/*`). Client solo para leer la
 * ruta y precargar en WhatsApp el mensaje de la oferta (`whatsappTexts`).
 *
 * Al contrario que `HoloBar`, el logo NO es un enlace: quien llega de un
 * anuncio no tiene que poder salir al juego de la home. Lo único que ofrece es
 * hablar por WhatsApp. Sin barrido ni parpadeo: esta página existe para pintar
 * al instante y para que el formulario sea lo único que se mueve.
 */
export function CampaignBar({ whatsappTexts }: { whatsappTexts: Record<string, string> }) {
  const whatsappHref = useCampaignWhatsappHref(whatsappTexts);
  return (
    <header className="border-b border-border">
      <div className="container-editorial flex h-16 items-center justify-between gap-4">
        <span className="holo-tint inline-flex items-center gap-2.5 text-base font-bold tracking-tight">
          <span className="holo-led" aria-hidden />
          Action
        </span>
        <HoloButton href={whatsappHref} variant="quiet" data-testid="campaign-whatsapp">
          <WhatsappIcon className="h-4 w-4 shrink-0" />
          WhatsApp
        </HoloButton>
      </div>
    </header>
  );
}
