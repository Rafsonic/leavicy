import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/database"],
  // Served behind the Caddy reverse proxy at this prod-like dev hostname.
  allowedDevOrigins: ["dev.portal.leavicy.com"],
  // PWA: never cache the service worker so clients always pick up new versions,
  // and let it control the whole origin from /sw.js.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
