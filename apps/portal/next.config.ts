import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/database", "@repo/leavicy"],
  // Served behind the Caddy reverse proxy at this prod-like dev hostname.
  allowedDevOrigins: ["dev.portal.leavicy.com"],
};

export default nextConfig;
