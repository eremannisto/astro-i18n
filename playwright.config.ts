import { defineConfig } from "@playwright/test"

const fixtures = [
  "static/unprefixed",
  "server/unprefixed",
  "hybrid/unprefixed",
  "static/prefixed",
  "server/prefixed",
  "hybrid/prefixed",
]

// Each fixture runs twice: with the dev server and with a production build
const servers = fixtures.flatMap((fixture, index) => {
  const test = fixture.split("/")[1]
  const cwd = `./tests/e2e/fixtures/${fixture}`
  return [
    {
      name: `${fixture} (dev)`,
      test,
      cwd,
      port: 4000 + index,
      command: `pnpm astro dev --port ${4000 + index}`,
    },
    {
      name: `${fixture} (build)`,
      test,
      cwd,
      port: 4100 + index,
      command: `pnpm astro build && pnpm astro preview --port ${4100 + index}`,
    },
  ]
})

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./tests/e2e/results",
  reporter: [["list"]],
  workers: 1,
  projects: [
    ...servers.map((server) => ({
      name: server.name,
      use: { baseURL: `http://localhost:${server.port}` },
      testMatch: `**/e2e/${server.test}.test.ts`,
    })),
    {
      name: "validation",
      testMatch: "**/e2e/validation.test.ts",
    },
  ],
  webServer: servers.map((server) => ({
    command: server.command,
    cwd: server.cwd,
    port: server.port,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  })),
})
