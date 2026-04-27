import { config } from "virtual:astro-i18n/config"
import type { APIRoute } from "astro"

import type { LocaleConfig } from "../types"

// Injected at / when mode is "server".
//
// Reads the locale cookie to find a stored preference. If none exists,
// falls back to the defaultLocale. Never assumes the user's language from
// Accept-Language or any other header — the developer's defaultLocale is
// the only fallback.
//
// Sets the cookie with SameSite=Lax and Secure for HTTPS sites, then
// redirects to the appropriate locale URL.
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
