import type { APIRoute } from "astro"
import { config } from "virtual:astro-i18n/config"
import type { LocaleConfig } from "../types"

// Injected at / when mode is "static".
//
// Serves a prerendered static HTML page with an inline JS redirect script.
// On first visit, reads localStorage to find a stored preference. If none
// exists, falls back to the defaultLocale. Stores the result in localStorage
// so subsequent visits skip detection, then redirects to the locale URL.
//
// Works in both dev and production since it is a prerendered route rather
// than a file written to the output directory.
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
      const stored = localStorage.getItem("locale");
      const locale = (stored && supported.includes(stored)) ? stored : defaultLocale;
      localStorage.setItem("locale", locale);
      window.location.replace("/" + locale + "/");
    </script>
  </head>
  <body></body>
</html>`

  return new Response(html, {
    headers: { "content-type": "text/html;charset=utf-8" },
  })
}
