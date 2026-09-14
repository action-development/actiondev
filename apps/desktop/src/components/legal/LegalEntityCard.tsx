import {
  BUSINESS,
  LEGAL_ENTITY,
  OFFICE_ADDRESS_LINE,
  REGISTERED_ADDRESS_LINE,
  REGISTRY_LINE,
  SITE_URL,
} from "@/lib/seo";

/**
 * Ficha identificativa del titular (art. 10 LSSI-CE).
 *
 * Es el bloque que un organismo público o un departamento de compliance viene
 * a buscar: razón social, CIF y datos registrales para cruzar contra el
 * Registro Mercantil. Se renderiza como <dl> para que sea legible por
 * lectores de pantalla y copiable sin arrastrar maquetación.
 */

const INCORPORATION_FORMATTER = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function LegalEntityCard() {
  return (
    <div className="legal-data">
      <dl>
        <dt>Marca comercial</dt>
        <dd>
          {BUSINESS.alternateName} ({BUSINESS.name})
        </dd>

        <dt>Titular / Razón social</dt>
        <dd>{LEGAL_ENTITY.name}</dd>

        <dt>NIF / CIF</dt>
        <dd>{LEGAL_ENTITY.taxId}</dd>

        <dt>Domicilio social</dt>
        <dd>{REGISTERED_ADDRESS_LINE}, España</dd>

        <dt>Oficina</dt>
        <dd>{OFFICE_ADDRESS_LINE}, España</dd>

        <dt>Datos registrales</dt>
        <dd>{REGISTRY_LINE}</dd>

        <dt>Constitución</dt>
        <dd>
          <time dateTime={LEGAL_ENTITY.incorporationDate}>
            {INCORPORATION_FORMATTER.format(
              new Date(`${LEGAL_ENTITY.incorporationDate}T00:00:00Z`)
            )}
          </time>
        </dd>

        <dt>Capital social</dt>
        <dd>{LEGAL_ENTITY.shareCapital}</dd>

        <dt>Correo electrónico</dt>
        <dd>
          <a href={`mailto:${BUSINESS.email}`} className="hover:text-accent">
            {BUSINESS.email}
          </a>
        </dd>

        <dt>Teléfono</dt>
        <dd>
          <a href={`tel:${BUSINESS.phoneE164}`} className="hover:text-accent">
            {BUSINESS.phoneDisplay}
          </a>
        </dd>

        <dt>Sitio web</dt>
        <dd>{SITE_URL}</dd>
      </dl>
    </div>
  );
}
