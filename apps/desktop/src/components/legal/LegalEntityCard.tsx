import { Fragment } from "react";
import { BUSINESS } from "@/lib/seo";
import { LEGAL_ENTITY_ROWS, formatLegalDate, type LegalEntityRow } from "./legal-entity";

/**
 * Ficha identificativa del titular (art. 10 LSSI-CE).
 *
 * Es el bloque que un organismo público o un departamento de compliance viene
 * a buscar: razón social, CIF y datos registrales para cruzar contra el
 * Registro Mercantil. Se renderiza como <dl> para que sea legible por
 * lectores de pantalla y copiable sin arrastrar maquetación. Los datos salen
 * de `legal-entity.ts`, los mismos que la ficha de la web móvil v2.
 */

export function LegalEntityCard() {
  return (
    <div className="legal-data">
      <dl>
        {LEGAL_ENTITY_ROWS.map((row) => (
          <Fragment key={row.label}>
            <dt>{row.label}</dt>
            <dd>
              <EntityValue row={row} />
            </dd>
          </Fragment>
        ))}
      </dl>
    </div>
  );
}

function EntityValue({ row }: { row: LegalEntityRow }) {
  switch (row.kind) {
    case "date":
      return <time dateTime={row.value}>{formatLegalDate(row.value)}</time>;
    case "email":
      return (
        <a href={`mailto:${row.value}`} className="link-sweep hover:text-accent">
          {row.value}
        </a>
      );
    case "phone":
      return (
        <a href={`tel:${BUSINESS.phoneE164}`} className="link-sweep hover:text-accent">
          {row.value}
        </a>
      );
    default:
      return row.value;
  }
}
