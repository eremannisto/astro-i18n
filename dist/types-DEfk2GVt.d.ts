/** A locale code, e.g. "en", "fi", "fr" */
type LocaleCode = string;
/** Configuration for a single locale */
type LocaleConfig = {
    /** The locale code, e.g. "en" */
    code: LocaleCode;
    /** The locale name in English, e.g. "English" */
    name: string;
    /** The locale name in its own language, e.g. "Suomi" */
    endonym: string;
    /** Optional short phrase for locale switchers, e.g. "Suomeksi" */
    phrase?: string;
};
/**
 * How the user's preferred locale is detected on their first visit.
 *
 * - "server" — reads the Accept-Language header via a server-side API route
 * - "client" — reads navigator.language via a static JS redirect page
 * - "none"   — no detection, user must navigate to a locale URL directly
 */
type DetectionMode = "server" | "client" | "none";
/**
 * Configuration for the autoPrefix middleware.
 * Only valid when detection is "server".
 */
type AutoPrefixConfig = {
    /**
     * URL path prefixes that should bypass the autoPrefix middleware.
     * Useful for CMS admin routes, API routes, etc.
     *
     * @example ["/keystatic", "/api"]
     */
    ignore?: string[];
};
/** User-supplied routing configuration */
type RoutingConfig = {
    /**
     * The locale code to fall back to when no match is found.
     * Defaults to the first locale in the locales array.
     */
    fallback?: LocaleCode;
    /**
     * How the user's preferred locale is detected on first visit.
     * @default "client"
     */
    detection?: DetectionMode;
    /**
     * When enabled, the middleware automatically prefixes unknown routes
     * with the user's preferred locale. Only valid when detection is "server".
     *
     * Set to false to disable entirely, or pass an object to configure
     * which paths should be ignored.
     *
     * @default { ignore: ["/_astro"] }
     */
    autoPrefix?: boolean | AutoPrefixConfig;
};
/** The configuration object passed to the i18n() integration */
type I18nConfig = {
    /** The list of supported locales, in order of preference */
    locales: LocaleConfig[];
    /** Routing and detection options */
    routing?: RoutingConfig;
    /**
     * Path to the translations directory, relative to the project root.
     * Each locale should have a corresponding JSON file, e.g. en.json, fi.json.
     * If not set, translations are disabled and Locale.t() will warn when called.
     *
     * @example "./src/translations"
     */
    translations?: string;
};

export type { I18nConfig as I, LocaleCode as L, LocaleConfig as a };
