import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

// Pin the workspace root so Turbopack doesn't infer it from a stray lockfile
// elsewhere on the machine. This file lives at apps/<app>/, so "../.." is the
// monorepo root.
const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url));

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/database", "@repo/sick-leave"],
  turbopack: {
    root: workspaceRoot,
  },
};

export default nextConfig;
