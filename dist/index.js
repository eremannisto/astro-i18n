// src/lib/validate.ts
import fs from "fs";
var NAME = "@mannisto/astro-i18n";
var VALID_MODES = ["static", "server", "hybrid"];
var Validate = {
  /**
   * Validates the user-supplied config object.
   * Throws a descriptive error if anything is invalid.
   */
  config(config) {
    if (!config.locales || config.locales.length === 0) {
      throw new Error(`${NAME} No locales defined.`);
    }
    for (const locale of config.locales) {
      if (!locale.code) {
        throw new Error(`${NAME} A locale is missing a code.`);
      }
      if (!locale.name) {
        throw new Error(`${NAME} Locale "${locale.code}" is missing a name.`);
      }
      if (!locale.endonym) {
        throw new Error(`${NAME} Locale "${locale.code}" is missing an endonym.`);
      }
    }
    if (config.defaultLocale) {
      const codes = config.locales.map((l) => l.code);
      if (!codes.includes(config.defaultLocale)) {
        throw new Error(`${NAME} defaultLocale "${config.defaultLocale}" not found in locales.`);
      }
    }
    if (config.mode && !VALID_MODES.includes(config.mode)) {
      throw new Error(
        `${NAME} Invalid mode "${config.mode}". Must be one of: ${VALID_MODES.join(", ")}.`
      );
    }
    if (config.ignore && config.mode === "static") {
      throw new Error(`${NAME} "ignore" is only valid when mode is "server" or "hybrid".`);
    }
  },
  /**
   * Validates that translation files exist for all locales and that all
   * locales share the same keys as the default locale.
   *
   * Returns the loaded translation data for use in the virtual module.
   */
  translations(config) {
    const data = {};
    for (const locale of config.locales) {
      const filePath = `${config.translations}/${locale.code}.json`;
      if (!fs.existsSync(filePath)) {
        throw new Error(`${NAME} Missing translation file: ${filePath}`);
      }
      data[locale.code] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
    const defaultKeys = Object.keys(data[config.defaultLocale]);
    for (const locale of config.locales) {
      if (locale.code === config.defaultLocale) continue;
      const localeKeys = Object.keys(data[locale.code]);
      for (const key of defaultKeys) {
        if (!localeKeys.includes(key)) {
          throw new Error(`${NAME} Missing translation key "${key}" in ${locale.code}.json`);
        }
      }
    }
    return data;
  },
  /**
   * Validates that there is no conflicting src/pages/index.astro when
   * mode is not undefined. If one exists it would intercept the injected
   * detection route at /.
   */
  index(root, mode) {
    if (!mode) return;
    const indexPath = new URL("./src/pages/index.astro", root);
    if (fs.existsSync(indexPath)) {
      throw new Error(`${NAME} Found conflicting src/pages/index.astro \u2014 remove it.`);
    }
  }
};

// src/index.ts
var NAME2 = "@mannisto/astro-i18n";
var DEFAULT_IGNORE = ["/_astro/**"];
function resolveConfig(config) {
  const mode = config.mode ?? "static";
  const defaultLocale = config.defaultLocale ?? config.locales[0].code;
  const ignore = [...DEFAULT_IGNORE, ...config.ignore ?? []];
  return {
    locales: config.locales,
    mode,
    defaultLocale,
    ignore,
    translations: config.translations
  };
}
function i18n(config) {
  let resolved;
  let translationData = {};
  return {
    name: NAME2,
    hooks: {
      // Validates config, registers the Vite virtual module plugin, injects
      // detection routes, and registers the middleware.
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
        Validate.config(config);
        Validate.index(astroConfig.root, config.mode);
        resolved = resolveConfig(config);
        updateConfig({
          vite: {
            // Exclude from Vite's dependency pre-bundling — the virtual module
            // is resolved by the plugin below and must not be pre-bundled
            optimizeDeps: {
              exclude: ["@mannisto/astro-i18n"]
            },
            plugins: [
              {
                name: "astro-i18n-virtual",
                resolveId(id) {
                  if (id === "virtual:astro-i18n/config") {
                    return "\0virtual:astro-i18n/config";
                  }
                },
                load(id) {
                  if (id === "\0virtual:astro-i18n/config") {
                    return `
export const config = ${JSON.stringify(resolved)}
export const translations = ${JSON.stringify(translationData)}
`;
                  }
                }
              }
            ]
          }
        });
        if (resolved.mode === "static") {
          injectRoute({
            pattern: "/",
            entrypoint: "@mannisto/astro-i18n/detect/static",
            prerender: true
          });
        }
        if (resolved.mode === "server") {
          injectRoute({
            pattern: "/",
            entrypoint: "@mannisto/astro-i18n/detect/server",
            prerender: false
          });
        }
        if (resolved.mode === "hybrid") {
          injectRoute({
            pattern: "/",
            entrypoint: "@mannisto/astro-i18n/detect/hybrid",
            prerender: false
          });
        }
        if (resolved.mode === "server" || resolved.mode === "hybrid") {
          addMiddleware({
            entrypoint: "@mannisto/astro-i18n/middleware",
            order: "pre"
          });
        }
        logger.info("i18n configured.");
      },
      // Validates and loads translation files only if translations are
      // configured. Runs after all integrations have finished setup.
      "astro:config:done": () => {
        if (resolved.translations) {
          translationData = Validate.translations(resolved);
        }
      }
    }
  };
}
export {
  i18n as default
};
