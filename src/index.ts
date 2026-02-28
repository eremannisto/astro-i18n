import type { AstroIntegration } from "astro"
import type { I18nConfig, ResolvedI18nConfig } from "./types"
import { Validate } from "./lib/validate"

const NAME = "@mannisto/astro-i18n"
const DEFAULT_IGNORE = ["/_astro"]

function resolveConfig(config: I18nConfig): ResolvedI18nConfig {
  const mode = config.mode ?? "static"
  const defaultLocale = config.defaultLocale ?? config.locales[0].code
  const ignore = [...DEFAULT_IGNORE, ...(config.ignore ?? [])]

  return {
    locales: config.locales,
    mode,
    defaultLocale,
    ignore,
    translations: config.translations,
  }
}

export default function i18n(config: I18nConfig): AstroIntegration {
  let resolved: ResolvedI18nConfig
  let translationData: Record<string, Record<string, string>> = {}

  return {
    name: NAME,
    hooks: {
      // Validates config, registers the Vite virtual module plugin, injects
      // detection routes, and registers the middleware.
      "astro:config:setup": ({
        config: astroConfig,
        updateConfig,
        injectRoute,
        addMiddleware,
        logger,
      }) => {
        // Warn if Astro's built-in i18n is also configured
        if (astroConfig.i18n) {
          logger.warn(
            "Astro's built-in i18n is configured. " +
              "Remove the i18n key from astro.config to avoid conflicts."
          )
        }

        Validate.config(config)
        Validate.index(astroConfig.root, config.mode)

        resolved = resolveConfig(config)

        updateConfig({
          vite: {
            // Exclude from Vite's dependency pre-bundling — the virtual module
            // is resolved by the plugin below and must not be pre-bundled
            optimizeDeps: {
              exclude: ["@mannisto/astro-i18n"],
            },
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

        // Static mode — inject a prerendered static route at /
        if (resolved.mode === "static") {
          injectRoute({
            pattern: "/",
            entrypoint: "@mannisto/astro-i18n/detect/static",
            prerender: true,
          })
        }

        // Server mode — inject a server-side route at /
        if (resolved.mode === "server") {
          injectRoute({
            pattern: "/",
            entrypoint: "@mannisto/astro-i18n/detect/server",
            prerender: false,
          })
        }

        // Hybrid mode — inject a server-side route at /
        // Only / is server-rendered, all locale pages remain static
        if (resolved.mode === "hybrid") {
          injectRoute({
            pattern: "/",
            entrypoint: "@mannisto/astro-i18n/detect/hybrid",
            prerender: false,
          })
        }

        // Middleware — only registered for server mode
        if (resolved.mode === "server") {
          addMiddleware({
            entrypoint: "@mannisto/astro-i18n/middleware",
            order: "pre",
          })
        }

        logger.info("i18n configured.")
      },

      // Validates and loads translation files only if translations are
      // configured. Runs after all integrations have finished setup.
      "astro:config:done": () => {
        if (resolved.translations) {
          translationData = Validate.translations(resolved)
        }
      },
    },
  }
}
