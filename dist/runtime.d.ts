import { L as LocaleCode, a as LocaleConfig } from './types-DA5S96LP.js';

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
    get(code?: LocaleCode): LocaleConfig | LocaleConfig[];
    /**
     * Returns a translation function for the specified locale.
     * The returned function accepts a translation key and returns the translated string.
     * Throws if translations are not configured or if a key is missing.
     */
    use(locale: LocaleCode): (key: string) => string;
};

export { Locale };
