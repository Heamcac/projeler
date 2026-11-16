import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:3110", channel: process.env.PLAYWRIGHT_CHANNEL, trace: "retain-on-failure" },
  webServer: { command: "npm start -- --hostname 127.0.0.1 --port 3110", url: "http://127.0.0.1:3110/api/health", reuseExistingServer: false, timeout: 45_000 },
});
