import { defineConfig, mergeConfig } from "vitest/config";
import { baseConfig } from "@repo/vitest-config/base";

// Integration tests hit the live local Supabase, so they get longer timeouts
// and run serially-ish (single file forks) to keep state predictable.
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      testTimeout: 30000,
      hookTimeout: 30000,
    },
  }),
);
