export const NAME = "@mannisto/astro-i18n"

/**
 * The lifetime of the locale cookie in seconds: one year.
 */
export const COOKIE_AGE = 60 * 60 * 24 * 365

/**
 * The route pattern of the injected on-demand catch-all route.
 */
export const FALLBACK_PATTERN = "/[...i18nFallback]"
