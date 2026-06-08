import { config, translations } from "virtual:astro-i18n/config"

import { NAME } from "../constants"
import type { AstroContext, LocaleCode, LocaleConfig, LocaleInstance } from "../types"

/**
 * Sets a cookie using the Cookie Store API if available, otherwise falls back to document.cookie.
 */
function setCookie(name: string, value: string): void {
  if ("cookieStore" in window) {
    void window.cookieStore.set({ name, value, path: "/", sameSite: "lax" })
    return
  }
  // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API not available
  document.cookie = `${name}=${value}; path=/; SameSite=Lax`
}

/**
 * Returns locale configuration by code, or all locales if no code is provided.
 * Throws if the specified locale code is not found.
 */
function getLocale(): LocaleConfig[]
function getLocale(code: LocaleCode): LocaleConfig
function getLocale(code?: LocaleCode): LocaleConfig | LocaleConfig[] {
  if (code) {
    const found = config.locales.find((l: LocaleConfig) => l.code === code)
    if (!found) throw new Error(`${NAME} Locale "${code}" not found.`)
    return found
  }
  return config.locales
}

/**
 * Returns a translation lookup function for the given locale.
 * Throws at call time if translations are not configured or a key is missing.
 */
function buildTranslator(code: LocaleCode): (key: string) => string {
  if (!config.translations) {
    return (key: string) => {
      throw new Error(
        `${NAME} t("${key}") was called but translations are not configured. ` +
          `Add a translations path to your i18n config to enable translations.`
      )
    }
  }
  const record = translations[code]
  if (!record) throw new Error(`${NAME} No translations found for locale "${code}".`)
  return (key: string): string => {
    if (!(key in record))
      throw new Error(`${NAME} Missing translation key "${key}" in ${code}.json`)
    return record[key]
  }
}

/**
 * Returns a response function that redirects to the correct locale prefix if missing.
 * Returns null if the URL already has a valid locale prefix.
 */
function buildResponse(astro: AstroContext): () => Response | null {
  return () => {
    const firstSegment = astro.url.pathname.split("/").filter(Boolean)[0]
    const codes = config.locales.map((l: LocaleConfig) => l.code)
    if (codes.includes(firstSegment)) return null
    const cookie = astro.cookies.get("locale")?.value
    const locale = cookie && codes.includes(cookie) ? cookie : config.defaultLocale
    return astro.redirect(`/${locale}${astro.url.pathname}`, 302)
  }
}

/**
 * Locale utilities for managing i18n locale detection, URL generation, and switching.
 * Works with the virtual module configuration injected at build time.
 */
export const Locale = {
  /**
   * Returns an array of all supported locale codes.
   */
  get supported(): LocaleCode[] {
    return config.locales.map((l: LocaleConfig) => l.code)
  },

  /**
   * Returns the default locale code from the configuration.
   */
  get defaultLocale(): LocaleCode {
    return config.defaultLocale
  },

  /**
   * Extracts the locale code from a URL pathname.
   * Falls back to the default locale if no valid locale prefix is found.
   */
  fromURL(url: URL): LocaleCode {
    const first = url.pathname.split("/")[1]
    const codes = config.locales.map((l: LocaleConfig) => l.code)
    return codes.includes(first) ? first : config.defaultLocale
  },

  /**
   * Generates a locale-prefixed URL path.
   * Strips any existing locale prefix and prepends the specified locale.
   */
  url(locale: LocaleCode, path = "/"): string {
    const codes = config.locales.map((l: LocaleConfig) => l.code)
    const clean = path.startsWith("/") ? path : `/${path}`
    const segments = clean.split("/")
    const stripped = codes.includes(segments[1]) ? `/${segments.slice(2).join("/")}` : clean
    return stripped === "/" ? `/${locale}/` : `/${locale}${stripped}`
  },

  /**
   * Switches the current locale and navigates to the new locale URL.
   * Sets a cookie to persist the preference and redirects the browser.
   * Only available in browser context.
   */
  switch(locale: LocaleCode, path?: string): void {
    if (typeof window === "undefined") {
      console.warn(`${NAME} Locale.switch() can only be called in the browser.`)
      return
    }
    setCookie("locale", locale)
    window.location.assign(Locale.url(locale, path ?? window.location.pathname))
  },

  /**
   * Returns locale configuration by code, or all locales if no code is provided.
   * Throws if the specified locale code is not found.
   */
  get: getLocale,

  /**
   * Accepts the full Astro context and returns a request-scoped instance.
   * All instance members are bound at creation time and safe to destructure.
   */
  use(astro: AstroContext): LocaleInstance {
    const code = Locale.fromURL(astro.url)
    const localeConfig = getLocale(code)
    return {
      code,
      name: localeConfig.name,
      endonym: localeConfig.endonym,
      phrase: localeConfig.phrase,
      direction: localeConfig.direction ?? "ltr",
      t: buildTranslator(code),
      response: buildResponse(astro),
    }
  },

  /**
   * Generates hreflang link objects for all supported locales, plus an x-default entry.
   * Useful for rendering <link rel="alternate"> tags for SEO.
   */
  hreflang(url: URL, site: string | URL): { href: string; hreflang: string }[] {
    const base = typeof site === "string" ? site : site.href
    return [
      ...config.locales.map((l: LocaleConfig) => ({
        href: new URL(Locale.url(l.code, url.pathname), base).href,
        hreflang: l.code,
      })),
      {
        href: new URL(Locale.url(config.defaultLocale, url.pathname), base).href,
        hreflang: "x-default",
      },
    ]
  },
}
