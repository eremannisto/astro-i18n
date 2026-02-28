import fs from "node:fs"
import type { I18nConfig, ResolvedI18nConfig } from "../types"

const NAME = "@mannisto/astro-i18n"

const VALID_MODES = ["static", "server", "hybrid"] as const

export const Validate = {
  /**
   * Validates the user-supplied config object.
   * Throws a descriptive error if anything is invalid.
   */
  config(config: I18nConfig): void {
    // Locales must be defined and non-empty
    if (!config.locales || config.locales.length === 0) {
      throw new Error(`${NAME} No locales defined.`)
    }

    // Each locale must have a code, name, and endonym
    for (const locale of config.locales) {
      if (!locale.code) {
        throw new Error(`${NAME} A locale is missing a code.`)
      }
      if (!locale.name) {
        throw new Error(`${NAME} Locale "${locale.code}" is missing a name.`)
      }
      if (!locale.endonym) {
        throw new Error(`${NAME} Locale "${locale.code}" is missing an endonym.`)
      }
    }

    // One of the defined locales must be the defaultLocale
    if (config.defaultLocale) {
      const codes = config.locales.map((l) => l.code)
      if (!codes.includes(config.defaultLocale)) {
        throw new Error(`${NAME} defaultLocale "${config.defaultLocale}" not found in locales.`)
      }
    }

    // Mode must be one of the valid options if provided
    if (config.mode && !VALID_MODES.includes(config.mode as (typeof VALID_MODES)[number])) {
      throw new Error(
        `${NAME} Invalid mode "${config.mode}". Must be one of: ${VALID_MODES.join(", ")}.`
      )
    }

    // Ignore is only meaningful in server or hybrid mode
    if (config.ignore && config.mode === "static") {
      throw new Error(`${NAME} "ignore" is only valid when mode is "server" or "hybrid".`)
    }
  },

  /**
   * Validates that translation files exist for all locales and that all
   * locales share the same keys as the default locale.
   *
   * Returns the loaded translation data for use in the virtual module.
   */
  translations(config: ResolvedI18nConfig): Record<string, Record<string, string>> {
    const data: Record<string, Record<string, string>> = {}

    // Load each locale's translation file
    for (const locale of config.locales) {
      const filePath = `${config.translations}/${locale.code}.json`
      if (!fs.existsSync(filePath)) {
        throw new Error(`${NAME} Missing translation file: ${filePath}`)
      }
      data[locale.code] = JSON.parse(fs.readFileSync(filePath, "utf-8"))
    }

    // All locales must have the same keys as the default locale
    const defaultKeys = Object.keys(data[config.defaultLocale])
    for (const locale of config.locales) {
      if (locale.code === config.defaultLocale) continue
      const localeKeys = Object.keys(data[locale.code])
      for (const key of defaultKeys) {
        if (!localeKeys.includes(key)) {
          throw new Error(`${NAME} Missing translation key "${key}" in ${locale.code}.json`)
        }
      }
    }

    return data
  },

  /**
   * Validates that there is no conflicting src/pages/index.astro when
   * mode is not undefined. If one exists it would intercept the injected
   * detection route at /.
   */
  index(root: URL, mode: string | undefined): void {
    if (!mode) return
    const indexPath = new URL("./src/pages/index.astro", root)
    if (fs.existsSync(indexPath)) {
      throw new Error(`${NAME} Found conflicting src/pages/index.astro — remove it.`)
    }
  },

  /**
   * Validates that there is no conflicting catch-all route when mode is
   * "hybrid". A [...path].astro or [...path].ts would intercept the injected
   * redirect route.
   */
  catchall(root: URL, mode: string | undefined): void {
    if (mode !== "hybrid") return
    const candidates = [
      new URL("./src/pages/[...path].astro", root),
      new URL("./src/pages/[...path].ts", root),
    ]
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        throw new Error(
          `${NAME} Found conflicting ${candidate.pathname.split("/src/pages/")[1]} — remove it or switch to "server" mode.`
        )
      }
    }
  },
}
