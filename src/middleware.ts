import { config } from "virtual:astro-i18n/config"
import type { APIContext, MiddlewareNext } from "astro"
import { defineMiddleware } from "astro/middleware"

import { FALLBACK_PATTERN } from "./constants"
import { Paths } from "./lib/paths"
import type { LocaleConfig } from "./types"

const codes = config.locales.map((l: LocaleConfig) => l.code)

/**
 * Returns true for pages outside the [locale] folder, e.g. /privacy or /api/data.
 * The 404 route and the fallback route also get locale paths, so they are not root routes.
 */
function isRootRoute(pattern: string): boolean {
  return !pattern.startsWith("/[locale]") && pattern !== "/404" && pattern !== FALLBACK_PATTERN
}

export const onRequest = defineMiddleware((context, next) => {
  // Prerendered pages render at build time with their /[locale] path
  if (context.isPrerendered && !import.meta.env.DEV) return next()

  // The second pass after a rewrite from this middleware
  if (context.locals.i18nRewrite) return next()

  const path = Paths.strip(context.url.pathname)
  if (isRootRoute(context.routePattern)) return next()

  const locale = path.split("/")[1]

  if (config.prefixDefaultLocale) {
    return codes.includes(locale) ? render(context, next) : redirect(context, path)
  }

  if (locale === config.defaultLocale) return notFound(context)
  return codes.includes(locale) ? render(context, next) : rewrite(context, path)
})

/**
 * Renders the page of a locale path. The fallback route has no page for the path.
 */
function render(context: APIContext, next: MiddlewareNext) {
  return context.routePattern === FALLBACK_PATTERN ? notFound(context) : next()
}

/**
 * prefixDefaultLocale: true. Sends a path without a locale prefix to the
 * stored cookie locale or to the default locale: /about?id=12 becomes /en/about?id=12.
 */
function redirect(context: APIContext, path: string) {
  const stored = context.cookies.get("locale")?.value
  const locale = stored && codes.includes(stored) ? stored : config.defaultLocale
  return context.redirect(Paths.add(`/${locale}${path}`) + context.url.search, 302)
}

/**
 * prefixDefaultLocale: false. Renders the default locale page for a path
 * without a locale prefix: /about?id=12 shows /en/about?id=12.
 */
async function rewrite(context: APIContext, path: string) {
  context.locals.i18nRewrite = true
  const target = Paths.add(`/${config.defaultLocale}${path}`) + context.url.search
  const response = await context.rewrite(target).catch(() => null)
  if (!response || isEmptyNotFound(response)) return notFound(context)
  return response
}

/**
 * Returns true for a 404 response without a body. Inside a rewrite, Astro 6 does not show
 * the 404 page for it. A 404 with a body stays as it is, for example a page that already
 * shows the 404 page: a second rewrite to /404 is a loop, and the page is empty.
 */
function isEmptyNotFound(response: Response): boolean {
  return response.status === 404 && response.body === null
}

/**
 * Renders the 404 page with a rewrite. In production, a prerendered 404 page
 * cannot be a rewrite target. Then an empty 404 makes Astro serve the 404 page.
 */
async function notFound(context: APIContext) {
  context.locals.i18nRewrite = true
  const response = await context.rewrite(Paths.add("/404")).catch(() => null)
  if (!response || response.status >= 500) return new Response(null, { status: 404 })
  return new Response(response.body, { status: 404, headers: response.headers })
}
