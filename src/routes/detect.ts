import { config } from "virtual:astro-i18n/config"
import type { APIRoute } from "astro"

import { COOKIE_AGE } from "../constants"
import { Paths } from "../lib/paths"
import type { LocaleConfig } from "../types"

/**
 * Injected at `/` when a server adapter is configured and prefixDefaultLocale is true.
 *
 * Reads the locale cookie for a stored preference, falls back to `defaultLocale`
 * — never infers locale from `Accept-Language` or other headers. Sets the cookie
 * and redirects to the appropriate `/[locale]/` URL.
 */
export const prerender = false

export const GET: APIRoute = ({ cookies, redirect }) => {
  const supported = config.locales.map((l: LocaleConfig) => l.code)
  const stored = cookies.get("locale")?.value
  const locale = stored && supported.includes(stored) ? stored : config.defaultLocale

  cookies.set("locale", locale, {
    path: "/",
    maxAge: COOKIE_AGE,
    sameSite: "lax",
  })

  return redirect(Paths.add(`/${locale}/`), 302)
}
