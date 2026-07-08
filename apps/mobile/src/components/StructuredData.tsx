import { BUSINESS } from "@actiondev/shared";

/**
 * JSON-LD para la zona mobile. Con mobile-first indexing, esta versión es la
 * que Googlebot smartphone indexa para actiondev.es — debe emitir las mismas
 * señales locales (NAP, geo, área de servicio) que la versión desktop.
 *
 * Server component. Los @id (#organization, #website) coinciden con los de
 * desktop para que ambas versiones referencien las mismas entidades.
 */

const ORG_ID = `${BUSINESS.domain}/#organization`;

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORG_ID,
      name: BUSINESS.name,
      alternateName: BUSINESS.alternateName,
      legalName: BUSINESS.legalName,
      url: BUSINESS.domain,
      logo: `${BUSINESS.domain}/logos/logo.webp`,
      email: BUSINESS.email,
      telephone: BUSINESS.phoneE164,
      foundingDate: String(BUSINESS.foundingYear),
      address: {
        "@type": "PostalAddress",
        streetAddress: BUSINESS.address.street,
        postalCode: BUSINESS.address.postalCode,
        addressLocality: BUSINESS.address.locality,
        addressRegion: BUSINESS.address.region,
        addressCountry: BUSINESS.address.country,
      },
      sameAs: [BUSINESS.social.instagram, BUSINESS.social.linkedin],
    },
    {
      "@type": "WebSite",
      "@id": `${BUSINESS.domain}/#website`,
      url: BUSINESS.domain,
      name: BUSINESS.name,
      inLanguage: "es",
      publisher: { "@id": ORG_ID },
    },
    {
      "@type": "ProfessionalService",
      "@id": `${BUSINESS.domain}/#services`,
      name: BUSINESS.legalName,
      url: BUSINESS.domain,
      image: `${BUSINESS.domain}/logos/logo.webp`,
      telephone: BUSINESS.phoneE164,
      email: BUSINESS.email,
      priceRange: "€€",
      address: {
        "@type": "PostalAddress",
        streetAddress: BUSINESS.address.street,
        postalCode: BUSINESS.address.postalCode,
        addressLocality: BUSINESS.address.locality,
        addressRegion: BUSINESS.address.region,
        addressCountry: BUSINESS.address.country,
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: BUSINESS.geo.latitude,
        longitude: BUSINESS.geo.longitude,
      },
      hasMap: BUSINESS.mapsUrl,
      areaServed: [
        { "@type": "City", name: "Vigo" },
        { "@type": "City", name: "Pontevedra" },
        { "@type": "City", name: "A Coruña" },
        { "@type": "City", name: "Santiago de Compostela" },
        { "@type": "AdministrativeArea", name: "Galicia" },
        { "@type": "Country", name: "ES" },
      ],
      provider: { "@id": ORG_ID },
    },
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
