// ============================================================================
// Locale
// ============================================================================

/** A locale code, e.g. "en", "fi", "fr" */
export type LocaleCode = string

/** Configuration for a single locale */
export type LocaleConfig = {
  /** The locale code, e.g. "en" */
  code: LocaleCode

  /** The locale name in English, e.g. "English" */
  name: string

  /** The locale name in its own language, e.g. "Suomi" */
  endonym: string

  /** Optional short phrase for locale switchers, e.g. "Suomeksi" */
  phrase?: string
}

// ============================================================================
// Routing
// ============================================================================

/**
 * How the user's preferred locale is detected on their first visit.
 *
 * - "server" — reads the Accept-Language header via a server-side API route
 * - "client" — reads navigator.language via a static JS redirect page
 * - "none"   — no detection, user must navigate to a locale URL directly
 */
export type DetectionMode = "server" | "client" | "none"

/**
 * Configuration for the autoPrefix middleware.
 * Only valid when detection is "server".
 */
export type AutoPrefixConfig = {
  /**
   * URL path prefixes that should bypass the autoPrefix middleware.
   * Useful for CMS admin routes, API routes, etc.
   *
   * @example ["/keystatic", "/api"]
   */
  ignore?: string[]
}

/** User-supplied routing configuration */
export type RoutingConfig = {
  /**
   * The locale code to fall back to when no match is found.
   * Defaults to the first locale in the locales array.
   */
  fallback?: LocaleCode

  /**
   * How the user's preferred locale is detected on first visit.
   * @default "client"
   */
  detection?: DetectionMode

  /**
   * When enabled, the middleware automatically prefixes unknown routes
   * with the user's preferred locale. Only valid when detection is "server".
   *
   * Set to false to disable entirely, or pass an object to configure
   * which paths should be ignored.
   *
   * @default { ignore: ["/_astro"] }
   */
  autoPrefix?: boolean | AutoPrefixConfig
}

// ============================================================================
// Resolved config
// ============================================================================

/** Routing config after defaults have been applied */
export type ResolvedRoutingConfig = {
  fallback: LocaleCode
  detection: DetectionMode
  autoPrefix: AutoPrefixConfig | false
}

/** Full config after defaults have been applied */
export type ResolvedI18nConfig = {
  locales: LocaleConfig[]
  routing: ResolvedRoutingConfig

  /**
   * Path to the translations directory, relative to the project root.
   * Undefined if translations are not configured.
   */
  translations: string | undefined
}

// ============================================================================
// User config
// ============================================================================

/** The configuration object passed to the i18n() integration */
export type I18nConfig = {
  /** The list of supported locales, in order of preference */
  locales: LocaleConfig[]

  /** Routing and detection options */
  routing?: RoutingConfig

  /**
   * Path to the translations directory, relative to the project root.
   * Each locale should have a corresponding JSON file, e.g. en.json, fi.json.
   * If not set, translations are disabled and Locale.t() will warn when called.
   *
   * @example "./src/translations"
   */
  translations?: string
}
