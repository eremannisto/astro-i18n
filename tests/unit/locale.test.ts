import { describe, it, expect, vi, beforeEach } from "vitest"

const resolvedConfig = {
  locales: [
    { code: "en", name: "English", endonym: "English" },
    { code: "fi", name: "Finnish", endonym: "Suomi", phrase: "Suomeksi" },
  ],
  routing: {
    fallback: "en",
    detection: "server",
    autoPrefix: { ignore: ["/_astro"] },
  },
  translations: "./src/translations",
}

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
  config: resolvedConfig,
  translations: translationData,
}))

const { Locale } = await import("../../src/lib/locale")

describe("Locale.supported", () => {
  it("returns all locale codes", () => {
    expect(Locale.supported).toEqual(["en", "fi"])
  })
})

describe("Locale.fallback", () => {
  it("returns the fallback locale code", () => {
    expect(Locale.fallback).toBe("en")
  })
})

describe("Locale.get", () => {
  it("returns all locale configs when called without a code", () => {
    expect(Locale.get()).toEqual(resolvedConfig.locales)
  })

  it("returns a single locale config by code", () => {
    expect(Locale.get("fi")).toEqual({
      code: "fi",
      name: "Finnish",
      endonym: "Suomi",
      phrase: "Suomeksi",
    })
  })

  it("throws for an unknown locale code", () => {
    expect(() => Locale.get("de")).toThrow('Locale "de" not found.')
  })
})

describe("Locale.use — with translations", () => {
  it("returns a function when called with a locale", () => {
    expect(typeof Locale.use("en")).toBe("function")
  })

  it("returns the full translation object when called without a key", () => {
    const t = Locale.use("fi")
    expect(t()).toEqual(translationData.fi)
  })

  it("returns the translated string for a key", () => {
    const t = Locale.use("fi")
    expect(t("nav.home")).toBe("Etusivu")
    expect(Locale.use("en")("nav.home")).toBe("Home")
  })

  it("throws for a missing translation key", () => {
    const t = Locale.use("fi")
    expect(() => t("nav.missing")).toThrow('Missing translation key "nav.missing"')
  })

  it("throws for an unknown locale when a key is provided", () => {
    const t = Locale.use("de")
    expect(() => t("nav.home")).toThrow('No translations found for locale "de"')
  })

  it("returns an empty object for an unknown locale without a key", () => {
    const t = Locale.use("de")
    expect(t()).toEqual({})
  })
})

describe("Locale.use — without translations", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("warns and returns empty string when translations are not configured", async () => {
    vi.doMock("virtual:astro-i18n/config", () => ({
      config: { ...resolvedConfig, translations: undefined },
      translations: {},
    }))
    const { Locale: L } = await import("../../src/lib/locale")
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const t = L.use("en")
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("translations are not configured"))
    expect(t("nav.home")).toBe("")
    warn.mockRestore()
  })

  it("warns and returns empty object when translations are not configured and no key", async () => {
    vi.doMock("virtual:astro-i18n/config", () => ({
      config: { ...resolvedConfig, translations: undefined },
      translations: {},
    }))
    const { Locale: L } = await import("../../src/lib/locale")
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const t = L.use("en")
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("translations are not configured"))
    expect(t()).toEqual({})
    warn.mockRestore()
  })
})
