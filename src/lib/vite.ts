import type { ResolvedI18nConfig } from "../types"

/**
 * The name of the Vite plugin.
 */
const NAME = "astro-i18n-virtual"

/**
 * The virtual ID of the Vite plugin.
 */
const VIRTUAL_ID = "virtual:astro-i18n/config"

/**
 * The resolved ID of the Vite plugin.
 */
export const RESOLVED_ID = `\0${VIRTUAL_ID}`

/**
 * Creates a Vite plugin that makes `virtual:astro-i18n/config` importable
 * anywhere in the project without a real file on disk.
 *
 * Accepts getters instead of plain values so that every load call reads the
 * latest state — important during dev when config or translations hot-reload.
 *
 * `resolveId` and `load` are fixed Vite/Rollup plugin hook names.
 */
export function createVitePlugin(
  getConfig: () => ResolvedI18nConfig,
  getTranslations: () => Record<string, Record<string, string>>
) {
  return {
    name: NAME,

    // Vite hook — intercepts import resolution. Maps the virtual specifier
    // to the \0-prefixed internal ID so Vite knows this plugin owns it.
    resolveId(id: string) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },

    // Vite hook — generates the module source for the resolved ID.
    // Serialises the current config and translations as a JS module.
    load(id: string) {
      if (id === RESOLVED_ID) {
        return `
          export const config = ${JSON.stringify(getConfig())}
          export const translations = ${JSON.stringify(getTranslations())}
        `
      }
    },
  }
}
