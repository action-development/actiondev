import {
  BUSINESS,
  LEGAL_ENTITY,
  OFFICE_ADDRESS_LINE,
  REGISTERED_ADDRESS_LINE,
  REGISTRY_LINE,
  SITE_URL,
} from "@/lib/seo";

/**
 * Datos de la ficha identificativa del titular (art. 10 LSSI-CE), en UN solo
 * sitio para el aviso legal de escritorio (`LegalEntityCard`) y el de la web
 * móvil v2 (`components/m/legal`). `kind` dice cómo se enlaza el valor: el
 * email con `mailto:`, el teléfono según el árbol (escritorio `tel:`, móvil
 * WhatsApp: el número solo atiende WhatsApp) y la fecha en un `<time>`.
 */
export interface LegalEntityRow {
  label: string;
  value: string;
  kind?: "email" | "phone" | "date";
}

export const LEGAL_ENTITY_ROWS: readonly LegalEntityRow[] = [
  { label: "Marca comercial", value: `${BUSINESS.alternateName} (${BUSINESS.name})` },
  { label: "Titular / Razón social", value: LEGAL_ENTITY.name },
  { label: "NIF / CIF", value: LEGAL_ENTITY.taxId },
  { label: "Domicilio social", value: `${REGISTERED_ADDRESS_LINE}, España` },
  { label: "Oficina", value: `${OFFICE_ADDRESS_LINE}, España` },
  { label: "Datos registrales", value: REGISTRY_LINE },
  { label: "Constitución", value: LEGAL_ENTITY.incorporationDate, kind: "date" },
  { label: "Capital social", value: LEGAL_ENTITY.shareCapital },
  { label: "Correo electrónico", value: BUSINESS.email, kind: "email" },
  { label: "Teléfono", value: BUSINESS.phoneDisplay, kind: "phone" },
  { label: "Sitio web", value: SITE_URL },
];

const LEGAL_DATE = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** «8 de octubre de 2026» a partir de una fecha ISO (`yyyy-mm-dd`). */
export function formatLegalDate(iso: string): string {
  return LEGAL_DATE.format(new Date(`${iso}T00:00:00Z`));
}
