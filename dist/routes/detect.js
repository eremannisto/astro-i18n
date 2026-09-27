// src/routes/detect.ts
import { config } from "virtual:astro-i18n/config";
var prerender = false;
var GET = ({ cookies, redirect }) => {
  const supported = config.locales.map((l) => l.code);
  const stored = cookies.get("locale")?.value;
  const locale = stored && supported.includes(stored) ? stored : config.defaultLocale;
  cookies.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: true
  });
  return redirect(`/${locale}/`, 302);
};
export {
  GET,
  prerender
};
