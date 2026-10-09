import { organizationSchema, websiteSchema } from "@actiondev/shared";
import { BRAND } from "@/lib/seo";

/**
 * Renders schema.org JSON-LD for search engines and answer engines (Google SGE,
 * Perplexity, Bing Chat, ChatGPT browsing).
 *
 * Server component — runs at build time on static routes. Zero client JS.
 *
 * Solo la entidad (Organization + WebSite), que emiten los dos layouts raíz.
 * El JSON-LD propio de cada página vive en su `lib/*-seo.ts` (el `ItemList`
 * de `/projects`, en `lib/projects-metadata.ts`).
 */

type SchemaKind = "organization" | "website";

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
    // mobile (ver `organizationSchema` en @actiondev/shared), con la MISMA
    // descripción en los tres sitios (`ORGANIZATION_DESCRIPTION`).
    case "organization":
      return {
        "@context": "https://schema.org",
        ...organizationSchema(),
      };

    // Mismo generador que la zona mobile: `name` = «Action Development».
    case "website":
      return {
        "@context": "https://schema.org",
        ...websiteSchema(BRAND.shortDescription),
      };
  }
}
