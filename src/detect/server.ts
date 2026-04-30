import { config } from "virtual:astro-i18n/config"
import type { APIRoute } from "astro"

import type { LocaleConfig } from "../types"

/**
 * Injected at `/` when `output: "server"` is configured.
 *
 * Reads the locale cookie for a stored preference, falls back to `defaultLocale`
 * — never infers locale from `Accept-Language` or other headers. Sets the cookie
 * and redirects to the appropriate `/[locale]/` URL.
 */
export const prerender = false

export const GET: APIRoute = ({ cookies, redirect }) => {
  const supported = config.locales.map((l: LocaleConfig) => l.code)
  const defaultLocale = config.defaultLocale

  // Read stored preference or fall back to defaultLocale
  const stored = cookies.get("locale")?.value
  const locale = stored && supported.includes(stored) ? stored : defaultLocale

  // Set cookie so return visits are handled correctly
  cookies.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: true,
  })

  return redirect(`/${locale}/`, 302)
}
