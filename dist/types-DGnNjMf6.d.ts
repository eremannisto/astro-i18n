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
     * When true, the default locale uses a prefix like the other locales: /en/about.
     * When false, the default locale has no prefix: /about.
     * Defaults to true.
     */
    prefixDefaultLocale?: boolean;
    /**
     * Path to the translations directory, relative to the project root.
     * Each locale must have a JSON file, e.g. en.json, fi.json.
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
};
/**
 * Values for the {{name}} placeholders in a translation, e.g. { user: "World" }
 */
type TranslationValues = Record<string, string | number>;
/**
 * The locale instance returned by Locale.use()
 */
type LocaleInstance = {
    code: LocaleCode;
    name: string | undefined;
    endonym: string | undefined;
    phrase: string | undefined;
    direction: LocaleDirection;
    t: (key: string, values?: TranslationValues) => string;
};

export type { AstroContext as A, I18nConfig as I, LocaleCode as L, TranslationValues as T, LocaleConfig as a, LocaleDirection as b, LocaleInstance as c };
