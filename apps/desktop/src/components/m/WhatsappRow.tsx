import { whatsappHref } from "@/lib/leads/whatsapp";
import { Icon } from "./Icon";
import { PHONE_SHORT } from "./nav";

/**
 * Fila negra «Escribir por WhatsApp» con el número (DESIGN.md §7, «Hero de
 * inicio»), justo debajo del bloque lima del hero. Enlace `wa.me` real con el
 * mensaje precargado (nunca `tel:`: el número solo atiende WhatsApp). La usan
 * el hero de la home y el de las landings SEO.
 */
export function WhatsappRow({ text, "data-testid": testId }: { text: string; "data-testid"?: string }) {
  return (
    <a
      href={whatsappHref(text)}
      target="_blank"
      rel="noopener noreferrer"
      data-testid={testId}
      className="on-ink group flex min-h-[58px] items-center gap-3 bg-ink px-4 py-2 text-paper hover:bg-paper hover:text-ink active:bg-paper active:text-ink"
    >
      <Icon name="whatsapp" size={28} />
      <span className="min-w-0 font-display text-[19px] font-extrabold uppercase leading-[1.05] tracking-[0.05em]">
        Escribir por WhatsApp
      </span>
      <span className="ml-auto whitespace-nowrap font-display text-base font-bold tracking-[0.04em] text-muted-dark group-hover:text-muted group-active:text-muted">
        {PHONE_SHORT}
      </span>
    </a>
  );
}
