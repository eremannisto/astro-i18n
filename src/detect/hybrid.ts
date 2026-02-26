import type { APIRoute } from "astro"
import { config } from "virtual:astro-i18n/config"
import type { LocaleConfig } from "../types"

// Injected at / when mode is "hybrid".
//
// Identical to server detection — reads the locale cookie to find a stored
// preference, falls back to defaultLocale if none exists. Sets the cookie
// and redirects to the appropriate locale URL.
//
// The difference from server mode is that all /[locale]/ pages remain
// fully static. Only this route is server-rendered. The cookie can also
// be updated client-side via Locale.switch() when the user changes locale,
// so return visits to / always redirect correctly.
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
