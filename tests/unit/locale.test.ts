import { describe, it, expect, vi, beforeEach } from "vitest"

const resolvedConfig = {
  locales: [
    { code: "en", name: "English", endonym: "English" },
    { code: "fi", name: "Finnish", endonym: "Suomi", phrase: "Suomeksi" },
  ],
  mode: "server",
  defaultLocale: "en",
  ignore: ["/_astro"],
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

describe("Locale.defaultLocale", () => {
  it("returns the default locale code", () => {
    expect(Locale.defaultLocale).toBe("en")
  })
})

describe("Locale.from", () => {
  it("returns the locale from a URL", () => {
    expect(Locale.from(new URL("https://example.com/fi/about"))).toBe("fi")
    expect(Locale.from(new URL("https://example.com/en/"))).toBe("en")
  })

  it("returns defaultLocale when no locale found in URL", () => {
    expect(Locale.from(new URL("https://example.com/about"))).toBe("en")
    expect(Locale.from(new URL("https://example.com/"))).toBe("en")
  })

  it("returns defaultLocale for unknown locale in URL", () => {
    expect(Locale.from(new URL("https://example.com/de/about"))).toBe("en")
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

describe("Locale.use — with translations", () => {
  it("returns a function when called with a locale", () => {
    expect(typeof Locale.use("en")).toBe("function")
  })

  it("returns the translated string for a key", () => {
    expect(Locale.use("fi")("nav.home")).toBe("Etusivu")
    expect(Locale.use("en")("nav.home")).toBe("Home")
  })

  it("throws for a missing translation key", () => {
    expect(() => Locale.use("fi")("nav.missing")).toThrow('Missing translation key "nav.missing"')
  })

  it("throws for an unknown locale", () => {
    expect(() => Locale.use("de")("nav.home")).toThrow('No translations found for locale "de"')
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
})

describe("Locale.t", () => {
  it("returns a translation function for the locale in the URL", () => {
    expect(typeof Locale.t(new URL("https://example.com/fi/about"))).toBe("function")
  })

  it("translates a key using the locale from the URL", () => {
    expect(Locale.t(new URL("https://example.com/fi/about"))("nav.home")).toBe("Etusivu")
    expect(Locale.t(new URL("https://example.com/en/about"))("nav.home")).toBe("Home")
  })

  it("falls back to defaultLocale when URL has no locale prefix", () => {
    expect(Locale.t(new URL("https://example.com/about"))("nav.home")).toBe("Home")
  })

  it("throws for a missing translation key", () => {
    expect(() => Locale.t(new URL("https://example.com/fi/about"))("nav.missing")).toThrow(
      'Missing translation key "nav.missing"'
    )
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

describe("Locale.redirect", () => {
  function makeAstro(pathname: string, cookieLocale?: string) {
    return {
      url: new URL(`https://example.com${pathname}`),
      cookies: {
        get: (name: string) =>
          name === "locale" && cookieLocale ? { value: cookieLocale } : undefined,
      },
      redirect: (path: string, status?: number) => ({ path, status }) as unknown as Response,
    }
  }

  it("returns null when path already has a valid locale prefix", () => {
    expect(Locale.redirect(makeAstro("/en/about"))).toBeNull()
    expect(Locale.redirect(makeAstro("/fi/banana"))).toBeNull()
    expect(Locale.redirect(makeAstro("/en/"))).toBeNull()
  })

  it("redirects unprefixed path to defaultLocale when no cookie", () => {
    const result = Locale.redirect(makeAstro("/about")) as any
    expect(result.path).toBe("/en/about")
    expect(result.status).toBe(302)
  })

  it("redirects unprefixed path to cookie locale when cookie is set", () => {
    const result = Locale.redirect(makeAstro("/about", "fi")) as any
    expect(result.path).toBe("/fi/about")
    expect(result.status).toBe(302)
  })

  it("redirects to defaultLocale when cookie has an invalid locale", () => {
    const result = Locale.redirect(makeAstro("/about", "de")) as any
    expect(result.path).toBe("/en/about")
    expect(result.status).toBe(302)
  })

  it("redirects root unprefixed path to defaultLocale", () => {
    const result = Locale.redirect(makeAstro("/")) as any
    expect(result.path).toBe("/en/")
    expect(result.status).toBe(302)
  })

  it("redirects unknown path to cookie locale", () => {
    const result = Locale.redirect(makeAstro("/banana", "fi")) as any
    expect(result.path).toBe("/fi/banana")
    expect(result.status).toBe(302)
  })
})
