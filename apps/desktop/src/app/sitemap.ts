import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { projects } from "@/data/projects";
import { landings } from "@/data/landings";

// Hash anchors (#projects, #contact …) are not indexable pages — omit them.
const CORE_LANDING = "desarrollo-de-aplicaciones-vigo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const home: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/servicios`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const landingEntries: MetadataRoute.Sitemap = landings.map((l) => ({
    url: `${SITE_URL}/${l.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: l.slug === CORE_LANDING ? 0.9 : 0.8,
  }));

  const projectEntries: MetadataRoute.Sitemap = projects
    .filter((p) => p.url && p.url.startsWith("http"))
    .map((p) => ({
      url: p.url,
      lastModified: new Date(`${p.year}-01-01`),
      changeFrequency: "yearly",
      priority: 0.5,
    }));

  return [...home, ...landingEntries, ...projectEntries];
}
