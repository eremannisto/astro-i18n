import { APIRoute } from 'astro';

/**
 * Injected as an on-demand catch-all route in builds with a server adapter.
 *
 * Without this route, a path such as `/about` matches only prerendered routes,
 * and the middleware does not run for it in production.
 */
declare const prerender = false;
declare const ALL: APIRoute;

export { ALL, prerender };
