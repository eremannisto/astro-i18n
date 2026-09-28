import fs from "node:fs"
import path from "node:path"
import type { AstroIntegration, AstroIntegrationLogger } from "astro"

import { FALLBACK_PATTERN, NAME } from "./constants"
import { Config } from "./lib/config"
import { Output } from "./lib/output"
import { Translations } from "./lib/translations"
import { createVitePlugin, RESOLVED_ID } from "./lib/vite"
import type { I18nConfig, ResolvedI18nConfig } from "./types"

export type {
  I18nConfig,
  LocaleCode,
  LocaleConfig,
  LocaleDirection,
  LocaleInstance,
  TranslationValues,
} from "./types"

/**
 * Watches the translations directory for JSON file changes during dev.
 * On change, reloads translations and triggers a full HMR reload.
 * No-ops if translations are not configured.
 */
function watchTranslations(
  server: Parameters<NonNullable<AstroIntegration["hooks"]["astro:server:setup"]>>[0]["server"],
  resolved: ResolvedI18nConfig,
  logger: AstroIntegrationLogger,
  onReload: (data: Record<string, Record<string, string>>) => void
): void {
  if (!resolved.translations) return

  const directory = path.resolve(resolved.translations)

  server.watcher.add(directory)
  server.watcher.setMaxListeners(server.watcher.getMaxListeners() + 1)

  server.watcher.on("change", (file) => {
    if (!file.includes(directory) || !file.endsWith(".json")) return

    try {
      const data = Translations.load(resolved)
      Translations.validate(data, resolved.defaultLocale, logger)
      onReload(data)
    } catch (e) {
      logger.error(`Failed to reload translations: ${(e as Error).message}`)
      return
    }

    // Invalidate the virtual module so the next import gets fresh data
    const module = server.moduleGraph.getModuleById(RESOLVED_ID)
    if (!module) return
    server.moduleGraph.invalidateModule(module)
    server.ws.send({ type: "full-reload" })
  })
}

export default function i18n(config: I18nConfig): AstroIntegration {
  let resolved: ResolvedI18nConfig
  let translationData: Record<string, Record<string, string>> = {}
  let hasAdapter = false
  let detectRoot = false
  let clientDir: URL

  return {
    name: NAME,
    hooks: {
      /**
       * Runs at config setup time. Validates and resolves the config, then
       * registers the Vite plugin, the routes, and the middleware.
       */
      "astro:config:setup": ({
        config: astroConfig,
        command,
        updateConfig,
        injectRoute,
        addMiddleware,
        logger,
      }) => {
        if (astroConfig.i18n) {
          logger.warn(
            "Astro's built-in i18n is configured. " +
              "Remove the i18n key from astro.config to avoid conflicts."
          )
        }

        Config.validate(config)
        resolved = Config.resolve(config, astroConfig.base)
        hasAdapter = Boolean(astroConfig.adapter)

        // A user-owned root page replaces the locale detection at /.
        // Without a prefix, / belongs to the default locale home page.
        const hasIndexPage = fs.existsSync(new URL("./src/pages/index.astro", astroConfig.root))
        if (hasIndexPage && !resolved.prefixDefaultLocale) {
          throw new Error(
            `${NAME} src/pages/index.astro has the same URL as the default locale home page. ` +
              "Remove it, or set prefixDefaultLocale to true."
          )
        }
        if (hasIndexPage) {
          logger.info("src/pages/index.astro replaces the locale detection at /.")
        }
        detectRoot = resolved.prefixDefaultLocale && !hasIndexPage

        if ("ignore" in config) {
          logger.warn(
            'The "ignore" option was removed in v3. The middleware now skips all pages ' +
              "outside the [locale] folder. Remove the option from your config."
          )
        }

        // Register the virtual module so locale config is importable anywhere
        updateConfig({
          vite: {
            optimizeDeps: { exclude: ["@mannisto/astro-i18n"] },
            plugins: [
              createVitePlugin(
                () => resolved,
                () => translationData
              ),
            ],
          },
        })

        if (hasAdapter && detectRoot) {
          injectRoute({
            pattern: "/",
            entrypoint: "@mannisto/astro-i18n/routes/detect",
            prerender: false,
          })
        }

        // Without this route, the middleware gets no request headers for paths
        // that match only prerendered routes. Unprefixed dev cannot use it: a
        // rewrite from an on-demand route to a prerendered page is forbidden in dev.
        if (hasAdapter && (command === "build" || resolved.prefixDefaultLocale)) {
          injectRoute({
            pattern: FALLBACK_PATTERN,
            entrypoint: "@mannisto/astro-i18n/routes/fallback",
            prerender: false,
          })
        }

        // Static sites with prefixDefaultLocale: true only need the build output
        if (hasAdapter || !resolved.prefixDefaultLocale) {
          addMiddleware({ entrypoint: "@mannisto/astro-i18n/middleware", order: "pre" })
        }
      },

      /**
       * Runs after the final config is resolved. Loads and validates
       * translation files if a translations path is configured.
       */
      "astro:config:done": ({ config: astroConfig, logger }) => {
        clientDir = astroConfig.build.client
        if (!resolved.translations) return
        translationData = Translations.load(resolved)
        Translations.validate(translationData, resolved.defaultLocale, logger)
      },

      /**
       * Runs when the dev server starts. Sets up file watching so translation
       * changes are picked up without a manual restart.
       */
      "astro:server:setup": ({ server, logger }) => {
        watchTranslations(server, resolved, logger, (data) => {
          translationData = data
        })
      },

      /**
       * Runs after the build. Moves the default locale pages to the root, or
       * writes the root locale detection page for static sites.
       */
      "astro:build:done": ({ dir }) => {
        if (!resolved.prefixDefaultLocale) {
          Output.moveDefaultLocale(hasAdapter ? clientDir : dir, resolved.defaultLocale)
        } else if (!hasAdapter && detectRoot) {
          Output.writeDetectPage(dir, resolved)
        }
      },
    },
  }
}
