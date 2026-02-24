import type { APIRoute } from "astro"
import { Locale } from "../lib/locale"

// Injected at / when detection is "server".
//
// On first visit, reads the Accept-Language header to determine the user's
// preferred locale, sets a cookie so subsequent visits skip detection,
// then redirects to the appropriate locale URL.
//
// On return visits, reads the cookie directly and redirects.
export const prerender = false

export const GET: APIRoute = ({ request, cookies, redirect }) => {
  // return visits — cookie takes priority over header
  const stored = cookies.get("locale")?.value
  if (stored && Locale.supported.includes(stored)) {
    return redirect(`/${stored}/`, 302)
  }

  // first visit — parse Accept-Language header
  // e.g. "fi-FI,fi;q=0.9,en;q=0.8" → "fi"
  const header = request.headers.get("accept-language") ?? ""
  const preferred = header.split(",")[0].split(";")[0].split("-")[0].trim().toLowerCase()

  const locale = Locale.supported.includes(preferred) ? preferred : Locale.fallback

  cookies.set("locale", locale, { path: "/" })
  return redirect(`/${locale}/`, 302)
}
