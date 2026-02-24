import { test, expect } from "@playwright/test"
import { spawn } from "node:child_process"
import { resolve } from "node:path"

const FIXTURE = resolve("tests/e2e/fixtures/errors")

function startAstro(): Promise<string> {
  return new Promise((resolve) => {
    const proc = spawn("pnpm", ["astro", "dev"], {
      cwd: FIXTURE,
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
    // fi.json is missing from the fixture translations directory
    const output = await startAstro()
    expect(output).toContain("Missing translation file")
    expect(output).toContain("fi.json")
  })
})
