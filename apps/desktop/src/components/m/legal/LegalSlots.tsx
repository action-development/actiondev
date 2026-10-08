import type { ReactNode } from "react";
import { LEGAL_ENTITY_ROWS, formatLegalDate, type LegalEntityRow } from "@/components/legal/legal-entity";
import { GENERIC_WHATSAPP_TEXT, whatsappHref } from "@/lib/leads/whatsapp";

/**
 * Huecos de los documentos legales (`components/legal/docs/*`, el MISMO texto
 * que escritorio) pintados con el sistema móvil: la prosa en `.m-prose`
 * (mobile.css) y la ficha del titular como celdas a sangre.
 */
export function MobileLegalProse({ children }: { children: ReactNode }) {
  return <div className="m-prose px-4 pt-8 pb-10">{children}</div>;
}

const valueClass = "text-[17px] font-semibold leading-[1.35] break-words";

function EntityValue({ row }: { row: LegalEntityRow }) {
  switch (row.kind) {
    case "date":
      return <time dateTime={row.value}>{formatLegalDate(row.value)}</time>;
    case "email":
      return (
        <a href={`mailto:${row.value}`} className="underline decoration-2 underline-offset-4 active:bg-lime">
          {row.value}
        </a>
      );
    case "phone":
      // Mismo número que escritorio, pero a WhatsApp: el número solo atiende WhatsApp (nunca `tel:` en el móvil).
      return (
        <a
          href={whatsappHref(GENERIC_WHATSAPP_TEXT)}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-2 underline-offset-4 active:bg-lime"
        >
          {row.value}
        </a>
      );
    default:
      return row.value;
  }
}

/**
 * Ficha identificativa del titular (art. 10 LSSI-CE): `<dl>` (legible por
 * lectores de pantalla y copiable) en celdas etiqueta/valor a sangre, con el
 * valor en texto normal, no en caja alta: son datos para copiar y cotejar
 * contra el Registro Mercantil.
 */
export function MobileLegalEntity() {
  return (
    <dl data-testid="m-legal-entity" className="grid gap-px border-y-2 border-ink bg-ink">
      {LEGAL_ENTITY_ROWS.map((row) => (
        <div key={row.label} className="grid gap-1.5 bg-paper px-4 pt-3.5 pb-4">
          <dt className="font-display text-label uppercase text-muted">{row.label}</dt>
          <dd className={valueClass}>
            <EntityValue row={row} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
