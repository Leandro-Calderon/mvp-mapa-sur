import { defineConfig, devices } from "@playwright/test";

// Node globals are not part of this repo's eslint browser-global scope for
// TS files, and this file is outside tsconfig's `include`; declare the small
// ambient shape we need for `process.env` access.
declare const process: { env: Record<string, string | undefined> };

// Must match `base` in vite.config.js (GitHub Pages project site). The app is
// served under this sub-path, never at "/": keep it in sync with vite.config.js.
const VITE_BASE_PATH = "/mvp-mapa-sur/";
const PREVIEW_PORT = 4173;
const PREVIEW_URL = `http://localhost:${PREVIEW_PORT}${VITE_BASE_PATH}`;

export default defineConfig({
  testDir: "./e2e",
  // Single worker: one resilient smoke test against one preview server.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  // Generous timeouts: data layers and the map are fetched on load.
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  reporter: process.env.CI
    ? [["list"]]
    : [
        ["list"],
        ["html", { outputFolder: "playwright-report", open: "never" }],
      ],
  outputDir: "./test-results",
  use: {
    baseURL: PREVIEW_URL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // Runs `vite preview` against an existing dist/ build (see test:e2e:run).
    command: `pnpm preview --port ${PREVIEW_PORT} --strictPort`,
    url: PREVIEW_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
