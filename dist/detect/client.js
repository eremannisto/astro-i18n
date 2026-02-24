// src/detect/client.ts
import { config } from "virtual:astro-i18n/config";
var prerender = true;
var GET = () => {
  const supported = config.locales.map((l) => l.code);
  const fallback = config.routing.fallback;
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
</html>`;
  return new Response(html, {
    headers: { "content-type": "text/html;charset=utf-8" }
  });
};
export {
  GET,
  prerender
};
