import { beforeEach, describe, expect, it, vi } from "vitest"

import { Mock } from "../lib/utils"

const resolvedConfig = {
  locales: [
    { code: "en", name: "English", endonym: "English" },
    { code: "fi", name: "Finnish", endonym: "Suomi", phrase: "Suomeksi", direction: "rtl" },
  ],
  defaultLocale: "en",
  ignore: ["/_astro"],
  translations: "./src/translations",
}

vi.mock("virtual:astro-i18n/config", () => ({
  config: resolvedConfig,
  translations: Mock.translations,
}))

const { Locale } = await import("../../src/lib/locale")

describe("Locale.supported", () => {
  it("returns all locale codes", () => {
    expect(Locale.supported).toEqual(["en", "fi"])
  })
})

describe("Locale.defaultLocale", () => {
  it("returns the default locale code", () => {
    expect(Locale.defaultLocale).toBe("en")
  })
})

describe("Locale.fromURL", () => {
  it("returns the locale from a URL", () => {
    expect(Locale.fromURL(new URL("https://example.com/fi/about"))).toBe("fi")
    expect(Locale.fromURL(new URL("https://example.com/en/"))).toBe("en")
  })

  it("returns defaultLocale when no locale found in URL", () => {
    expect(Locale.fromURL(new URL("https://example.com/about"))).toBe("en")
    expect(Locale.fromURL(new URL("https://example.com/"))).toBe("en")
  })

  it("returns defaultLocale for unknown locale in URL", () => {
    expect(Locale.fromURL(new URL("https://example.com/de/about"))).toBe("en")
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
      direction: "rtl",
    })
  })

  it("throws for an unknown locale code", () => {
    expect(() => Locale.get("de")).toThrow('Locale "de" not found.')
  })
})

describe("Locale.url", () => {
  it("returns locale root when no path provided", () => {
    expect(Locale.url("fi")).toBe("/fi/")
    expect(Locale.url("en")).toBe("/en/")
  })

  it("returns locale root when path is /", () => {
    expect(Locale.url("fi", "/")).toBe("/fi/")
  })

  it("builds a locale-prefixed URL from a plain path", () => {
    expect(Locale.url("fi", "/about")).toBe("/fi/about")
    expect(Locale.url("en", "/about")).toBe("/en/about")
  })

  it("strips existing locale prefix before building URL", () => {
    expect(Locale.url("fi", "/en/about")).toBe("/fi/about")
    expect(Locale.url("en", "/fi/about")).toBe("/en/about")
  })
})

describe("Locale.switch", () => {
  it("warns when called on the server", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    Locale.switch("fi")
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("can only be called in the browser"))
    warn.mockRestore()
  })
})

