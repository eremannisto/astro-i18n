import { APIRoute } from 'astro';

/**
 * Injected at `/` when no server adapter is configured (`output: "static"`).
 *
 * Returns a prerendered HTML page with an inline script that reads the locale
 * cookie and redirects to the appropriate `/[locale]/` URL, falling back to
 * `defaultLocale` if no preference is stored.
 */
declare const prerender = true;
declare const GET: APIRoute;

export { GET, prerender };
