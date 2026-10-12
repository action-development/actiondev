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
      // La mascota, sin fondo (decisión del cliente). Sin "maskable" a
      // propósito: ese formato exige fondo opaco a sangre. Al instalar,
      // Android la pone sobre su propia placa.
      { src: "/icons/mascota.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/mascota-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/mascota-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
