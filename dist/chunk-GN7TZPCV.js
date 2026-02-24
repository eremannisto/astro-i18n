// src/lib/locale.ts
import { defineMiddleware } from "astro/middleware";
import { config, translations } from "virtual:astro-i18n/config";
var NAME = "@mannisto/astro-i18n";
var Locale = {
  // ==========================================================================
  // Locale access
  // ==========================================================================
  /**
   * All supported locale codes.
   * @example ["en", "fi"]
   */
  get supported() {
    return config.locales.map((l) => l.code);
  },
  /**
   * The fallback locale code.
   * @example "en"
   */
  get fallback() {
    return config.routing.fallback;
  },
  /**
   * Returns the current locale from Astro.params.
   * @example
   * const locale = Locale.current(Astro.params.locale)
   */
  current(locale) {
    return locale;
  },
  /**
   * Returns the config for all locales, or a single locale by code.
   * Throws if the requested code is not found.
   *
   * @example
   * Locale.get()       // all locales
   * Locale.get("fi")   // single locale
   */
  get(code) {
    if (code) {
      const found = config.locales.find((l) => l.code === code);
      if (!found) {
        throw new Error(`${NAME} Locale "${code}" not found.`);
      }
      return found;
    }
    return config.locales;
  },
  // ==========================================================================
  // Translations
  // ==========================================================================
  /**
   * Binds a locale and returns a translation function for that locale.
   *
   * Call once at the top of your page with the current locale, then use
   * the returned function to look up individual keys.
   *
   * Warns if translations are not configured.
   * Throws if the locale or key is not found.
   *
   * @example
   * const t = Locale.use(locale)
   * t("nav.home")  // "Home"
   * t()            // { "nav.home": "Home", ... }
   */
  use(locale) {
    if (!config.translations) {
      console.warn(
        `${NAME} Locale.use() was called but translations are not configured. Add a translations path to your i18n config to enable translations.`
      );
      return (key) => key ? "" : {};
    }
    const record = translations[locale];
    return (key) => {
      if (key) {
        if (!record) {
          throw new Error(`${NAME} No translations found for locale "${locale}".`);
        }
        if (!(key in record)) {
          throw new Error(
            `${NAME} Missing translation key "${key}" in ${locale}.json`
          );
        }
        return record[key];
      }
      return record ?? {};
    };
  },
  // ==========================================================================
  // Middleware
  // ==========================================================================
  /**
   * Middleware that redirects requests without a locale prefix to the
   * correct locale based on the user's cookie.
   *
   * Auto-registered when detection is "server" and autoPrefix is enabled.
   * Can also be used manually via Astro's sequence() helper.
   *
   * @example
   * import { sequence } from "astro/middleware"
   * import { Locale } from "@mannisto/astro-i18n/runtime"
   * export const onRequest = sequence(Locale.middleware, myMiddleware)
   */
  middleware: defineMiddleware(({ url, cookies, redirect }, next) => {
    const pathname = url.pathname;
    const ignoreList = config.routing.autoPrefix !== false ? config.routing.autoPrefix.ignore ?? [] : [];
    if (ignoreList.some((path) => pathname.startsWith(path))) {
      return next();
    }
    if (pathname === "/") {
      return next();
    }
    const firstSegment = pathname.split("/")[1];
    if (config.locales.map((l) => l.code).includes(firstSegment)) {
      return next();
    }
    const stored = cookies.get("locale")?.value;
    const targetLocale = stored && config.locales.map((l) => l.code).includes(stored) ? stored : config.routing.fallback;
    return redirect(`/${targetLocale}${pathname}`, 302);
  })
};

export {
  Locale
};
