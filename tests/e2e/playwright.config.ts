import { defineConfig, devices } from "@playwright/test";

const PORTAL_PORT = 3560;
const CENTRAL_PORT = 3550;
const portalURL = `http://127.0.0.1:${PORTAL_PORT}`;
const centralURL = `http://127.0.0.1:${CENTRAL_PORT}`;

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
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      // Portal (employee/manager/admin) — runs every spec except the Central ones.
      name: "portal",
      testIgnore: /.*\.central\.e2e\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: portalURL },
    },
    {
      // Central (platform super-admin) — only the *.central.e2e.ts specs.
      name: "central",
      testMatch: /.*\.central\.e2e\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: centralURL },
    },
  ],
  webServer: [
    {
      // The portal must be built first (CI builds it; locally run `pnpm --filter portal build`).
      command: "pnpm --filter portal start",
      url: portalURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      // Central self-builds so the e2e run needs no extra CI build step.
      command: "pnpm --filter central build && pnpm --filter central start",
      url: centralURL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
