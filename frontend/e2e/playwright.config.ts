import { defineConfig } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:5173";
const isDocker = !!process.env.BASE_URL;

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: "playwright-report" }]],
  outputDir: "test-results",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  // In Docker, the frontend is orchestrated by docker-compose, not Playwright
  ...(isDocker
    ? {}
    : {
        webServer: {
          command: "npm run dev",
          url: "http://localhost:5173",
          reuseExistingServer: !process.env.CI,
          cwd: "..",
          timeout: 30000,
        },
      }),
});
