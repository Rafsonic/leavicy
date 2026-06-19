import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, mergeConfig } from "vitest/config";
import { baseConfig } from "./base.js";

/** Vitest config for React component packages — jsdom + Testing Library. */
export const reactConfig = mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        // Client component tests may transitively import server actions that
        // pull in `server-only`; stub it so imports don't throw under jsdom.
        "server-only": fileURLToPath(new URL("./empty.js", import.meta.url)),
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: [fileURLToPath(new URL("./setup.js", import.meta.url))],
    },
  }),
);
