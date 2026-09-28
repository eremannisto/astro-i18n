import fs from "node:fs"
import type { AstroIntegrationLogger } from "astro"

import { NAME } from "../constants"
import type { ResolvedI18nConfig } from "../types"

export const Translations = {
  /**
   * Loads translation JSON files for all configured locales.
   * Throws if a translation file is missing.
   */
  load(config: ResolvedI18nConfig): Record<string, Record<string, string>> {
    const data: Record<string, Record<string, string>> = {}
    for (const locale of config.locales) {
      const filePath = `${config.translations}/${locale.code}.json`
      if (!fs.existsSync(filePath)) throw new Error(`${NAME} Missing translation file: ${filePath}`)
      try {
        data[locale.code] = JSON.parse(fs.readFileSync(filePath, "utf-8"))
      } catch (e) {
        throw new Error(`${NAME} Invalid JSON in ${filePath}: ${(e as Error).message}`)
      }
    }
    return data
  },

  /**
   * Warns about translation keys present in the default locale but missing in other locales.
   * Does not throw — t() returns the key name for a missing key.
   */
  validate(
    data: Record<string, Record<string, string>>,
    defaultLocale: string,
    logger: AstroIntegrationLogger
  ): void {
    const defaultKeys = new Set(Object.keys(data[defaultLocale]))
    for (const [code, record] of Object.entries(data)) {
      if (code === defaultLocale) continue
      const keys = new Set(Object.keys(record))
      for (const key of defaultKeys) {
        if (!keys.has(key)) logger.warn(`Missing translation key "${key}" in ${code}.json`)
      }
    }
  },
}
