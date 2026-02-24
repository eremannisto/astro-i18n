import { describe, it, expect, vi } from "vitest"

const translationData = {
  en: {
    "nav.home": "Home",
    "nav.about": "About",
    "footer.copyright": "All rights reserved",
  },
  fi: {
    "nav.home": "Etusivu",
    "nav.about": "Tietoa",
    "footer.copyright": "Kaikki oikeudet pidätetään",
  },
}

vi.mock("virtual:astro-i18n/config", () => ({
  config: {
    locales: [
      { code: "en", name: "English", endonym: "English" },
      { code: "fi", name: "Finnish", endonym: "Suomi" },
    ],
    routing: {
      fallback: "en",
      detection: "server",
      autoPrefix: false,
    },
    translations: "./src/translations",
  },
  translations: translationData,
}))

const { Locale } = await import("../../src/lib/locale")

describe("Translations via Locale.use", () => {
  it("returns the correct string for a key", () => {
    expect(Locale.use("en")("nav.home")).toBe("Home")
    expect(Locale.use("fi")("nav.home")).toBe("Etusivu")
  })

  it("throws for a missing translation key", () => {
    expect(() => Locale.use("fi")("nav.missing")).toThrow('Missing translation key "nav.missing"')
  })

  it("throws for an unknown locale", () => {
    expect(() => Locale.use("de")("nav.home")).toThrow('No translations found for locale "de"')
  })
})
