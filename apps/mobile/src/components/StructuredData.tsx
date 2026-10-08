import { organizationSchema, websiteSchema } from "@actiondev/shared";

/**
 * JSON-LD para la zona mobile. Con mobile-first indexing, esta versión es la
 * que Googlebot smartphone indexa para actiondev.es — debe emitir las mismas
 * señales locales (NAP, geo, área de servicio) que la versión desktop.
 *
 * Server component. Los @id (#organization, #website) coinciden con los de
 * desktop para que ambas versiones referencien las mismas entidades.
 */

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    // Mismo nodo que desktop (Organization + ProfessionalService), generado
    // desde @actiondev/shared para que las dos zonas no se desincronicen.
    organizationSchema(),
    websiteSchema(),
  ],
};

export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
