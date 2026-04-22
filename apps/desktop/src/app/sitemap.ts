import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { projects } from "@/data/projects";

const STATIC_ROUTES = ["", "#projects", "#reviews", "#contact"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}/${path}`.replace(/\/+$/, path.startsWith("#") ? "" : "/"),
    lastModified: now,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.7,
  }));

  // Anchor URLs are ignored by most crawlers; keep homepage entries clean.
  const deduped = Array.from(
    new Map(staticEntries.map((e) => [e.url.split("#")[0], e])).values()
  );

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
