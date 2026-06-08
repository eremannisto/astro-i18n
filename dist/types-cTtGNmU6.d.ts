/**
 * A locale code, e.g. "en", "fi", "en-US"
 */
type LocaleCode = string;
/**
 * The direction of the locale, e.g. "ltr" or "rtl"
 */
type LocaleDirection = "ltr" | "rtl";
/**
 * Configuration for a single locale
 */
type LocaleConfig = {
    code: LocaleCode;
    name?: string;
    endonym?: string;
    phrase?: string;
    direction?: LocaleDirection;
};
/**
 * The configuration object passed to the i18n() integration
 */
type I18nConfig = {
    /**
     * The list of supported locales, in order of preference
     */
    locales: LocaleConfig[];
    /**
     * The default locale code to use when no preference is stored.
     * Defaults to the first locale in the locales array.
     */
    defaultLocale?: LocaleCode;
    /**
     * URL path prefixes that should bypass the middleware.
     * Only applies when a server adapter is configured.
     * Always includes "/_astro" internally.
     *
     * @example ["/keystatic", "/api"]
     */
    ignore?: string[];
    /**
     * Path to the translations directory, relative to the project root.
     * Each locale should have a corresponding JSON file, e.g. en.json, fi.json.
     * If not set, translations are disabled.
     *
     * @example "./src/translations"
     */
    translations?: string;
};
/**
 * Minimal Astro context required by Locale.use()
 */
type AstroContext = {
    url: URL;
    cookies: {
        get(name: string): {
            value: string;
        } | undefined;
    };
    redirect(path: string, status?: number): Response;
};
/**
 * The locale instance returned by Locale.use()
 */
type LocaleInstance = {
    code: LocaleCode;
    name: string | undefined;
    endonym: string | undefined;
    phrase: string | undefined;
    direction: LocaleDirection;
    t: (key: string) => string;
    response(): Response | null;
};

export type { AstroContext as A, I18nConfig as I, LocaleCode as L, LocaleConfig as a, LocaleInstance as b };
