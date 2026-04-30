import {
  NAME
} from "./chunk-DFLYFBBG.js";

// src/lib/locale.ts
import { config, translations } from "virtual:astro-i18n/config";
function setCookie(name, value) {
  if ("cookieStore" in window) {
    void window.cookieStore.set({ name, value, path: "/", sameSite: "lax" });
    return;
  }
  document.cookie = `${name}=${value}; path=/; SameSite=Lax`;
}
function getLocale(code) {
  if (code) {
    const found = config.locales.find((l) => l.code === code);
    if (!found) throw new Error(`${NAME} Locale "${code}" not found.`);
    return found;
  }
  return config.locales;
}
function buildTranslator(code) {
  if (!config.translations) {
    return (key) => {
      throw new Error(
        `${NAME} t("${key}") was called but translations are not configured. Add a translations path to your i18n config to enable translations.`
      );
    };
  }
  const record = translations[code];
  if (!record) throw new Error(`${NAME} No translations found for locale "${code}".`);
  return (key) => {
    if (!(key in record))
      throw new Error(`${NAME} Missing translation key "${key}" in ${code}.json`);
    return record[key];
  };
}
function buildResponse(astro) {
  return () => {
    const firstSegment = astro.url.pathname.split("/").filter(Boolean)[0];
    const codes = config.locales.map((l) => l.code);
    if (codes.includes(firstSegment)) return null;
    const cookie = astro.cookies.get("locale")?.value;
    const locale = cookie && codes.includes(cookie) ? cookie : config.defaultLocale;
    return astro.redirect(`/${locale}${astro.url.pathname}`, 302);
  };
}
var Locale = {
  /**
   * Returns an array of all supported locale codes.
   */
  get supported() {
    return config.locales.map((l) => l.code);
  },
  /**
   * Returns the default locale code from the configuration.
   */
  get defaultLocale() {
    return config.defaultLocale;
  },
  /**
   * Extracts the locale code from a URL pathname.
   * Falls back to the default locale if no valid locale prefix is found.
   */
  fromURL(url) {
    const first = url.pathname.split("/")[1];
    const codes = config.locales.map((l) => l.code);
    return codes.includes(first) ? first : config.defaultLocale;
  },
  /**
   * Generates a locale-prefixed URL path.
   * Strips any existing locale prefix and prepends the specified locale.
   */
  url(locale, path = "/") {
    const codes = config.locales.map((l) => l.code);
    const clean = path.startsWith("/") ? path : `/${path}`;
    const segments = clean.split("/");
    const stripped = codes.includes(segments[1]) ? `/${segments.slice(2).join("/")}` : clean;
    return stripped === "/" ? `/${locale}/` : `/${locale}${stripped}`;
  },
  /**
   * Switches the current locale and navigates to the new locale URL.
   * Sets a cookie to persist the preference and redirects the browser.
   * Only available in browser context.
   */
  switch(locale, path) {
    if (typeof window === "undefined") {
      console.warn(`${NAME} Locale.switch() can only be called in the browser.`);
      return;
    }
    setCookie("locale", locale);
    window.location.assign(Locale.url(locale, path ?? window.location.pathname));
  },
  /**
   * Returns locale configuration by code, or all locales if no code is provided.
   * Throws if the specified locale code is not found.
   */
  get: getLocale,
  /**
   * Accepts the full Astro context and returns a request-scoped instance.
   * All instance members are bound at creation time and safe to destructure.
   */
  use(astro) {
    const code = Locale.fromURL(astro.url);
    const localeConfig = getLocale(code);
    return {
      code,
      name: localeConfig.name,
      endonym: localeConfig.endonym,
      phrase: localeConfig.phrase,
      direction: localeConfig.direction ?? "ltr",
      t: buildTranslator(code),
      response: buildResponse(astro)
    };
  },
  /**
   * Generates hreflang link objects for all supported locales, plus an x-default entry.
   * Useful for rendering <link rel="alternate"> tags for SEO.
   */
  hreflang(url, site) {
    const base = typeof site === "string" ? site : site.href;
    return [
      ...config.locales.map((l) => ({
        href: new URL(Locale.url(l.code, url.pathname), base).href,
        hreflang: l.code
      })),
      {
        href: new URL(Locale.url(config.defaultLocale, url.pathname), base).href,
        hreflang: "x-default"
      }
    ];
  }
};
export {
  Locale
};
