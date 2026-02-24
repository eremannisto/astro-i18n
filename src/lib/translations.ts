import type { ResolvedI18nConfig } from "../types"

/**
 * Flat key-value translation record for a single locale
 */
type TranslationRecord = Record<string, string>

/**
 * All loaded translations keyed by locale code
 */
type TranslationStore = Record<string, TranslationRecord>

/**
 * In-memory translation store —
 * populated at runtime via the virtual module
 */
let store: TranslationStore = {}

/**
 * Initialise the translation store directly with pre-loaded data.
 * Called by the virtual module at runtime.
 */
export function initTranslations(data: TranslationStore): void {
  store = data
}

/**
 * Translation utilities for loading and accessing flat JSON translation files.
 * Translations are loaded at build time and injected via virtual module at runtime.
 */
export const Translations = {
  /**
   * Loads all translation files into memory from the filesystem.
   * Called once at build time in astro:config:done.
   */
  load(config: ResolvedI18nConfig): TranslationStore {
    const result: TranslationStore = {}
    // dynamic import of fs — only available at build time
    const fs = await_fs()
    for (const locale of config.locales) {
      const filePath = `${config.translations}/${locale.code}.json`
      const raw = fs.readFileSync(filePath, "utf-8")
      result[locale.code] = JSON.parse(raw)
    }
    store = result
    return result
  },

  /**
   * Returns the full translation record for a locale.
   * Used by Locale.t(locale) with no key argument.
   */
  get(locale: string): TranslationRecord {
    return store[locale] ?? {}
  },

  /**
   * Returns a single translated string for a locale and key.
   * Used by Locale.t(locale, "nav.home").
   * Throws if locale or key is not found.
   */
  key(locale: string, key: string): string {
    const translations = store[locale]
    if (!translations) {
      throw new Error(`[@mannisto/astro-i18n] No translations loaded for locale "${locale}".`)
    }
    if (!(key in translations)) {
      throw new Error(`[@mannisto/astro-i18n] Missing key "${key}" in ${locale}.json`)
    }
    return translations[key]
  },
}

/**
 * Lazy fs import — only works at build time / Node environment
 */
function await_fs() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("node:fs")
}
