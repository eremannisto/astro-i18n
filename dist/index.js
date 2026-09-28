import {
  FALLBACK_PATTERN,
  NAME
} from "./chunk-M3HKFVOR.js";

// src/index.ts
import fs3 from "fs";
import path2 from "path";

// src/lib/config.ts
var Config = {
  /**
   * Applies defaults to the raw user config and returns a fully resolved config.
   * The base is the Astro base option, e.g. "/docs/".
   */
  resolve(config, base = "/") {
    return {
      locales: config.locales,
      defaultLocale: config.defaultLocale ?? config.locales[0].code,
      prefixDefaultLocale: config.prefixDefaultLocale ?? true,
      base: base.replace(/\/+$/, ""),
      translations: config.translations
    };
  },
  /**
   * Validates the full config before it is resolved.
   */
  validate(config) {
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
  }
};

// src/lib/output.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
var Output = {
  /**
   * Moves the prerendered pages of the default locale to the root of the output,
   * e.g. en/about/index.html to about/index.html. Throws if a target file exists.
   */
  moveDefaultLocale(dir, locale) {
    const root = fileURLToPath(dir);
    const source = path.join(root, locale);
    const moves = [];
    if (fs.existsSync(source)) {
      const files = fs.readdirSync(source, { recursive: true, encoding: "utf8" });
      for (const file of files) {
        const from = path.join(source, file);
        if (fs.statSync(from).isFile()) moves.push([from, path.join(root, file)]);
      }
    }
    const page = path.join(root, `${locale}.html`);
    if (fs.existsSync(page)) moves.push([page, path.join(root, "index.html")]);
    for (const [from, to] of moves) {
      if (fs.existsSync(to)) {
        throw new Error(
          `${NAME} Cannot move ${path.relative(root, from)} to ${path.relative(root, to)}: the file already exists. Two pages have the same URL.`
        );
      }
    }
    for (const [from, to] of moves) {
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.renameSync(from, to);
    }
    fs.rmSync(source, { recursive: true, force: true });
  },
  /**
   * Writes the root index.html for static sites. The page reads the locale cookie
   * and sends the browser to the stored locale or to the default locale.
   */
  writeDetectPage(dir, config) {
    const supported = config.locales.map((l) => l.code);
    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <script>
      const supported = ${JSON.stringify(supported)};
      const base = ${JSON.stringify(config.base)};
      const defaultLocale = ${JSON.stringify(config.defaultLocale)};
      const stored = document.cookie.split("; ").find(r => r.startsWith("locale="))?.split("=")[1];
      const locale = (stored && supported.includes(stored)) ? stored : defaultLocale;
      window.location.replace(base + "/" + locale + "/");
    </script>
  </head>
  <body></body>
</html>`;
    fs.writeFileSync(new URL("index.html", dir), html);
  }
};

// src/lib/translations.ts
import fs2 from "fs";
var Translations = {
  /**
   * Loads translation JSON files for all configured locales.
   * Throws if a translation file is missing.
   */
  load(config) {
    const data = {};
    for (const locale of config.locales) {
      const filePath = `${config.translations}/${locale.code}.json`;
      if (!fs2.existsSync(filePath)) throw new Error(`${NAME} Missing translation file: ${filePath}`);
      try {
        data[locale.code] = JSON.parse(fs2.readFileSync(filePath, "utf-8"));
      } catch (e) {
        throw new Error(`${NAME} Invalid JSON in ${filePath}: ${e.message}`);
      }
    }
    return data;
  },
  /**
   * Warns about translation keys present in the default locale but missing in other locales.
   * Does not throw — t() returns the key name for a missing key.
   */
  validate(data, defaultLocale, logger) {
    const defaultKeys = new Set(Object.keys(data[defaultLocale]));
    for (const [code, record] of Object.entries(data)) {
      if (code === defaultLocale) continue;
      const keys = new Set(Object.keys(record));
      for (const key of defaultKeys) {
        if (!keys.has(key)) logger.warn(`Missing translation key "${key}" in ${code}.json`);
      }
    }
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
    // The browser gets the locale config only: t() runs on the server.
    load(id, options) {
      if (id !== RESOLVED_ID) return;
      if (!options?.ssr) {
        const { translations: _, ...config } = getConfig();
        return `
          export const config = ${JSON.stringify(config)}
          export const translations = {}
        `;
      }
      return `
        export const config = ${JSON.stringify(getConfig())}
        export const translations = ${JSON.stringify(getTranslations())}
      `;
    }
  };
}

// src/index.ts
function watchTranslations(server, resolved, logger, onReload) {
  if (!resolved.translations) return;
  const directory = path2.resolve(resolved.translations);
  server.watcher.add(directory);
  server.watcher.setMaxListeners(server.watcher.getMaxListeners() + 1);
  server.watcher.on("change", (file) => {
    if (!file.includes(directory) || !file.endsWith(".json")) return;
    try {
      const data = Translations.load(resolved);
      Translations.validate(data, resolved.defaultLocale, logger);
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
  let hasAdapter = false;
  let detectRoot = false;
  let clientDir;
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
        logger
      }) => {
        if (astroConfig.i18n) {
          logger.warn(
            "Astro's built-in i18n is configured. Remove the i18n key from astro.config to avoid conflicts."
          );
        }
        Config.validate(config);
        resolved = Config.resolve(config, astroConfig.base);
        hasAdapter = Boolean(astroConfig.adapter);
        const hasIndexPage = fs3.existsSync(new URL("./src/pages/index.astro", astroConfig.root));
        if (hasIndexPage && !resolved.prefixDefaultLocale) {
          throw new Error(
            `${NAME} src/pages/index.astro has the same URL as the default locale home page. Remove it, or set prefixDefaultLocale to true.`
          );
        }
        if (hasIndexPage) {
          logger.info("src/pages/index.astro replaces the locale detection at /.");
        }
        detectRoot = resolved.prefixDefaultLocale && !hasIndexPage;
        if ("ignore" in config) {
          logger.warn(
            'The "ignore" option was removed in v3. The middleware now skips all pages outside the [locale] folder. Remove the option from your config.'
          );
        }
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
        if (hasAdapter && detectRoot) {
          injectRoute({
            pattern: "/",
            entrypoint: "@mannisto/astro-i18n/routes/detect",
            prerender: false
          });
        }
        if (hasAdapter && (command === "build" || resolved.prefixDefaultLocale)) {
          injectRoute({
            pattern: FALLBACK_PATTERN,
            entrypoint: "@mannisto/astro-i18n/routes/fallback",
            prerender: false
          });
        }
        if (hasAdapter || !resolved.prefixDefaultLocale) {
          addMiddleware({ entrypoint: "@mannisto/astro-i18n/middleware", order: "pre" });
        }
      },
      /**
       * Runs after the final config is resolved. Loads and validates
       * translation files if a translations path is configured.
       */
      "astro:config:done": ({ config: astroConfig, logger }) => {
        clientDir = astroConfig.build.client;
        if (!resolved.translations) return;
        translationData = Translations.load(resolved);
        Translations.validate(translationData, resolved.defaultLocale, logger);
      },
      /**
       * Runs when the dev server starts. Sets up file watching so translation
       * changes are picked up without a manual restart.
       */
      "astro:server:setup": ({ server, logger }) => {
        watchTranslations(server, resolved, logger, (data) => {
          translationData = data;
        });
      },
      /**
       * Runs after the build. Moves the default locale pages to the root, or
       * writes the root locale detection page for static sites.
       */
      "astro:build:done": ({ dir }) => {
        if (!resolved.prefixDefaultLocale) {
          Output.moveDefaultLocale(hasAdapter ? clientDir : dir, resolved.defaultLocale);
        } else if (!hasAdapter && detectRoot) {
          Output.writeDetectPage(dir, resolved);
        }
      }
    }
  };
}
export {
  i18n as default
};
