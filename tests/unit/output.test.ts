import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { Output } from "../../src/lib/output"

let root: string

function write(file: string, content = file) {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
  fs.writeFileSync(path.join(root, file), content)
}

function read(file: string) {
  return fs.readFileSync(path.join(root, file), "utf8")
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "astro-i18n-"))
})

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true })
})

describe("Output.moveDefaultLocale", () => {
  it("moves the default locale pages to the root", () => {
    write("en/index.html")
    write("en/about/index.html")
    write("fi/about/index.html")
    Output.moveDefaultLocale(pathToFileURL(`${root}/`), "en")
    expect(read("index.html")).toBe("en/index.html")
    expect(read("about/index.html")).toBe("en/about/index.html")
    expect(read("fi/about/index.html")).toBe("fi/about/index.html")
    expect(fs.existsSync(path.join(root, "en"))).toBe(false)
  })

  it("moves the locale index page of build.format file", () => {
    write("en.html")
    write("en/about.html")
    Output.moveDefaultLocale(pathToFileURL(`${root}/`), "en")
    expect(read("index.html")).toBe("en.html")
    expect(read("about.html")).toBe("en/about.html")
  })

  it("throws and moves nothing when a target file exists", () => {
    write("en/about/index.html")
    write("about/index.html")
    expect(() => Output.moveDefaultLocale(pathToFileURL(`${root}/`), "en")).toThrow(
      "Two pages have the same URL"
    )
    expect(read("en/about/index.html")).toBe("en/about/index.html")
    expect(read("about/index.html")).toBe("about/index.html")
  })

  it("does nothing when the default locale has no prerendered pages", () => {
    write("index.html")
    Output.moveDefaultLocale(pathToFileURL(`${root}/`), "en")
    expect(read("index.html")).toBe("index.html")
  })
})
