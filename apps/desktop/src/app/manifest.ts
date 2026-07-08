import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.name} — ${BRAND.tagline}`,
    short_name: BRAND.name,
    description: BRAND.shortDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    lang: BRAND.language,
    orientation: "portrait-primary",
    icons: [
      // Replace with real 192×192 and 512×512 PNGs when available.
      // /favicon.ico does not exist in public — referencing it caused a 404.
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/logos/action_globe.webp", sizes: "192x192", type: "image/webp" },
    ],
  };
}
