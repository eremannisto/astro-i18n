import { AstroIntegration } from 'astro';
import { I as I18nConfig } from './types-DEfk2GVt.js';

/**
 * The @mannisto/astro-i18n Astro integration.
 *
 * Adds locale routing, detection, and translations to your Astro project
 * without relying on Astro's built-in i18n system.
 *
 * @example
 * import i18n from "@mannisto/astro-i18n"
 *
 * export default defineConfig({
 *   integrations: [
 *     i18n({
 *       locales: [
 *         { code: "en", name: "English", endonym: "English" },
 *         { code: "fi", name: "Finnish", endonym: "Suomi", phrase: "Suomeksi" },
 *       ],
 *       routing: {
 *         fallback: "en",
 *         detection: "server",
 *         autoPrefix: { ignore: ["/keystatic"] },
 *       },
 *       translations: "./src/translations",
 *     }),
 *   ],
 * })
 */
declare function i18n(config: I18nConfig): AstroIntegration;

export { i18n as default };