describe("Locale.use — instance", () => {
  it("returns locale fields for a prefixed URL", () => {
    const locale = Locale.use(Mock.astro("/fi/about"))
    expect(locale.code).toBe("fi")
    expect(locale.name).toBe("Finnish")
    expect(locale.endonym).toBe("Suomi")
    expect(locale.phrase).toBe("Suomeksi")
    expect(locale.direction).toBe("rtl")
  })

  it("falls back to defaultLocale when URL has no locale prefix", () => {
    const locale = Locale.use(Mock.astro("/about"))
    expect(locale.code).toBe("en")
    expect(locale.name).toBe("English")
    expect(locale.endonym).toBe("English")
    expect(locale.phrase).toBeUndefined()
    expect(locale.direction).toBe("ltr")
  })

  it("defaults direction to ltr when not configured", () => {
    expect(Locale.use(Mock.astro("/en/about")).direction).toBe("ltr")
  })

  it("t translates a key for the current locale", () => {
    expect(Locale.use(Mock.astro("/fi/about")).t("nav.home")).toBe("Etusivu")
    expect(Locale.use(Mock.astro("/en/about")).t("nav.home")).toBe("Home")
  })

  it("t throws for a missing translation key", () => {
    const { t } = Locale.use(Mock.astro("/fi/about"))
    expect(() => t("nav.missing")).toThrow('Missing translation key "nav.missing"')
  })

  it("all members are safe to destructure", () => {
    const { code, name, endonym, phrase, direction, t, response } = Locale.use(
      Mock.astro("/fi/about")
    )
    expect(code).toBe("fi")
    expect(name).toBe("Finnish")
    expect(endonym).toBe("Suomi")
    expect(phrase).toBe("Suomeksi")
    expect(direction).toBe("rtl")
    expect(t("nav.home")).toBe("Etusivu")
    expect(response()).toBeNull()
  })

  it("response returns null when URL has a valid locale prefix", () => {
    expect(Locale.use(Mock.astro("/en/about")).response()).toBeNull()
    expect(Locale.use(Mock.astro("/fi/banana")).response()).toBeNull()
    expect(Locale.use(Mock.astro("/en/")).response()).toBeNull()
  })

  it("response redirects unprefixed path to defaultLocale when no cookie", () => {
    const result = Locale.use(Mock.astro("/about")).response() as any
    expect(result.path).toBe("/en/about")
    expect(result.status).toBe(302)
  })

  it("response redirects unprefixed path to cookie locale when cookie is set", () => {
    const result = Locale.use(Mock.astro("/about", "fi")).response() as any
    expect(result.path).toBe("/fi/about")
    expect(result.status).toBe(302)
  })

  it("response redirects to defaultLocale when cookie has an invalid locale", () => {
    const result = Locale.use(Mock.astro("/about", "de")).response() as any
    expect(result.path).toBe("/en/about")
    expect(result.status).toBe(302)
  })

  it("response redirects root unprefixed path to defaultLocale", () => {
    const result = Locale.use(Mock.astro("/")).response() as any
    expect(result.path).toBe("/en/")
    expect(result.status).toBe(302)
  })

  it("response redirects to cookie locale for unknown path", () => {
    const result = Locale.use(Mock.astro("/banana", "fi")).response() as any
    expect(result.path).toBe("/fi/banana")
    expect(result.status).toBe(302)
  })
})

describe("Locale.use — without translations", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("throws when t() is called but translations are not configured", async () => {
    vi.doMock("virtual:astro-i18n/config", () => ({
      config: { ...resolvedConfig, translations: undefined },
      translations: {},
    }))
    const { Locale: L } = await import("../../src/lib/locale")
    const { t } = L.use(Mock.astro("/en/about"))
    expect(() => t("nav.home")).toThrow("translations are not configured")
  })
})

describe("Locale.hreflang", () => {
  it("returns hreflang entries for all locales plus x-default", () => {
    const result = Locale.hreflang(new URL("https://example.com/en/about"), "https://example.com")
    expect(result).toEqual([
      { href: "https://example.com/en/about", hreflang: "en" },
      { href: "https://example.com/fi/about", hreflang: "fi" },
      { href: "https://example.com/en/about", hreflang: "x-default" },
    ])
  })

  it("strips existing locale prefix when generating alternate URLs", () => {
    const result = Locale.hreflang(new URL("https://example.com/fi/about"), "https://example.com")
    expect(result).toEqual([
      { href: "https://example.com/en/about", hreflang: "en" },
      { href: "https://example.com/fi/about", hreflang: "fi" },
      { href: "https://example.com/en/about", hreflang: "x-default" },
    ])
  })

  it("handles root path", () => {
    const result = Locale.hreflang(new URL("https://example.com/en/"), "https://example.com")
    expect(result).toEqual([
      { href: "https://example.com/en/", hreflang: "en" },
      { href: "https://example.com/fi/", hreflang: "fi" },
      { href: "https://example.com/en/", hreflang: "x-default" },
    ])
  })

  it("accepts site as a URL object", () => {
    const result = Locale.hreflang(
      new URL("https://example.com/en/about"),
      new URL("https://example.com")
    )
    expect(result).toEqual([
      { href: "https://example.com/en/about", hreflang: "en" },
      { href: "https://example.com/fi/about", hreflang: "fi" },
      { href: "https://example.com/en/about", hreflang: "x-default" },
    ])
  })

  it("x-default always points to defaultLocale", () => {
    const result = Locale.hreflang(new URL("https://example.com/fi/about"), "https://example.com")
    const xDefault = result.find((r) => r.hreflang === "x-default")
    expect(xDefault?.href).toBe("https://example.com/en/about")
  })
})
