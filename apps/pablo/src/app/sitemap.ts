import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

/** Una sola URL: es una landing, no un sitio. Si algún día se añade una
 *  página, entra aquí y en el índice de CLAUDE.md. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE.url,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
