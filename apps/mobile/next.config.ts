import type { NextConfig } from "next";

const zoneUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

const nextConfig: NextConfig = {
  // Metadatos SIEMPRE en el <head>. Next 15.5 los manda en streaming (al final
  // del <body>) a todo UA que no esté en su lista de bots "limitados", y
  // Googlebot no está: la home móvil —la que indexa Google— llegaba con title,
  // description y canonical dentro del body, y Google ignora un canonical ahí.
  htmlLimitedBots: /.*/,
  assetPrefix:
    process.env.NODE_ENV === "production" && zoneUrl
      ? `https://${zoneUrl}`
      : undefined,
};

export default nextConfig;
