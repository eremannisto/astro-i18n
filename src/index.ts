import type { AstroIntegration } from "astro"
import type { I18nConfig, ResolvedI18nConfig } from "./types"
import { Validate } from "./lib/validate"

const NAME = "@mannisto/astro-i18n"
const DEFAULT_IGNORE = ["/_astro"]

// ============================================================================
// Config resolution
// ============================================================================

function resolveConfig(config: I18nConfig): ResolvedI18nConfig {
  const fallback = config.routing?.fallback ?? config.locales[0].code
  const detection = config.routing?.detection ?? "client"

  // autoPrefix is only valid with server detection, and defaults to enabled
  // with /_astro ignored. users can extend the ignore list or disable entirely.
  const autoPrefix =
    config.routing?.autoPrefix === false
      ? false
      : {
          ignore: [
            ...DEFAULT_IGNORE,
            ...(typeof config.routing?.autoPrefix === "object"
              ? (config.routing.autoPrefix.ignore ?? [])
              : []),
          ],
        }

  return {
    locales: config.locales,
    routing: { fallback, detection, autoPrefix },

    // translations are optional — undefined means disabled
    translations: config.translations,
  }
}

// ============================================================================
// Integration
// ============================================================================

/**
 * The @mannisto/astro-i18n Astro integration.
 *
 * Adds locale routing, detection, and translations to your Astro project
 * without relying on Astro's built-in i18n system.
 *
 * @example
 * import i18n from "@mannisto/astro-i18n"
 *
 * export default defineConfig({
 *   integrations: [
 *     i18n({
 *       locales: [
 *         { code: "en", name: "English", endonym: "English" },
 *         { code: "fi", name: "Finnish", endonym: "Suomi", phrase: "Suomeksi" },
 *       ],
 *       routing: {
 *         fallback: "en",
 *         detection: "server",
 *         autoPrefix: { ignore: ["/keystatic"] },
 *       },
 *       translations: "./src/translations",
 *     }),
 *   ],
 * })
 */
export default function i18n(config: I18nConfig): AstroIntegration {
  let resolved: ResolvedI18nConfig
  let translationData: Record<string, Record<string, string>> = {}

  return {
    name: NAME,
    hooks: {
      // ======================================================================
      // astro:config:setup
      //
      // Validates config, registers the Vite virtual module plugin, injects
      // detection routes, and registers the autoPrefix middleware.
      // ======================================================================
      "astro:config:setup": ({
        config: astroConfig,
        updateConfig,
        injectRoute,
        addMiddleware,
        logger,
      }) => {
        // warn if Astro's built-in i18n is also configured
        if (astroConfig.i18n) {
          logger.warn(
            "Astro's built-in i18n is configured. " +
              "Remove the i18n key from astro.config to avoid conflicts."
          )
        }

        Validate.config(config)
        Validate.index(astroConfig.root, config.routing?.detection ?? "client")

        resolved = resolveConfig(config)

        // Virtual module plugin — bakes resolved config and translations into
        // the bundle so locale.ts can import them as plain static values at
        // runtime. load() is called lazily so translationData is fully
        // populated by astro:config:done before any page imports the module.
        updateConfig({
          vite: {
            plugins: [
              {
                name: "astro-i18n-virtual",
                resolveId(id: string) {
                  if (id === "virtual:astro-i18n/config") {
                    return "\0virtual:astro-i18n/config"
                  }
                },
                load(id: string) {
                  if (id === "\0virtual:astro-i18n/config") {
                    return `
export const config = ${JSON.stringify(resolved)}
export const translations = ${JSON.stringify(translationData)}
`
                  }
                },
              },
            ],
          },
        })

        // server detection — inject a server-side API route at /
        // requires an adapter for production builds
        if (resolved.routing.detection === "server") {
          injectRoute({
            pattern: "/",
            entrypoint: "@mannisto/astro-i18n/detect/server",
            prerender: false,
          })
        }

        // client detection — inject a prerendered static route at /
        // works in both dev and production without an adapter
        if (resolved.routing.detection === "client") {
          injectRoute({
            pattern: "/",
            entrypoint: "@mannisto/astro-i18n/detect/client",
            prerender: true,
          })
        }

        // autoPrefix middleware — only with server detection
        if (resolved.routing.detection === "server" && resolved.routing.autoPrefix !== false) {
          addMiddleware({
            entrypoint: "@mannisto/astro-i18n/middleware",
            order: "pre",
          })
        }

        logger.info("i18n configured.")
      },

      // ======================================================================
      // astro:config:done
      //
      // Validates and loads translation files only if translations are
      // configured. Runs after all integrations have finished setup.
      // ======================================================================
      "astro:config:done": () => {
        if (resolved.translations) {
          translationData = Validate.translations(resolved)
        }
      },
    },
  }
}
