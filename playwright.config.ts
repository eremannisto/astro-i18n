import { defineConfig } from "@playwright/test"

// Each fixture and the test file that tests it
const fixtures = [
  { path: "static/unprefixed", test: "unprefixed" },
  { path: "server/unprefixed", test: "unprefixed" },
  { path: "hybrid/unprefixed", test: "unprefixed" },
  { path: "static/prefixed", test: "prefixed" },
  { path: "server/prefixed", test: "prefixed" },
  { path: "hybrid/prefixed", test: "prefixed" },
  { path: "base/static-prefixed", test: "base-prefixed" },
  { path: "base/server-prefixed", test: "base-prefixed" },
  { path: "base/hybrid-unprefixed", test: "base-unprefixed" },
]

// Each fixture runs twice: with the dev server and with a production build.
// `pnpm test:fixtures` builds the fixtures first, so no build runs at the same
// time as a dev server in the same folder.
const servers = fixtures.flatMap((fixture, index) => {
  const cwd = `./tests/e2e/fixtures/${fixture.path}`
  return [
    {
      name: `${fixture.path} (dev)`,
      test: fixture.test,
      cwd,
      port: 4000 + index,
      command: `pnpm astro dev --port ${4000 + index}`,
    },
    {
      name: `${fixture.path} (build)`,
      test: fixture.test,
      cwd,
      port: 4100 + index,
      command: `pnpm astro preview --port ${4100 + index}`,
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
