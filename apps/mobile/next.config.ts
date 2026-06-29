import type { NextConfig } from "next";

const zoneUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

const nextConfig: NextConfig = {
  assetPrefix:
    process.env.NODE_ENV === "production" && zoneUrl
      ? `https://${zoneUrl}`
      : undefined,
};

export default nextConfig;
