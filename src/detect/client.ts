import type { APIRoute } from "astro"
import { config } from "virtual:astro-i18n/config"
import type { LocaleConfig } from "../types"

// Injected at / when detection is "client".
//
// Serves a prerendered static HTML page with an inline JS redirect script.
// On first visit, reads navigator.language to determine the user's preferred
// locale, stores it in localStorage so subsequent visits skip detection,
// then redirects to the appropriate locale URL.
//
// Works in both dev and production since it is a prerendered route rather
// than a file written to the output directory.
export const prerender = true

export const GET: APIRoute = () => {
  const supported = config.locales.map((l: LocaleConfig) => l.code)
  const fallback = config.routing.fallback

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <script>
      const supported = ${JSON.stringify(supported)};
      const fallback = "${fallback}";
      const stored = localStorage.getItem("locale");
      const preferred = navigator.language.split("-")[0];
      const locale = stored ?? (supported.includes(preferred) ? preferred : fallback);
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
