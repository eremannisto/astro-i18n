import { L as LocaleCode, a as LocaleConfig } from './types-Cvz2gXDq.js';

/**
 * Returns locale configuration by code, or all locales if no code is provided.
 * Throws if the specified locale code is not found.
 */
declare function getLocale(): LocaleConfig[];
declare function getLocale(code: LocaleCode): LocaleConfig;
/**
 * Locale utilities for managing i18n locale detection, URL generation, and switching.
 * Works with the virtual module configuration injected at build time.
 */
declare const Locale: {
    /**
     * Returns an array of all supported locale codes.
     */
    readonly supported: LocaleCode[];
    /**
     * Returns the default locale code from the configuration.
     */
    readonly defaultLocale: LocaleCode;
    /**
     * Extracts the locale code from a URL pathname.
     * Falls back to the default locale if no valid locale prefix is found.
     */
    from(url: URL): LocaleCode;
    /**
     * Generates a locale-prefixed URL path.
     * Strips any existing locale prefix and prepends the specified locale.
     */
    url(locale: LocaleCode, path?: string): string;
    /**
     * Switches the current locale and navigates to the new locale URL.
     * Sets a cookie to persist the preference and redirects the browser.
     * Only available in browser context.
     */
    switch(locale: LocaleCode, path?: string): void;
    /**
     * Returns locale configuration by code, or all locales if no code is provided.
     * Throws if the specified locale code is not found.
     */
    get: typeof getLocale;
    /**
     * Returns the text direction for the locale derived from the given URL.
     * Defaults to "ltr" if no direction is configured.
     */
    direction(url: URL): "ltr" | "rtl";
    /**
     * Returns a translation function for the specified locale.
     * The returned function accepts a translation key and returns the translated string.
     * Throws if translations are not configured or if a key is missing.
     */
    use(locale: LocaleCode): (key: string) => string;
    /**
     * Shorthand for Locale.use(Locale.from(url)).
     * Returns a translation function for the locale derived from the given URL.
     * Use this when you just need translations for the current page.
     *
     * @example
     * ---
     * const t = Locale.t(Astro.url)
     * ---
     * <h1>{t("nav.home")}</h1>
     */
    t(url: URL): (key: string) => string;
    /**
     * Generates hreflang link objects for all supported locales, plus an x-default entry.
     * Useful for rendering <link rel="alternate"> tags for SEO.
     *
     * For pages with the same slug across all locales, this works automatically.
     * For pages with translated slugs, build the array manually instead.
     *
     * @example
     * ---
     * const alternates = Locale.hreflang(Astro.url, Astro.site ?? Astro.url.origin)
     * ---
     * {alternates.map(({ href, hreflang }) => (
     *   <link rel="alternate" href={href} hreflang={hreflang} />
     * ))}
     */
    hreflang(url: URL, site: string | URL): {
        href: string;
        hreflang: string;
    }[];
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
    redirect(astro: {
        url: URL;
        cookies: {
            get(name: string): {
                value: string;
            } | undefined;
        };
        redirect(path: string, status?: number): Response;
    }): Response | null;
};

export { Locale };
