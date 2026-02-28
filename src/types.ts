/**
 * A locale code, e.g. "en", "fi", "fr"
 */
export type LocaleCode = string

/**
 * Configuration for a single locale
 */
export type LocaleConfig = {
  /**
   * The locale code, e.g. "en"
   */
  code: LocaleCode

  /**
   * The locale name in English, e.g. "English"
   */
  name: string

  /**
   * The locale name in its own language, e.g. "Suomi"
   */
  endonym: string

  /**
   * Optional short phrase for locale switchers, e.g. "Suomeksi"
   */
  phrase?: string
}

/**
 * How the site handles locale detection and page rendering.
 *
 * - "static"  — prerendered pages, localStorage for preference storage
 * - "server"  — server-rendered pages, cookie for preference storage
 * - "hybrid"  — static pages, server-rendered / only, cookie via client-side JS
 */
export type I18nMode = "static" | "server" | "hybrid"

/**
 * The configuration object passed to the i18n() integration
 */
export type I18nConfig = {
  /**
   * The list of supported locales, in order of preference
   */
  locales: LocaleConfig[]

  /**
   * How the site handles locale detection and page rendering.
   * @default "static"
   */
  mode?: I18nMode

  /**
   * The default locale code to use when no preference is stored.
   * Defaults to the first locale in the locales array.
   */
  defaultLocale?: LocaleCode

  /**
   * URL path prefixes that should bypass the middleware.
   * Only applies in "server" or "hybrid" mode.
   * Always includes "/_astro" internally.
   *
   * @example ["/keystatic", "/api"]
   */
  ignore?: string[]

  /**
   * Path to the translations directory, relative to the project root.
   * Each locale should have a corresponding JSON file, e.g. en.json, fi.json.
   * If not set, translations are disabled.
   *
   * @example "./src/translations"
   */
  translations?: string
}

/**
 * Full config after defaults have been applied
 **/
export type ResolvedI18nConfig = {
  locales: LocaleConfig[]
  mode: I18nMode
  defaultLocale: LocaleCode
  ignore: string[]
  translations: string | undefined
}
