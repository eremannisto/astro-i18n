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
   * The default locale code.
   * @example "en"
   */
  get defaultLocale() {
    return config.defaultLocale;
  },
  /**
   * Derives the current locale from the given URL.
   * Falls back to defaultLocale if no supported locale is found in the path.
   *
   * @example
   * const locale = Locale.from(Astro.url)
   */
  from(url) {
    const firstSegment = url.pathname.split("/")[1];
    return config.locales.map((l) => l.code).includes(firstSegment) ? firstSegment : config.defaultLocale;
  },
  /**
   * Returns the config for all locales, or a single locale by code.
   * Throws if the requested code is not found.
   *
   * @example
   * Locale.get()       // All locales
   * Locale.get("fi")   // Single locale
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
  /**
   * Builds a locale-prefixed URL from a locale code and an optional path.
   * If no path is provided, returns the locale root.
   *
   * @example
   * Locale.url("fi")                     // "/fi/"
   * Locale.url("fi", "/about")           // "/fi/about"
   * Locale.url("fi", Astro.url.pathname) // "/fi/current-path"
   */
  url(locale, path) {
    if (!path || path === "/") return `/${locale}/`;
    const firstSegment = path.split("/")[1];
    const strippedPath = config.locales.map((l) => l.code).includes(firstSegment) ? path.slice(firstSegment.length + 1) || "/" : path;
    return `/${locale}${strippedPath}`;
  },
  /**
   * Switches the current locale client-side. Updates localStorage and
   * cookie so the preference persists across visits, then navigates to
   * the equivalent page in the new locale.
   *
   * Browser-only — logs a warning if called on the server.
   *
   * Updates both localStorage (static mode) and cookie (server/hybrid mode)
   * so it works correctly regardless of which mode the site uses.
   *
   * @example
   * Locale.switch("fi")           // Navigate to /fi/ from current page
   * Locale.switch("fi", "/about") // Navigate to /fi/about
   */
  switch(locale, path) {
    if (typeof window === "undefined") {
      console.warn(`${NAME} Locale.switch() can only be called in the browser.`);
      return;
    }
    localStorage.setItem("locale", locale);
    document.cookie = `locale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax; Secure`;
    window.location.href = Locale.url(locale, path ?? window.location.pathname);
  },
  // ==========================================================================
  // Translations
  // ==========================================================================
  /**
   * Binds a locale and returns a translation function for that locale.
   *
   * Call once at the top of your page with the current locale, then use
   * the returned function to look up keys by name.
   *
   * Warns if translations are not configured.
   * Throws if the locale or key is not found.
   *
   * @example
   * const t = Locale.use(locale)
   * t("nav.home")  // "Home"
   */
  use(locale) {
    if (!config.translations) {
      console.warn(
        `${NAME} Locale.use() was called but translations are not configured. Add a translations path to your i18n config to enable translations.`
      );
      return () => "";
    }
    const record = translations[locale];
    return (key) => {
      if (!record) {
        throw new Error(`${NAME} No translations found for locale "${locale}".`);
      }
      if (!(key in record)) {
        throw new Error(`${NAME} Missing translation key "${key}" in ${locale}.json`);
      }
      return record[key];
    };
  },
  // ==========================================================================
  // Middleware
  // ==========================================================================
  /**
   * Middleware that redirects requests without a locale prefix to the
   * correct locale based on the user's cookie, and updates the cookie
   * when the user navigates to a new locale.
   *
   * Auto-registered in server mode. Can also be used manually via
   * Astro's sequence() helper.
   *
   * @example
   * import { sequence } from "astro/middleware"
   * import { Locale } from "@mannisto/astro-i18n/runtime"
   * export const onRequest = sequence(Locale.middleware, myMiddleware)
   */
  middleware: defineMiddleware(({ url, cookies, locals, redirect }, next) => {
    const pathname = url.pathname;
    if (config.ignore.some((path) => pathname.startsWith(path))) {
      return next();
    }
    if (pathname === "/") {
      return next();
    }
    const supportedCodes = config.locales.map((l) => l.code);
    const firstSegment = pathname.split("/")[1];
    if (supportedCodes.includes(firstSegment)) {
      const stored2 = cookies.get("locale")?.value;
      if (stored2 !== firstSegment) {
        cookies.set("locale", firstSegment, {
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
          sameSite: "lax",
          secure: true
        });
      }
      locals.locale = firstSegment;
      return next();
    }
    const stored = cookies.get("locale")?.value;
    const targetLocale = stored && supportedCodes.includes(stored) ? stored : config.defaultLocale;
    return redirect(`/${targetLocale}${pathname}`, 302);
  })
};

export {
  Locale
};
