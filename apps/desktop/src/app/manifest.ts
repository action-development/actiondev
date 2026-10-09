import type { MetadataRoute } from "next";
import { BRAND, SITE_NAME } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    // Nombre largo de la entidad (`SITE_NAME`); el corto se queda en «Action»:
    // Android e iOS recortan el rótulo del icono hacia los 12 caracteres.
    name: `${SITE_NAME} — ${BRAND.tagline}`,
    short_name: BRAND.name,
    description: BRAND.shortDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    lang: BRAND.language,
    orientation: "portrait-primary",
    icons: [
      // Los "any" llevan el glifo negro sobre transparente; el "maskable" lleva
      // fondo lima opaco y el glifo dentro de la zona segura (círculo del 80 %),
      // que es lo que exige Android para recortarlo sin comerse el logo.
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
