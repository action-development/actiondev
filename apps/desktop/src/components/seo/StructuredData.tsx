import { BRAND, BUSINESS, SITE_URL, SOCIAL, absoluteUrl } from "@/lib/seo";
import { projects } from "@/data/projects";
import { testimonials } from "@/data/testimonials";

/**
 * Renders schema.org JSON-LD for search engines and answer engines (Google SGE,
 * Perplexity, Bing Chat, ChatGPT browsing).
 *
 * Server component — runs at build time on static routes. Zero client JS.
 */

type SchemaKind = "organization" | "website" | "projects" | "reviews" | "services";

interface StructuredDataProps {
  kind: SchemaKind;
}

export function StructuredData({ kind }: StructuredDataProps) {
  const schema = buildSchema(kind);
  if (!schema) return null;
  return (
    <script
      type="application/ld+json"
      // Inline JSON-LD is the recommended pattern for Next.js App Router.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function buildSchema(kind: SchemaKind): object | null {
  switch (kind) {
    case "organization": {
      const sameAs = [
        SOCIAL.twitter && `https://twitter.com/${SOCIAL.twitter.replace(/^@/, "")}`,
        SOCIAL.instagram && `https://instagram.com/${SOCIAL.instagram}`,
        SOCIAL.linkedin && `https://linkedin.com/company/${SOCIAL.linkedin}`,
        SOCIAL.github && `https://github.com/${SOCIAL.github}`,
      ].filter(Boolean) as string[];

      return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": absoluteUrl("#organization"),
        name: BRAND.name,
        alternateName: BUSINESS.alternateName,
        legalName: BRAND.legalName,
        url: SITE_URL,
        logo: absoluteUrl("/logos/logo.webp"),
        description: BRAND.longDescription,
        foundingDate: String(BRAND.foundingYear),
        email: BRAND.contactEmail,
        telephone: BUSINESS.phoneE164,
        address: {
          "@type": "PostalAddress",
          streetAddress: BUSINESS.address.street,
          postalCode: BUSINESS.address.postalCode,
          addressLocality: BUSINESS.address.locality,
          addressRegion: BUSINESS.address.region,
          addressCountry: BUSINESS.address.country,
        },
        ...(sameAs.length > 0 && { sameAs }),
      };
    }

    case "website":
      return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": absoluteUrl("#website"),
        url: SITE_URL,
        name: BRAND.name,
        description: BRAND.shortDescription,
        inLanguage: BRAND.language,
        publisher: { "@id": absoluteUrl("#organization") },
      };

    case "projects":
      return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `Work by ${BRAND.name}`,
        description: `Selected projects delivered by ${BRAND.name}.`,
        itemListElement: projects.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "CreativeWork",
            name: p.title,
            description: p.description,
            url: p.url.startsWith("http") ? p.url : absoluteUrl(p.url),
            image: absoluteUrl(p.image),
            dateCreated: String(p.year),
            genre: p.category,
            keywords: p.technologies.join(", "),
            creator: { "@id": absoluteUrl("#organization") },
          },
        })),
      };

    case "services":
      return {
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        "@id": absoluteUrl("#services"),
        name: BRAND.legalName,
        url: absoluteUrl("/"),
        description: BRAND.longDescription,
        image: absoluteUrl("/logos/logo.webp"),
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
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: `${BRAND.name} Services`,
          itemListElement: BRAND.services.map((service, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: service,
                provider: { "@id": absoluteUrl("#organization") },
              },
            },
          })),
        },
        provider: { "@id": absoluteUrl("#organization") },
      };

    case "reviews": {
      const reviewCount = testimonials.length;
      if (reviewCount === 0) return null;
      return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": absoluteUrl("#organization"),
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "5",
          reviewCount,
          bestRating: "5",
          worstRating: "1",
        },
        review: testimonials.map((t) => ({
          "@type": "Review",
          author: { "@type": "Person", name: t.name },
          reviewBody: t.quote,
          itemReviewed: {
            "@type": "Service",
            name: t.project,
            provider: { "@id": absoluteUrl("#organization") },
          },
          reviewRating: {
            "@type": "Rating",
            ratingValue: "5",
            bestRating: "5",
            worstRating: "1",
          },
        })),
      };
    }
  }
}
