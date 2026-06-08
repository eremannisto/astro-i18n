import fs from "node:fs"
import path from "node:path"
import type { AstroIntegration } from "astro"

import { NAME } from "./constants"
import { Config } from "./lib/config"
import { Translations } from "./lib/translations"
import { Utils } from "./lib/utils"
import { createVitePlugin, RESOLVED_ID } from "./lib/vite"
import type { I18nConfig, ResolvedI18nConfig } from "./types"

/**
 * Watches the translations directory for JSON file changes during dev.
 * On change, reloads translations and triggers a full HMR reload.
 * No-ops if translations are not configured.
 */
function watchTranslations(
  server: Parameters<NonNullable<AstroIntegration["hooks"]["astro:server:setup"]>>[0]["server"],
  resolved: ResolvedI18nConfig,
  logger: Parameters<NonNullable<AstroIntegration["hooks"]["astro:server:setup"]>>[0]["logger"],
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
      Translations.validate(data, resolved.defaultLocale)
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
  let staticMode = false

  return {
    name: NAME,
    hooks: {
      /**
       * Runs at config setup time. Validates, resolves, and registers the
       * Vite plugin and locale detection routes.
       */
      "astro:config:setup": ({
        config: astroConfig,
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

        if (config.ignore && !Utils.hasAdapter(astroConfig)) {
          logger.warn(
            '"ignore" has no effect in static mode — middleware requires a server adapter.'
          )
        }

        // A user-owned src/pages/index.astro conflicts with the root detection.
        const indexPath = new URL("./src/pages/index.astro", astroConfig.root)
        if (fs.existsSync(indexPath)) {
          throw new Error(`${NAME} Found conflicting src/pages/index.astro — remove it.`)
        }

        resolved = Config.resolve(config)

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

        // Static mode — root locale detection page is written at build time.
        // Server/hybrid use a server-rendered route + middleware instead.
        if (Utils.isStatic(astroConfig)) {
          staticMode = true
        } else {
          const entrypoint = Utils.isServer(astroConfig)
            ? "@mannisto/astro-i18n/detect/server"
            : "@mannisto/astro-i18n/detect/hybrid"
          injectRoute({ pattern: "/", entrypoint, prerender: false })
          addMiddleware({ entrypoint: "@mannisto/astro-i18n/middleware", order: "pre" })
        }
      },

      /**
       * Runs after the final config is resolved. Loads and validates
       * translation files if a translations path is configured.
       */
      "astro:config:done": () => {
        if (!resolved.translations) return
        translationData = Translations.load(resolved)
        Translations.validate(translationData, resolved.defaultLocale)
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

      // Writes the root index.html for locale detection in static mode.
      "astro:build:done": ({ dir }) => {
        if (!staticMode) return

        const supported = resolved.locales.map((l) => l.code)
        const defaultLocale = resolved.defaultLocale

        const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <script>
      const supported = ${JSON.stringify(supported)};
      const defaultLocale = "${defaultLocale}";
      const stored = document.cookie.split("; ").find(r => r.startsWith("locale="))?.split("=")[1];
      const locale = (stored && supported.includes(stored)) ? stored : defaultLocale;
      window.location.replace("/" + locale + "/");
    </script>
  </head>
  <body></body>
</html>`

        fs.writeFileSync(new URL("index.html", dir), html)
      },
    },
  }
}
