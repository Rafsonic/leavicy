import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig } from "vitest/config";
import { reactConfig } from "@repo/vitest-config/react";

// Portal-local Vitest config: extend the shared React preset with the `@/*`
// path alias (mirrors tsconfig `paths`) so tests can import modules that use it.
export default mergeConfig(
  reactConfig,
  defineConfig({
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  }),
);
