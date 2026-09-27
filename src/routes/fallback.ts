import type { APIRoute } from "astro"

/**
 * Injected as an on-demand catch-all route in builds with a server adapter.
 *
 * Without this route, a path such as `/about` matches only prerendered routes,
 * and the middleware does not run for it in production.
 */
export const prerender = false

export const ALL: APIRoute = () => new Response(null, { status: 404 })
