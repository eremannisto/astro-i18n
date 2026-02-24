import { defineConfig } from "@playwright/test"

const ports = {
  server: 4321,
  client: 4322,
  none: 4323,
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
      name: "client",
      use: { baseURL: `http://localhost:${ports.client}` },
      testMatch: "**/e2e/client.test.ts",
    },
    {
      name: "none",
      use: { baseURL: `http://localhost:${ports.none}` },
      testMatch: "**/e2e/none.test.ts",
    },
    {
      name: "errors",
      testMatch: "**/e2e/errors.test.ts",
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
      command: `pnpm astro dev --port ${ports.client}`,
      cwd: "./tests/e2e/fixtures/client",
      port: ports.client,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm astro dev --port ${ports.none}`,
      cwd: "./tests/e2e/fixtures/none",
      port: ports.none,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
