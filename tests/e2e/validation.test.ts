import { spawn } from "node:child_process"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"

function fixture(name: string) {
  return resolve("tests/e2e/fixtures/validation", name)
}

/**
 * Runs an Astro command in a fixture and returns its output.
 * Stops the command after 15 seconds if it does not exit.
 */
function runAstro(cwd: string, command = "dev"): Promise<string> {
  return new Promise((resolve) => {
    const proc = spawn("pnpm", ["astro", command], { cwd, env: { ...process.env } })

    let output = ""
    proc.stdout.on("data", (data: Buffer) => {
      output += data.toString()
    })
    proc.stderr.on("data", (data: Buffer) => {
      output += data.toString()
    })
    proc.on("close", () => resolve(output))

    setTimeout(() => {
      proc.kill()
      resolve(output)
    }, 15000)
  })
}

test.describe("errors", () => {
  test("missing translation file", async () => {
    const output = await runAstro(fixture("missing-translations"))
    expect(output).toContain("Missing translation file")
    expect(output).toContain("fi.json")
  })

  test("invalid translation JSON", async () => {
    const output = await runAstro(fixture("invalid-json"))
    expect(output).toContain("Invalid JSON")
    expect(output).toContain("fi.json")
  })

  test("duplicate locale codes", async () => {
    const output = await runAstro(fixture("duplicate-locale"))
    expect(output).toContain("Duplicate locale codes")
    expect(output).toContain("en")
  })

  test("invalid locale code characters", async () => {
    const output = await runAstro(fixture("invalid-locale-code"))
    expect(output).toContain("contains invalid characters")
    expect(output).toContain("zh CN")
  })

  test("index.astro without a default locale prefix", async () => {
    const output = await runAstro(fixture("index-conflict"))
    expect(output).toContain("has the same URL as the default locale home page")
  })

  test("two pages with the same URL after the build", async () => {
    const output = await runAstro(fixture("move-conflict"), "build")
    expect(output).toContain("Two pages have the same URL")
    expect(output).toContain("about")
  })
})

test.describe("warnings and messages", () => {
  test("missing translation key", async () => {
    const output = await runAstro(fixture("missing-key"))
    expect(output).toContain("Missing translation key")
    expect(output).toContain("nav.about")
    expect(output).toContain("fi.json")
  })

  test("removed ignore option", async () => {
    const output = await runAstro(fixture("removed-ignore"))
    expect(output).toContain('The "ignore" option was removed in v3')
  })

  test("index.astro with a default locale prefix", async () => {
    const output = await runAstro(fixture("custom-index"), "build")
    expect(output).toContain("replaces the locale detection")
    const index = readFileSync(resolve(fixture("custom-index"), "dist/index.html"), "utf8")
    expect(index).toContain("<h1>Index</h1>")
  })
})
