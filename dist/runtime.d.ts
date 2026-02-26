import * as astro from 'astro';
import { L as LocaleCode, a as LocaleConfig } from './types-DA5S96LP.js';

/**
 * Primary public API for locale access, translations, and middleware.
 *
 * Always import from the runtime subpath in pages and components:
 * @example
 * import { Locale } from "@mannisto/astro-i18n/runtime"
 */
declare const Locale: {
    /**
     * All supported locale codes.
     * @example ["en", "fi"]
     */
    readonly supported: LocaleCode[];
    /**
     * The default locale code.
     * @example "en"
     */
    readonly defaultLocale: LocaleCode;
    /**
     * Derives the current locale from the given URL.
     * Falls back to defaultLocale if no supported locale is found in the path.
     *
     * @example
     * const locale = Locale.from(Astro.url)
     */
    from(url: URL): LocaleCode;
    /**
     * Returns the config for all locales, or a single locale by code.
     * Throws if the requested code is not found.
     *
     * @example
     * Locale.get()       // All locales
     * Locale.get("fi")   // Single locale
     */
    get(code?: LocaleCode): LocaleConfig | LocaleConfig[];
    /**
     * Builds a locale-prefixed URL from a locale code and an optional path.
     * If no path is provided, returns the locale root.
     *
     * @example
     * Locale.url("fi")                     // "/fi/"
     * Locale.url("fi", "/about")           // "/fi/about"
     * Locale.url("fi", Astro.url.pathname) // "/fi/current-path"
     */
    url(locale: LocaleCode, path?: string): string;
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
    switch(locale: LocaleCode, path?: string): void;
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
    use(locale: LocaleCode): (key: string) => string;
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
    middleware: astro.MiddlewareHandler;
};

export { Locale };
