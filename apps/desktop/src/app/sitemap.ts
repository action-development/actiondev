import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { projects } from "@/data/projects";

// Hash anchors (#projects, #contact …) are not indexable pages — omit them.
// Add real routes here as the site grows (e.g. "/servicios", "/blog").
const STATIC_ROUTES = [""];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const deduped: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}/${path}`.replace(/\/$/, "") || SITE_URL,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 1,
  }));

  const projectEntries: MetadataRoute.Sitemap = projects
    .filter((p) => p.url && p.url.startsWith("http"))
    .map((p) => ({
      url: p.url,
      lastModified: new Date(`${p.year}-01-01`),
      changeFrequency: "yearly",
      priority: 0.5,
    }));

  return [...deduped, ...projectEntries];
}
