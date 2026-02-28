// src/redirect/hybrid.ts
import { config } from "virtual:astro-i18n/config";
var prerender = false;
var GET = ({ request, cookies, redirect }) => {
  const url = new URL(request.url);
  const codes = config.locales.map((l) => l.code);
  const ignore = config.ignore ?? [];
  const segments = url.pathname.split("/").filter(Boolean);
  if (ignore.some((path) => url.pathname.startsWith(path))) {
    return new Response(null, { status: 404 });
  }
  if (codes.includes(segments[0])) {
    return new Response(null, { status: 404 });
  }
  const stored = cookies.get("locale")?.value;
  const locale = stored && codes.includes(stored) ? stored : config.defaultLocale;
  return redirect(`/${locale}${url.pathname}`, 302);
};
export {
  GET,
  prerender
};
