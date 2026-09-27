import { APIRoute } from 'astro';

/**
 * Injected at `/` when a server adapter is configured and prefixDefaultLocale is true.
 *
 * Reads the locale cookie for a stored preference, falls back to `defaultLocale`
 * — never infers locale from `Accept-Language` or other headers. Sets the cookie
 * and redirects to the appropriate `/[locale]/` URL.
 */
declare const prerender = false;
declare const GET: APIRoute;

export { GET, prerender };
