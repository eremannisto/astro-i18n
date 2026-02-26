import * as astro from 'astro';

/**
 * Re-exports Locale.middleware for use as an Astro middleware entrypoint.
 * Registered automatically in server mode via addMiddleware() in src/index.ts.
 */
declare const onRequest: astro.MiddlewareHandler;

export { onRequest };
