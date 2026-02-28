import { defineMiddleware } from "astro/middleware"
import pm from "picomatch"
import { config } from "virtual:astro-i18n/config"
import type { LocaleConfig } from "./types"

export const onRequest = defineMiddleware(({ url, cookies, redirect, isPrerendered }, next) => {
  // Skip middleware during prerendering — request headers are not available
  // and cookies cannot be set on prerendered static responses
  if (isPrerendered) return next()

  const pathname = url.pathname
  const ignore = config.ignore ?? []
  const codes = config.locales.map((l: LocaleConfig) => l.code)

  // Ignore patterns support full glob syntax via picomatch (e.g. /api/**)
  if (ignore.some((pattern: string) => pm(pattern)(pathname))) return next()

  if (pathname === "/") return next()

  const firstSegment = pathname.split("/")[1]

  // Path already has a valid locale prefix — sync the cookie if needed
  if (codes.includes(firstSegment)) {
    const stored = cookies.get("locale")?.value
    if (stored !== firstSegment) {
      cookies.set("locale", firstSegment, { path: "/", sameSite: "lax" })
    }
    return next()
  }

  // No locale prefix — redirect to stored cookie locale or defaultLocale
  const stored = cookies.get("locale")?.value
  const targetLocale = stored && codes.includes(stored) ? stored : config.defaultLocale

  return redirect(`/${targetLocale}${pathname}`, 302)
})

export const i18nMiddleware = onRequest
