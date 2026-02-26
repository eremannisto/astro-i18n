import { defineMiddleware } from "astro/middleware"
import { config, translations } from "virtual:astro-i18n/config"
import type { LocaleCode, LocaleConfig } from "../types"

const NAME = "@mannisto/astro-i18n"

/**
 * Primary public API for locale access, translations, and middleware.
 *
 * Always import from the runtime subpath in pages and components:
 * @example
 * import { Locale } from "@mannisto/astro-i18n/runtime"
 */
export const Locale = {
  // ==========================================================================
  // Locale access
  // ==========================================================================

  /**
   * All supported locale codes.
   * @example ["en", "fi"]
   */
  get supported(): LocaleCode[] {
    return config.locales.map((l: LocaleConfig) => l.code)
  },

  /**
   * The default locale code.
   * @example "en"
   */
  get defaultLocale(): LocaleCode {
    return config.defaultLocale
  },

  /**
   * Derives the current locale from the given URL.
   * Falls back to defaultLocale if no supported locale is found in the path.
   *
   * @example
   * const locale = Locale.from(Astro.url)
   */
  from(url: URL): LocaleCode {
    const firstSegment = url.pathname.split("/")[1]
    return config.locales.map((l: LocaleConfig) => l.code).includes(firstSegment)
      ? firstSegment
      : config.defaultLocale
  },

  /**
   * Returns the config for all locales, or a single locale by code.
   * Throws if the requested code is not found.
   *
   * @example
   * Locale.get()       // All locales
   * Locale.get("fi")   // Single locale
   */
  get(code?: LocaleCode): LocaleConfig | LocaleConfig[] {
    if (code) {
      const found = config.locales.find((l: LocaleConfig) => l.code === code)
      if (!found) {
        throw new Error(`${NAME} Locale "${code}" not found.`)
      }
      return found
    }
    return config.locales
  },

  /**
   * Builds a locale-prefixed URL from a locale code and an optional path.
   * If no path is provided, returns the locale root.
   *
   * @example
   * Locale.url("fi")                     // "/fi/"
   * Locale.url("fi", "/about")           // "/fi/about"
   * Locale.url("fi", Astro.url.pathname) // "/fi/current-path"
   */
  url(locale: LocaleCode, path?: string): string {
    if (!path || path === "/") return `/${locale}/`

    // Strip existing locale prefix if present so we don't double-prefix
    const firstSegment = path.split("/")[1]
    const strippedPath = config.locales.map((l: LocaleConfig) => l.code).includes(firstSegment)
      ? path.slice(firstSegment.length + 1) || "/"
      : path

    return `/${locale}${strippedPath}`
  },

  /**
   * Switches the current locale client-side. Updates localStorage and
   * cookie so the preference persists across visits, then navigates to
   * the equivalent page in the new locale.
   *
   * Browser-only — logs a warning if called on the server.
   *
   * Updates both localStorage (static mode) and cookie (server/hybrid mode)
   * so it works correctly regardless of which mode the site uses.
   *
   * @example
   * Locale.switch("fi")           // Navigate to /fi/ from current page
   * Locale.switch("fi", "/about") // Navigate to /fi/about
   */
  switch(locale: LocaleCode, path?: string): void {
    if (typeof window === "undefined") {
      console.warn(`${NAME} Locale.switch() can only be called in the browser.`)
      return
    }

    // Update localStorage for static mode
    localStorage.setItem("locale", locale)

    // Update cookie for server/hybrid mode
    // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API has limited browser support
    document.cookie = `locale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax; Secure`

    // Navigate to the equivalent page in the new locale
    window.location.href = Locale.url(locale, path ?? window.location.pathname)
  },

  // ==========================================================================
  // Translations
  // ==========================================================================

  /**
   * Binds a locale and returns a translation function for that locale.
   *
   * Call once at the top of your page with the current locale, then use
   * the returned function to look up keys by name.
   *
   * Warns if translations are not configured.
   * Throws if the locale or key is not found.
   *
   * @example
   * const t = Locale.use(locale)
   * t("nav.home")  // "Home"
   */
  use(locale: LocaleCode): (key: string) => string {
    // Warn if translations were not configured
    if (!config.translations) {
      console.warn(
        `${NAME} Locale.use() was called but translations are not configured. ` +
          `Add a translations path to your i18n config to enable translations.`
      )
      return () => ""
    }

    const record = translations[locale]

    return (key: string): string => {
      if (!record) {
        throw new Error(`${NAME} No translations found for locale "${locale}".`)
      }
      if (!(key in record)) {
        throw new Error(`${NAME} Missing translation key "${key}" in ${locale}.json`)
      }
      return record[key]
    }
  },

  // ==========================================================================
  // Middleware
  // ==========================================================================

  /**
   * Middleware that redirects requests without a locale prefix to the
   * correct locale based on the user's cookie, and updates the cookie
   * when the user navigates to a new locale.
   *
   * Auto-registered in server mode. Can also be used manually via
   * Astro's sequence() helper.
   *
   * @example
   * import { sequence } from "astro/middleware"
   * import { Locale } from "@mannisto/astro-i18n/runtime"
   * export const onRequest = sequence(Locale.middleware, myMiddleware)
   */
  middleware: defineMiddleware(({ url, cookies, locals, redirect }, next) => {
    const pathname = url.pathname

    // Pass through ignored paths (e.g. /_astro, /keystatic)
    if (config.ignore.some((path: string) => pathname.startsWith(path))) {
      return next()
    }

    // Pass through root — handled by the detection route
    if (pathname === "/") {
      return next()
    }

    const supportedCodes = config.locales.map((l: LocaleConfig) => l.code)
    const firstSegment = pathname.split("/")[1]

    // If the path has a known locale prefix, update cookie if changed
    // and set locals.locale for use in pages and components
    if (supportedCodes.includes(firstSegment)) {
      const stored = cookies.get("locale")?.value
      if (stored !== firstSegment) {
        cookies.set("locale", firstSegment, {
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
          sameSite: "lax",
          secure: true,
        })
      }
      locals.locale = firstSegment
      return next()
    }

    // No locale prefix — redirect to stored cookie locale or defaultLocale
    const stored = cookies.get("locale")?.value
    const targetLocale = stored && supportedCodes.includes(stored) ? stored : config.defaultLocale

    return redirect(`/${targetLocale}${pathname}`, 302)
  }),
}
