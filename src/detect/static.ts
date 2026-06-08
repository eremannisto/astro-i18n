import { config } from "virtual:astro-i18n/config"
import type { APIRoute } from "astro"

import type { LocaleConfig } from "../types"

/**
 * Injected at `/` when no server adapter is configured (`output: "static"`).
 *
 * Returns a prerendered HTML page with an inline script that reads the locale
 * cookie and redirects to the appropriate `/[locale]/` URL, falling back to
 * `defaultLocale` if no preference is stored.
 */
export const prerender = true

export const GET: APIRoute = () => {
  const supported = config.locales.map((l: LocaleConfig) => l.code)
  const defaultLocale = config.defaultLocale

  const html = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <script>
        const supported = ${JSON.stringify(supported)};
        const defaultLocale = "${defaultLocale}";
        const stored = document.cookie.split("; ").find(r => r.startsWith("locale="))?.split("=")[1];
        const locale = (stored && supported.includes(stored)) ? stored : defaultLocale;
        window.location.replace("/" + locale + "/");
      </script>
    </head>
    <body></body>
  </html>`

  return new Response(html, {
    headers: { "content-type": "text/html;charset=utf-8" },
  })
}
