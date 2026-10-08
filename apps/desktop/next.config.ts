import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // Next 16.3 autogenera AGENTS.md/CLAUDE.md en `next dev` si detecta un agente de IA; el CLAUDE.md del monorepo manda.
  agentRules: false,
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: [
      "three",
      "@react-three/fiber",
      "@react-three/drei",
      "@react-three/rapier",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },
  // Landings consolidadas (auditoría SEO 2026-09-30): la de diseño en
  // Pontevedra era un clon de la de Vigo y canibalizaba a la de desarrollo
  // web en Pontevedra, que ahora cubre diseño + desarrollo. 301 para
  // trasladar lo que tuviera ganado.
  async redirects() {
    return [
      {
        source: "/diseno-web-pontevedra",
        destination: "/desarrollo-web-pontevedra",
        permanent: true,
      },
      // Antes era un `redirect()` en app/reviews (307, temporal).
      { source: "/reviews", destination: "/resenas", permanent: true },
      // `/legal` no tiene página propia (daba 404): el índice de los documentos es el aviso legal.
      { source: "/legal", destination: "/legal/aviso-legal", permanent: true },
    ];
  },
  // /admin es la app `@actiondev/admin` (basePath "/admin"), proxeada para
  // que viva en el mismo dominio. En producción, ADMIN_URL = su deploy en Vercel.
  async rewrites() {
    const admin = process.env.ADMIN_URL || "http://localhost:3003";
    return [
      { source: "/admin", destination: `${admin}/admin` },
      { source: "/admin/:path*", destination: `${admin}/admin/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      // `/` sirve HTML distinto a móvil (zona mobile vía middleware) y a
      // desktop: dynamic serving. El middleware solo consigue fijar `Vary`
      // en la rama móvil (en la desktop lo pisa Next), así que va aquí.
      {
        source: "/",
        headers: [{ key: "Vary", value: "User-Agent" }],
      },
      // Static assets — content-addressed via filename, safe to cache for 1 year
      {
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/logos/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/avatars/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/3d_models/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // Fondos pintados del hero y del horizonte de la plaza. Llevan versión en
      // el nombre (`port-dia-v1.webp`), así que son inmutables. Importa sobre
      // todo `/plaza/*`: esas texturas las baja Three.js con su propio
      // TextureLoader, NO pasan por `next/image`, así que sin esta cabecera
      // cada visita las revalidaba contra el servidor.
      {
        source: "/hero/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/plaza/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // Project assets — may update without filename change; 1 day + 7 day SWR
      {
        source: "/projects/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
      {
        source: "/projects_video/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
      {
        source: "/llms.txt",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, must-revalidate" }],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
