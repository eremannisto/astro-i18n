import { spawn } from "node:child_process"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"

const FIXTURES = {
  missingTranslations: resolve("tests/e2e/fixtures/errors/missing-translations"),
  missingKey: resolve("tests/e2e/fixtures/errors/missing-key"),
  indexConflict: resolve("tests/e2e/fixtures/errors/index-conflict"),
  duplicateLocale: resolve("tests/e2e/fixtures/errors/duplicate-locale"),
  invalidLocaleCode: resolve("tests/e2e/fixtures/errors/invalid-locale-code"),
}

function startAstro(cwd: string): Promise<string> {
  return new Promise((resolve) => {
    const proc = spawn("pnpm", ["astro", "dev"], {
      cwd,
      env: { ...process.env },
    })

    let output = ""

    proc.stdout.on("data", (data: Buffer) => {
      output += data.toString()
    })

    proc.stderr.on("data", (data: Buffer) => {
      output += data.toString()
    })

    proc.on("exit", () => {
      resolve(output)
    })

    // kill after 5 seconds in case it doesn't exit on its own
    setTimeout(() => {
      proc.kill()
      resolve(output)
    }, 5000)
  })
}

test.describe("startup validation errors", () => {
  test("missing translation file throws a clear error", async () => {
    const output = await startAstro(FIXTURES.missingTranslations)
    expect(output).toContain("Missing translation file")
    expect(output).toContain("fi.json")
  })

  test("missing translation key logs a warning", async () => {
    const output = await startAstro(FIXTURES.missingKey)
    expect(output).toContain("Missing translation key")
    expect(output).toContain("nav.about")
    expect(output).toContain("fi.json")
  })

  test("conflicting index.astro throws a clear error", async () => {
    const output = await startAstro(FIXTURES.indexConflict)
    expect(output).toContain("conflicting src/pages/index.astro")
  })

  test("duplicate locale codes throw a clear error", async () => {
    const output = await startAstro(FIXTURES.duplicateLocale)
    expect(output).toContain("Duplicate locale codes")
    expect(output).toContain("en")
  })

  test("invalid locale code characters throw a clear error", async () => {
    const output = await startAstro(FIXTURES.invalidLocaleCode)
    expect(output).toContain("contains invalid characters")
    expect(output).toContain("zh CN")
  })
})
