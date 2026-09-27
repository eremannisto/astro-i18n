import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest"

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

describe("t()", () => {
  let error: MockInstance

  beforeEach(() => {
    error = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    error.mockRestore()
  })

  it("returns the text of the current locale", () => {
    expect(Locale.use(Mock.astro("/en/about")).t("nav.home")).toBe("Home")
    expect(Locale.use(Mock.astro("/fi/about")).t("nav.home")).toBe("Etusivu")
    expect(error).not.toHaveBeenCalled()
  })

  it("returns the key name and logs an error for a key missing in the locale", () => {
    expect(Locale.use(Mock.astro("/fi/about")).t("nav.contact")).toBe("nav.contact")
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('Missing translation key "nav.contact" in fi.json')
    )
  })

  it("returns the key name for inherited object keys", () => {
    expect(Locale.use(Mock.astro("/en/about")).t("constructor")).toBe("constructor")
  })

  it("replaces placeholders with values", () => {
    const { t } = Locale.use(Mock.astro("/fi/about"))
    expect(t("welcome", { user: "Ere", count: 3 })).toBe("Tervetuloa Ere, sinulla on 3 viestiä")
    expect(error).not.toHaveBeenCalled()
  })

  it("keeps a placeholder without a value and logs an error", () => {
    const { t } = Locale.use(Mock.astro("/en/about"))
    expect(t("welcome", { user: "Ere" })).toBe("Welcome Ere, you have {{ count }} messages")
    expect(error).toHaveBeenCalledWith(expect.stringContaining('Missing value "count"'))
  })

  it("ignores values without a placeholder", () => {
    const { t } = Locale.use(Mock.astro("/en/about"))
    expect(t("nav.home", { user: "Ere" })).toBe("Home")
    expect(error).not.toHaveBeenCalled()
  })
})
