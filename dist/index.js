import {
  NAME
} from "./chunk-DFLYFBBG.js";

// src/index.ts
import fs2 from "fs";
import path from "path";

// src/lib/config.ts
var Config = {
  /**
   * Applies defaults to the raw user config and returns a fully resolved config.
   */
  resolve(config) {
    return {
      locales: config.locales,
      defaultLocale: config.defaultLocale ?? config.locales[0].code,
      ignore: ["/_astro", ...config.ignore ?? []],
      translations: config.translations
    };
  },
  /**
   * Validates the full config before it is resolved.
   */
  validate(config, hasAdapter) {
    if (!config.locales || config.locales.length === 0) {
      throw new Error(`${NAME} No locales defined.`);
    }
    for (const locale of config.locales) {
      if (!locale.code) {
        throw new Error(`${NAME} A locale is missing a code.`);
      }
      if (!/^[a-zA-Z0-9-]+$/.test(locale.code)) {
        throw new Error(
          `${NAME} Locale code "${locale.code}" contains invalid characters. Only letters, numbers, and hyphens are allowed.`
        );
      }
      if (locale.direction && locale.direction !== "ltr" && locale.direction !== "rtl") {
        throw new Error(
          `${NAME} Locale "${locale.code}" has an invalid direction "${locale.direction}". Must be "ltr" or "rtl".`
        );
      }
    }
    const codes = config.locales.map((l) => l.code);
    const duplicates = codes.filter((c, i) => codes.indexOf(c) !== i);
    if (duplicates.length > 0) {
      throw new Error(`${NAME} Duplicate locale codes: ${duplicates.join(", ")}.`);
    }
    if (config.defaultLocale && !codes.includes(config.defaultLocale)) {
      throw new Error(`${NAME} defaultLocale "${config.defaultLocale}" not found in locales.`);
    }
    if (config.ignore && !hasAdapter) {
      throw new Error(`${NAME} "ignore" requires a server adapter.`);
    }
  }
};

// src/lib/translations.ts
import fs from "fs";
var Translations = {
  /**
   * Loads translation JSON files for all configured locales.
   * Throws if a translation file is missing.
   */
  load(config) {
    const data = {};
    for (const locale of config.locales) {
      const filePath = `${config.translations}/${locale.code}.json`;
      if (!fs.existsSync(filePath)) throw new Error(`${NAME} Missing translation file: ${filePath}`);
      data[locale.code] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
    return data;
  },
  /**
   * Warns about translation keys present in the default locale but missing in other locales.
   * Does not throw — missing keys are allowed to support incremental translation workflows.
   */
  validate(data, defaultLocale) {
    const defaultKeys = new Set(Object.keys(data[defaultLocale]));
    for (const [code, record] of Object.entries(data)) {
      if (code === defaultLocale) continue;
      const keys = new Set(Object.keys(record));
      for (const key of defaultKeys) {
        if (!keys.has(key)) console.warn(`${NAME} Missing translation key "${key}" in ${code}.json`);
      }
    }
  }
};

// src/lib/utils.ts
var Utils = {
  /**
   * No adapter configured — all pages are prerendered, root redirect is
   * handled client-side via an injected static HTML page.
   */
  isStatic(config) {
    return !config.adapter && config.output === "static";
  },
  /**
   * Adapter present with server output — all pages are SSR, all redirects
   * are handled server-side via middleware.
   */
  isServer(config) {
    return !!config.adapter && config.output === "server";
  },
  /**
   * Adapter present with static output — locale pages are prerendered,
   * root route is SSR, unprefixed paths are redirected via middleware.
   */
  isHybrid(config) {
    return !!config.adapter && config.output === "static";
  },
  /**
   * Checks if an adapter is configured.
   */
  hasAdapter(config) {
    return !!config.adapter;
  }
};

// src/lib/vite.ts
var NAME2 = "astro-i18n-virtual";
var VIRTUAL_ID = "virtual:astro-i18n/config";
var RESOLVED_ID = `\0${VIRTUAL_ID}`;
function createVitePlugin(getConfig, getTranslations) {
  return {
    name: NAME2,
    // Vite hook — intercepts import resolution. Maps the virtual specifier
    // to the \0-prefixed internal ID so Vite knows this plugin owns it.
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },
    // Vite hook — generates the module source for the resolved ID.
    // Serialises the current config and translations as a JS module.
    load(id) {
      if (id === RESOLVED_ID) {
        return `
          export const config = ${JSON.stringify(getConfig())}
          export const translations = ${JSON.stringify(getTranslations())}
        `;
      }
    }
  };
}

// src/index.ts
function watchTranslations(server, resolved, logger, onReload) {
  if (!resolved.translations) return;
  const directory = path.resolve(resolved.translations);
  server.watcher.add(directory);
  server.watcher.setMaxListeners(server.watcher.getMaxListeners() + 1);
  server.watcher.on("change", (file) => {
    if (!file.includes(directory) || !file.endsWith(".json")) return;
    try {
      const data = Translations.load(resolved);
      Translations.validate(data, resolved.defaultLocale);
      onReload(data);
    } catch (e) {
      logger.error(`Failed to reload translations: ${e.message}`);
      return;
    }
    const module = server.moduleGraph.getModuleById(RESOLVED_ID);
    if (!module) return;
    server.moduleGraph.invalidateModule(module);
    server.ws.send({ type: "full-reload" });
  });
}
function i18n(config) {
  let resolved;
  let translationData = {};
  return {
    name: NAME,
    hooks: {
      /**
       * Runs at config setup time. Validates, resolves, registers the Vite
       * plugin, and injects the locale detection route.
       */
      "astro:config:setup": ({
        config: astroConfig,
        updateConfig,
        injectRoute,
        addMiddleware,
        logger
      }) => {
        if (astroConfig.i18n) {
          logger.warn(
            "Astro's built-in i18n is configured. Remove the i18n key from astro.config to avoid conflicts."
          );
        }
        Config.validate(config, Utils.hasAdapter(astroConfig));
        const indexPath = new URL("./src/pages/index.astro", astroConfig.root);
        if (fs2.existsSync(indexPath)) {
          throw new Error(`${NAME} Found conflicting src/pages/index.astro \u2014 remove it.`);
        }
        resolved = Config.resolve(config);
        updateConfig({
          vite: {
            optimizeDeps: { exclude: ["@mannisto/astro-i18n"] },
            plugins: [
              createVitePlugin(
                () => resolved,
                () => translationData
              )
            ]
          }
        });
        if (Utils.isStatic(astroConfig)) {
          injectRoute({
            pattern: "/",
            entrypoint: "@mannisto/astro-i18n/detect/static",
            prerender: true
          });
        } else {
          const entrypoint = Utils.isServer(astroConfig) ? "@mannisto/astro-i18n/detect/server" : "@mannisto/astro-i18n/detect/hybrid";
          injectRoute({ pattern: "/", entrypoint, prerender: false });
          addMiddleware({ entrypoint: "@mannisto/astro-i18n/middleware", order: "pre" });
        }
      },
      /**
       * Runs after the final config is resolved. Loads and validates
       * translation files if a translations path is configured.
       */
      "astro:config:done": () => {
        if (!resolved.translations) return;
        translationData = Translations.load(resolved);
        Translations.validate(translationData, resolved.defaultLocale);
      },
      /**
       * Runs when the dev server starts. Sets up file watching so translation
       * changes are picked up without a manual restart.
       */
      "astro:server:setup": ({ server, logger }) => {
        watchTranslations(server, resolved, logger, (data) => {
          translationData = data;
        });
      }
    }
  };
}
export {
  i18n as default
};
