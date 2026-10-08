import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16.3 autogenera AGENTS.md/CLAUDE.md en `next dev` si detecta un agente de IA; el CLAUDE.md del monorepo manda.
  agentRules: false,
  // Se sirve en actiondev.es/admin: desktop proxea /admin/* hacia esta app.
  basePath: "/admin",
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
