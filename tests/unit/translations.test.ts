import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"

import { Translations } from "../../src/lib/translations"
import { Mock } from "../lib/utils"

vi.mock("virtual:astro-i18n/config", () => ({
  config: {
    locales: [
      { code: "en", name: "English", endonym: "English" },
      { code: "fi", name: "Finnish", endonym: "Suomi" },
    ],
    defaultLocale: "en",
    prefixDefaultLocale: true,
    ignore: ["/_astro"],
    translations: "./src/translations",
  },
  translations: Mock.translations,
}))

const { Locale } = await import("../../src/lib/locale")

const directories: string[] = []

afterEach(() => {
  for (const directory of directories.splice(0)) fs.rmSync(directory, { recursive: true })
})

function config(files: Record<string, string>) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "astro-i18n-"))
  directories.push(directory)
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(directory, name), content)
  }
  return {
    locales: [{ code: "en" }, { code: "fi" }],
    defaultLocale: "en",
    prefixDefaultLocale: true,
    ignore: [],
    translations: directory,
  }
}

describe("Translations.load", () => {
  it("loads one JSON file per locale", () => {
    const data = Translations.load(config({ "en.json": '{"a":"A"}', "fi.json": '{"a":"Ä"}' }))
    expect(data).toEqual({ en: { a: "A" }, fi: { a: "Ä" } })
  })

  it("throws for a missing translation file", () => {
    expect(() => Translations.load(config({ "en.json": "{}" }))).toThrow("Missing translation file")
  })

  it("throws with the file name for invalid JSON", () => {
    expect(() => Translations.load(config({ "en.json": "{}", "fi.json": "{" }))).toThrow(
      /Invalid JSON in .*fi\.json/
    )
  })
})

describe("Translations.validate", () => {
  it("warns about keys missing in other locales", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    Translations.validate({ en: { a: "A", b: "B" }, fi: { a: "Ä" } }, "en")
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Missing translation key "b"'))
    warn.mockRestore()
  })
})

describe("Translations via Locale.use", () => {
  it("returns the correct string for a key", () => {
    expect(Locale.use(Mock.astro("/en/about")).t("nav.home")).toBe("Home")
    expect(Locale.use(Mock.astro("/fi/about")).t("nav.home")).toBe("Etusivu")
  })

  it("uses the default locale text for a key missing in the locale", () => {
    expect(Locale.use(Mock.astro("/fi/about")).t("nav.contact")).toBe("Contact")
  })

  it("throws for a key missing in the default locale", () => {
    expect(() => Locale.use(Mock.astro("/en/about")).t("nav.missing")).toThrow(
      'Missing translation key "nav.missing"'
    )
  })
})
