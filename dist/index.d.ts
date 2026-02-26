import { AstroIntegration } from 'astro';
import { I as I18nConfig } from './types-DA5S96LP.js';

/**
 * The @mannisto/astro-i18n Astro integration.
 *
 * Adds locale routing, detection, and translations to your Astro project
 * without relying on Astro's built-in i18n system.
 */
declare function i18n(config: I18nConfig): AstroIntegration;

export { i18n as default };
