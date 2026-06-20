import { defineConfig, devices } from "@playwright/test";

const PORT = 3560;
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./specs",
  testMatch: /.*\.e2e\.ts/,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Console output + an HTML report (with videos/traces attached) at ./playwright-report.
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  // Failure artifacts land in ./test-results/<test>/ (video.webm, trace.zip, screenshot).
  outputDir: "test-results",
  use: {
    baseURL,
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // The portal must be built first (CI builds it; locally run `pnpm --filter portal build`).
    command: "pnpm --filter portal start",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
