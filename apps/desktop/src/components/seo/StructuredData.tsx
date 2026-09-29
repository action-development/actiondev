import { organizationSchema } from "@actiondev/shared";
import { BRAND, SITE_URL, absoluteUrl } from "@/lib/seo";
import { projects } from "@/data/projects";

/**
 * Renders schema.org JSON-LD for search engines and answer engines (Google SGE,
 * Perplexity, Bing Chat, ChatGPT browsing).
 *
 * Server component — runs at build time on static routes. Zero client JS.
 */

type SchemaKind = "organization" | "website" | "projects";

interface StructuredDataProps {
  kind: SchemaKind;
}

export function StructuredData({ kind }: StructuredDataProps) {
  const schema = buildSchema(kind);
  return (
    <script
      type="application/ld+json"
      // Inline JSON-LD is the recommended pattern for Next.js App Router.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function buildSchema(kind: SchemaKind): object {
  switch (kind) {
    // Organization + ProfessionalService en un solo nodo, compartido con
    // mobile (ver `organizationSchema` en @actiondev/shared).
    case "organization":
      return {
        "@context": "https://schema.org",
        ...organizationSchema(BRAND.longDescription),
      };

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

    // Cada item apunta a su ficha propia (/projects/[slug]), no a la web del
    // cliente: 18 proyectos no tienen URL externa y salían como "/#".
    case "projects":
      return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `Proyectos de ${BRAND.name}`,
        description: `Webs, apps y tiendas online desarrolladas por ${BRAND.name} en Vigo.`,
        itemListElement: projects.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "CreativeWork",
            name: p.title,
            description: p.descriptionEs ?? p.description,
            url: absoluteUrl(`/projects/${p.slug}`),
            image: absoluteUrl(p.image),
            dateCreated: String(p.year),
            genre: p.category,
            inLanguage: "es",
            creator: { "@id": absoluteUrl("#organization") },
          },
        })),
      };
  }
}
