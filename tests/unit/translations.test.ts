import { describe, expect, it, vi } from "vitest"

import { Mock } from "../lib/utils"

vi.mock("virtual:astro-i18n/config", () => ({
  config: {
    locales: [
      { code: "en", name: "English", endonym: "English" },
      { code: "fi", name: "Finnish", endonym: "Suomi" },
    ],
    defaultLocale: "en",
    ignore: ["/_astro"],
    translations: "./src/translations",
  },
  translations: Mock.translations,
}))

const { Locale } = await import("../../src/lib/locale")

describe("Translations via Locale.use", () => {
  it("returns the correct string for a key", () => {
    expect(Locale.use(Mock.astro("/en/about")).t("nav.home")).toBe("Home")
    expect(Locale.use(Mock.astro("/fi/about")).t("nav.home")).toBe("Etusivu")
  })

  it("throws for a missing translation key", () => {
    expect(() => Locale.use(Mock.astro("/fi/about")).t("nav.missing")).toThrow(
      'Missing translation key "nav.missing"'
    )
  })

  it("throws for a missing key across locales", () => {
    expect(() => Locale.use(Mock.astro("/en/about")).t("nav.missing")).toThrow(
      'Missing translation key "nav.missing"'
    )
  })
})
