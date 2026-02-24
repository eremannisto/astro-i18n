import * as astro from 'astro';
import { L as LocaleCode, a as LocaleConfig } from './types-DEfk2GVt.js';

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
     * The fallback locale code.
     * @example "en"
     */
    readonly fallback: LocaleCode;
    /**
     * Returns the config for all locales, or a single locale by code.
     * Throws if the requested code is not found.
     *
     * @example
     * Locale.get()       // all locales
     * Locale.get("fi")   // single locale
     */
    get(code?: LocaleCode): LocaleConfig | LocaleConfig[];
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
    use(locale: LocaleCode): (key?: string) => string | Record<string, string>;
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
    middleware: astro.MiddlewareHandler;
};

export { Locale };
