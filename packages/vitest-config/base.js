import { defineConfig } from "vitest/config";

/** Base Vitest config — Node environment, for pure TS/utils. */
export const baseConfig = defineConfig({
  test: {
    include: ["src/**/__tests__/**/*.tests.{ts,tsx}"],
    environment: "node",
    passWithNoTests: true,
  },
});
