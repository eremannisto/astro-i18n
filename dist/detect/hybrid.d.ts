import { APIRoute } from 'astro';

/**
 * Injected at `/` when `output: "static"` is configured with a server adapter.
 *
 * Reads the locale cookie for a stored preference, falls back to `defaultLocale`,
 * then sets the cookie and redirects to the appropriate `/[locale]/` URL.
 *
 * All `/[locale]/` pages remain prerendered — only this route is server-rendered.
 * The cookie can also be updated client-side via `Locale.switch()`.
 */
declare const prerender = false;
declare const GET: APIRoute;

export { GET, prerender };
