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

describe("Locale.current", () => {
  it("returns the passed locale", () => {
    expect(Locale.current("fi")).toBe("fi")
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

describe("Locale.t — with translations", () => {
  it("returns the full translation object for a locale", () => {
    const t = Locale.t("fi") as Record<string, string>
    expect(t["nav.home"]).toBe("Etusivu")
  })

  it("returns the translated string for a key", () => {
    expect(Locale.t("fi", "nav.home")).toBe("Etusivu")
    expect(Locale.t("en", "nav.home")).toBe("Home")
  })

  it("throws for a missing translation key", () => {
    expect(() => Locale.t("fi", "nav.missing")).toThrow('Missing translation key "nav.missing"')
  })

  it("throws for an unknown locale when a key is provided", () => {
    expect(() => Locale.t("de", "nav.home")).toThrow('No translations found for locale "de"')
  })

  it("returns an empty object for an unknown locale without a key", () => {
    expect(Locale.t("de")).toEqual({})
  })
})

describe("Locale.t — without translations", () => {
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
    const result = L.t("en", "nav.home")
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("translations are not configured"))
    expect(result).toBe("")
    warn.mockRestore()
  })

  it("warns and returns empty object when translations are not configured and no key", async () => {
    vi.doMock("virtual:astro-i18n/config", () => ({
      config: { ...resolvedConfig, translations: undefined },
      translations: {},
    }))
    const { Locale: L } = await import("../../src/lib/locale")
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const result = L.t("en")
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("translations are not configured"))
    expect(result).toEqual({})
    warn.mockRestore()
  })
})
