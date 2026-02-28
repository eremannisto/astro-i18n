import type { APIRoute } from "astro"
import { config } from "virtual:astro-i18n/config"
import type { LocaleConfig } from "../types"

// Injected at /[...path] when mode is "hybrid".
//
// Catches requests to unprefixed paths (e.g. /about) that don't match any
// static page and redirects to the locale-prefixed version based on the
// stored cookie, falling back to the defaultLocale.
//
// Paths in the ignore list (e.g. /keystatic, /api) are passed through
// without redirecting, returning 404 to let Astro handle them normally.
export const prerender = false

export const GET: APIRoute = ({ request, cookies, redirect }) => {
  const url = new URL(request.url)
  const codes = config.locales.map((l: LocaleConfig) => l.code)
  const ignore = config.ignore ?? []
  const segments = url.pathname.split("/").filter(Boolean)

  // Pass through ignored paths (e.g. /keystatic, /api)
  if (ignore.some((path: string) => url.pathname.startsWith(path))) {
    return new Response(null, { status: 404 })
  }

  // Already has a valid locale prefix — shouldn't normally reach here
  // but return 404 and let Astro handle it
  if (codes.includes(segments[0])) {
    return new Response(null, { status: 404 })
  }

  const stored = cookies.get("locale")?.value
  const locale = stored && codes.includes(stored) ? stored : config.defaultLocale

  return redirect(`/${locale}${url.pathname}`, 302)
}
