import { NAME } from "../constants"
import type { I18nConfig, ResolvedI18nConfig } from "../types"

export const Config = {
  /**
   * Applies defaults to the raw user config and returns a fully resolved config.
   */
  resolve(config: I18nConfig): ResolvedI18nConfig {
    return {
      locales: config.locales,
      defaultLocale: config.defaultLocale ?? config.locales[0].code,
      ignore: ["/_astro", ...(config.ignore ?? [])],
      translations: config.translations,
    }
  },

  /**
   * Validates the full config before it is resolved.
   */
  validate(config: I18nConfig, hasAdapter: boolean): void {
    // Locales must be defined and each code must be non-empty
    if (!config.locales || config.locales.length === 0) {
      throw new Error(`${NAME} No locales defined.`)
    }

    for (const locale of config.locales) {
      // Locale code must be defined
      if (!locale.code) {
        throw new Error(`${NAME} A locale is missing a code.`)
      }

      // Locale code must be valid
      if (!/^[a-zA-Z0-9-]+$/.test(locale.code)) {
        throw new Error(
          `${NAME} Locale code "${locale.code}" contains invalid characters. Only letters, numbers, and hyphens are allowed.`
        )
      }

      // Locale direction must be valid
      if (locale.direction && locale.direction !== "ltr" && locale.direction !== "rtl") {
        throw new Error(
          `${NAME} Locale "${locale.code}" has an invalid direction "${locale.direction}". Must be "ltr" or "rtl".`
        )
      }
    }

    // Locales must be unique
    const codes = config.locales.map((l) => l.code)
    const duplicates = codes.filter((c, i) => codes.indexOf(c) !== i)
    if (duplicates.length > 0) {
      throw new Error(`${NAME} Duplicate locale codes: ${duplicates.join(", ")}.`)
    }

    // Default locale must exist in the locales array
    if (config.defaultLocale && !codes.includes(config.defaultLocale)) {
      throw new Error(`${NAME} defaultLocale "${config.defaultLocale}" not found in locales.`)
    }

    // Ignore requires a server adapter — it only takes effect via middleware
    if (config.ignore && !hasAdapter) {
      throw new Error(`${NAME} "ignore" requires a server adapter.`)
    }
  },
}
