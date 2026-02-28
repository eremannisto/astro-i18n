import { config, translations } from "virtual:astro-i18n/config"
import type { LocaleCode, LocaleConfig } from "../types"

const NAME = "@mannisto/astro-i18n"

/**
 * Sets a cookie using the Cookie Store API if available, otherwise falls back to document.cookie.
 */
function setCookie(name: string, value: string): void {
  if ("cookieStore" in window) {
    void window.cookieStore.set({ name, value, path: "/", sameSite: "lax" })
  } else {
    // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API not available
    document.cookie = `${name}=${value}; path=/; SameSite=Lax`
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
  from(url: URL): LocaleCode {
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
  get(code?: LocaleCode): LocaleConfig | LocaleConfig[] {
    if (code) {
      const found = config.locales.find((l: LocaleConfig) => l.code === code)
      if (!found) throw new Error(`${NAME} Locale "${code}" not found.`)
      return found
    }
    return config.locales
  },

  /**
   * Returns a translation function for the specified locale.
   * The returned function accepts a translation key and returns the translated string.
   * Throws if translations are not configured or if a key is missing.
   */
  use(locale: LocaleCode): (key: string) => string {
    if (!config.translations) {
      console.warn(
        `${NAME} Locale.use() was called but translations are not configured. ` +
          `Add a translations path to your i18n config to enable translations.`
      )
      return () => ""
    }

    const record = translations[locale]
    if (!record) throw new Error(`${NAME} No translations found for locale "${locale}".`)

    return (key: string): string => {
      if (!(key in record)) {
        throw new Error(`${NAME} Missing translation key "${key}" in ${locale}.json`)
      }
      return record[key]
    }
  },
}
