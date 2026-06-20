import { defineConfig } from "vitest/config";

// Root config used only for unified coverage across the monorepo
// (`pnpm test:coverage`). Day-to-day `pnpm test` still runs per package via
// turbo. Coverage options must live at the root level when using `projects`.
export default defineConfig({
  test: {
    projects: [
      "packages/database",
      "packages/email",
      "packages/ui",
      "packages/utils",
      "apps/portal",
    ],
    coverage: {
      provider: "v8",
      // Count untested source files as 0% so new, untested code is visible.
      all: true,
      reporter: ["text-summary", "json-summary", "lcov", "cobertura"],
      reportsDirectory: "./coverage",
      include: [
        "packages/database/src/**/*.{ts,tsx}",
        "packages/email/src/**/*.{ts,tsx}",
        "packages/ui/src/**/*.{ts,tsx}",
        "packages/utils/src/**/*.{ts,tsx}",
        "apps/portal/src/**/*.{ts,tsx}",
      ],
      exclude: [
        "**/__tests__/**",
        "**/*.tests.{ts,tsx}",
        "**/*.types.ts",
        "**/*.d.ts",
        "**/index.ts",
        "**/database.types.ts",
        "**/*.config.{ts,js,mts,mjs}",
      ],
    },
  },
});
