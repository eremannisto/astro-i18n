import { L as LocaleCode, a as LocaleConfig, A as AstroContext, c as LocaleInstance } from './types-BgzIC7CZ.js';

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
    fromURL(url: URL): LocaleCode;
    /**
     * Generates the URL path of a page in the specified locale, with the Astro base.
     * Strips any existing base and locale prefix and prepends the specified locale.
     * The default locale has no prefix when prefixDefaultLocale is false.
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
     * Accepts the full Astro context and returns a request-scoped instance.
     * All instance members are bound at creation time and safe to destructure.
     */
    use(astro: AstroContext): LocaleInstance;
    /**
     * Generates hreflang link objects for all supported locales, plus an x-default entry.
     * Useful for rendering <link rel="alternate"> tags for SEO.
     */
    hreflang(url: URL, site: string | URL): {
        href: string;
        hreflang: string;
    }[];
};

export { Locale };
