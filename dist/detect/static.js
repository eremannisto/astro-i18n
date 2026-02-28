// src/detect/static.ts
import { config } from "virtual:astro-i18n/config";
var prerender = true;
var GET = () => {
  const supported = config.locales.map((l) => l.code);
  const defaultLocale = config.defaultLocale;
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
  </html>`;
  return new Response(html, {
    headers: { "content-type": "text/html;charset=utf-8" }
  });
};
export {
  GET,
  prerender
};
