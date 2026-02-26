import { Locale } from "./lib/locale"

/**
 * Re-exports Locale.middleware for use as an Astro middleware entrypoint.
 * Registered automatically in server mode via addMiddleware() in src/index.ts.
 */
export const onRequest = Locale.middleware
