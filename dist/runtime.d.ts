import { L as LocaleCode, a as LocaleConfig } from './types-DA5S96LP.js';

declare const Locale: {
    /**
     * Returns an array of all supported locale codes.
     * @returns Array of locale codes configured in the i18n config
     */
    readonly supported: LocaleCode[];
    /**
     * Returns the default locale code.
     * @returns The default locale code configured in the i18n config
     */
    readonly defaultLocale: LocaleCode;
    /**
     * Extracts the locale code from a URL by checking the first path segment.
     * @param url - The URL to extract the locale from
     * @returns The locale code if found in the URL, otherwise the default locale
     */
    from(url: URL): LocaleCode;
    /**
     * Builds a localized URL path for the given locale.
     * Strips any existing locale prefix from the path before adding the new one.
     * @param locale - The target locale code
     * @param path - The path to localize (defaults to "/")
     * @returns The localized URL path (e.g., "/en/about")
     */
    url(locale: LocaleCode, path?: string): string;
    /**
     * Switches to a different locale by setting a cookie and navigating to the localized URL.
     * Can only be called in the browser (client-side).
     * @param locale - The locale code to switch to
     * @param path - Optional path to navigate to (defaults to current pathname)
     */
    switch(locale: LocaleCode, path?: string): void;
    /**
     * Gets locale configuration by code, or all locale configurations if no code is provided.
     * @param code - Optional locale code to look up
     * @returns A single LocaleConfig if code is provided, or an array of all LocaleConfigs
     * @throws Error if the specified locale code is not found
     */
    get(code?: LocaleCode): LocaleConfig | LocaleConfig[];
    /**
     * Returns a translation function for the specified locale.
     * The returned function takes a translation key and returns the translated string.
     * @param locale - The locale code to get translations for
     * @returns A function that accepts a translation key and returns the translated string
     * @throws Error if no translations are found for the locale or if a key is missing
     */
    use(locale: LocaleCode): (key: string) => string;
};

export { Locale };
