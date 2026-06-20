import type { MetadataRoute } from "next";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Leavicy Portal";

// Web App Manifest — makes the portal installable as a PWA.
// Brand: teal gradient (#5EEAD4 → #0E9488); theme uses the darker teal.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${APP_NAME} — Sick Leave`,
    short_name: APP_NAME,
    description:
      "Employee self-service for sick leave: request, track and view your team.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "en-GB",
    dir: "ltr",
    background_color: "#ffffff",
    theme_color: "#0e9488",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
