// src/lib/locale.ts
import { config, translations } from "virtual:astro-i18n/config";
var NAME = "@mannisto/astro-i18n";
function setCookie(name, value) {
  if ("cookieStore" in window) {
    void window.cookieStore.set({ name, value, path: "/", sameSite: "lax" });
  } else {
    document.cookie = `${name}=${value}; path=/; SameSite=Lax`;
  }
}
function getLocale(code) {
  if (code) {
    const found = config.locales.find((l) => l.code === code);
    if (!found) throw new Error(`${NAME} Locale "${code}" not found.`);
    return found;
  }
  return config.locales;
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
  from(url) {
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
   * Returns a translation function for the specified locale.
   * The returned function accepts a translation key and returns the translated string.
   * Throws if translations are not configured or if a key is missing.
   */
  use(locale) {
    if (!config.translations) {
      console.warn(
        `${NAME} Locale.use() was called but translations are not configured. Add a translations path to your i18n config to enable translations.`
      );
      return () => "";
    }
    const record = translations[locale];
    if (!record) throw new Error(`${NAME} No translations found for locale "${locale}".`);
    return (key) => {
      if (!(key in record)) {
        throw new Error(`${NAME} Missing translation key "${key}" in ${locale}.json`);
      }
      return record[key];
    };
  },
  /**
   * Generates hreflang link objects for all supported locales, plus an x-default entry.
   * Useful for passing to a metadata component to improve SEO for multilingual sites.
   *
   * For pages with the same slug across all locales, this works automatically.
   * For pages with translated slugs, pass your own `languageAlternates` array instead.
   *
   * @example
   * ---
   * // src/layouts/Layout.astro
   * const languageAlternates = Locale.hreflang(Astro.url, Astro.site ?? Astro.url.origin)
   * ---
   * <Head languageAlternates={languageAlternates} />
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
  },
  /**
   * Checks if the current URL is missing a locale prefix and redirects to the
   * locale-prefixed version if so. Should be called at the top of 404.astro
   * in static and hybrid mode to handle unprefixed paths gracefully.
   *
   * Uses the locale cookie if available, otherwise falls back to defaultLocale.
   * Returns the redirect Response if a redirect is needed, or null if the URL
   * already has a valid locale prefix and the 404 page should render normally.
   *
   * @example
   * ---
   * // src/pages/404.astro
   * import { Locale } from "@mannisto/astro-i18n/runtime"
   * export const prerender = false
   *
   * const redirect = Locale.redirect(Astro)
   * if (redirect) return redirect
   *
   * const locale = Locale.from(Astro.url)
   * ---
   */
  redirect(astro) {
    const pathname = astro.url.pathname;
    const codes = config.locales.map((l) => l.code);
    const firstSegment = pathname.split("/").filter(Boolean)[0];
    if (codes.includes(firstSegment)) return null;
    const cookie = astro.cookies.get("locale")?.value;
    const locale = cookie && codes.includes(cookie) ? cookie : config.defaultLocale;
    return astro.redirect(`/${locale}${pathname}`, 302);
  }
};
export {
  Locale
};
