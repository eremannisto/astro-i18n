// src/lib/validate.ts
import fs from "fs";
var NAME = "@mannisto/astro-i18n";
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
    if (config.routing?.fallback) {
      const codes = config.locales.map((l) => l.code);
      if (!codes.includes(config.routing.fallback)) {
        throw new Error(
          `${NAME} Fallback locale "${config.routing.fallback}" not found in locales.`
        );
      }
    }
    if (config.routing?.autoPrefix && config.routing?.detection !== "server") {
      throw new Error(`${NAME} autoPrefix is only valid when detection is "server".`);
    }
  },
  /**
   * Validates that translation files exist for all locales and that all
   * locales share the same keys as the fallback locale.
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
    const fallbackKeys = Object.keys(data[config.routing.fallback]);
    for (const locale of config.locales) {
      if (locale.code === config.routing.fallback) continue;
      const localeKeys = Object.keys(data[locale.code]);
      for (const key of fallbackKeys) {
        if (!localeKeys.includes(key)) {
          throw new Error(`${NAME} Missing translation key "${key}" in ${locale.code}.json`);
        }
      }
    }
    return data;
  },
  /**
   * Validates that there is no conflicting src/pages/index.astro when
   * detection is not "none". If one exists it would intercept the injected
   * detection route at /.
   */
  index(root, detection) {
    if (detection === "none") return;
    const indexPath = new URL("./src/pages/index.astro", root);
    if (fs.existsSync(indexPath)) {
      throw new Error(
        `${NAME} Found conflicting src/pages/index.astro \u2014 remove it or set routing.detection to "none".`
      );
    }
  }
};

// src/index.ts
var NAME2 = "@mannisto/astro-i18n";
var DEFAULT_IGNORE = ["/_astro"];
function resolveConfig(config) {
  const fallback = config.routing?.fallback ?? config.locales[0].code;
  const detection = config.routing?.detection ?? "client";
  const autoPrefix = config.routing?.autoPrefix === false ? false : {
    ignore: [
      ...DEFAULT_IGNORE,
      ...typeof config.routing?.autoPrefix === "object" ? config.routing.autoPrefix.ignore ?? [] : []
    ]
  };
  return {
    locales: config.locales,
    routing: { fallback, detection, autoPrefix },
    // translations are optional — undefined means disabled
    translations: config.translations
  };
}
function i18n(config) {
  let resolved;
  let translationData = {};
  return {
    name: NAME2,
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
        logger
      }) => {
        if (astroConfig.i18n) {
          logger.warn(
            "Astro's built-in i18n is configured. Remove the i18n key from astro.config to avoid conflicts."
          );
        }
        Validate.config(config);
        Validate.index(astroConfig.root, config.routing?.detection ?? "client");
        resolved = resolveConfig(config);
        updateConfig({
          vite: {
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
        if (resolved.routing.detection === "server") {
          injectRoute({
            pattern: "/",
            entrypoint: "@mannisto/astro-i18n/detect/server",
            prerender: false
          });
        }
        if (resolved.routing.detection === "client") {
          injectRoute({
            pattern: "/",
            entrypoint: "@mannisto/astro-i18n/detect/client",
            prerender: true
          });
        }
        if (resolved.routing.detection === "server" && resolved.routing.autoPrefix !== false) {
          addMiddleware({
            entrypoint: "@mannisto/astro-i18n/middleware",
            order: "pre"
          });
        }
        logger.info("i18n configured.");
      },
      // ======================================================================
      // astro:config:done
      //
      // Validates and loads translation files only if translations are
      // configured. Runs after all integrations have finished setup.
      // ======================================================================
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
