import { defineConfig } from "@playwright/test"

const ports = {
  server: 4321,
  static: 4322,
  hybrid: 4323,
}

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./tests/e2e/results",
  workers: 1,
  projects: [
    {
      name: "server",
      use: { baseURL: `http://localhost:${ports.server}` },
      testMatch: "**/e2e/server.test.ts",
    },
    {
      name: "static",
      use: { baseURL: `http://localhost:${ports.static}` },
      testMatch: "**/e2e/static.test.ts",
    },
    {
      name: "hybrid",
      use: { baseURL: `http://localhost:${ports.hybrid}` },
      testMatch: "**/e2e/hybrid.test.ts",
    },
  ],
  webServer: [
    {
      command: `pnpm astro dev --port ${ports.server}`,
      cwd: "./tests/e2e/fixtures/server",
      port: ports.server,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm astro dev --port ${ports.static}`,
      cwd: "./tests/e2e/fixtures/static",
      port: ports.static,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm astro dev --port ${ports.hybrid}`,
      cwd: "./tests/e2e/fixtures/hybrid",
      port: ports.hybrid,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
