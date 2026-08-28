import { AGENCY, SITE } from "@/lib/seo";

/**
 * JSON-LD de la landing: Person + ProfessionalService, enlazados.
 *
 * La pieza clave es `memberOf`/`worksFor` apuntando al `@id` que ya usa
 * actiondev.es (`{dominio}/#organization`). Eso es lo que le dice a
 * Google que la persona y el estudio son la misma entidad de negocio en
 * vez de dos sitios sueltos que se enlazan entre sí. Los `@id` deben
 * coincidir con los de `apps/desktop`: si divergen, se crean dos
 * entidades y el enlace se pierde.
 *
 * Se renderiza en el layout como server component: sin `use client`, el
 * script viaja en el HTML inicial y el crawler lo lee sin ejecutar JS.
 */
export function StructuredData() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${SITE.url}/#person`,
        name: SITE.name,
        url: SITE.url,
        jobTitle: SITE.jobTitle,
        email: `mailto:${SITE.email}`,
        knowsAbout: [
          "Desarrollo de aplicaciones móviles",
          "React Native",
          "iOS",
          "Android",
          "Next.js",
          "Diseño de producto digital",
        ],
        worksFor: { "@id": `${AGENCY.url}/#organization` },
        memberOf: { "@id": `${AGENCY.url}/#organization` },
        address: {
          "@type": "PostalAddress",
          streetAddress: AGENCY.address.street,
          addressLocality: AGENCY.address.locality,
          addressRegion: AGENCY.address.region,
          postalCode: AGENCY.address.postalCode,
          addressCountry: AGENCY.address.country,
        },
      },
      {
        "@type": ["Organization", "ProfessionalService"],
        "@id": `${AGENCY.url}/#organization`,
        name: AGENCY.name,
        legalName: AGENCY.legalName,
        url: AGENCY.url,
        telephone: AGENCY.phoneE164,
        employee: { "@id": `${SITE.url}/#person` },
        address: {
          "@type": "PostalAddress",
          streetAddress: AGENCY.address.street,
          addressLocality: AGENCY.address.locality,
          addressRegion: AGENCY.address.region,
          postalCode: AGENCY.address.postalCode,
          addressCountry: AGENCY.address.country,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: AGENCY.geo.latitude,
          longitude: AGENCY.geo.longitude,
        },
        areaServed: [
          { "@type": "City", name: "Vigo" },
          { "@type": "AdministrativeArea", name: "Galicia" },
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: `${SITE.name} — ${SITE.jobTitle} en Vigo`,
        inLanguage: "es-ES",
        publisher: { "@id": `${AGENCY.url}/#organization` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
