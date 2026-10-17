import {
  Locale
} from "../chunk-WHGHTOS6.js";
import "../chunk-HZWZ5KVJ.js";
import {
  COOKIE_AGE
} from "../chunk-M3HKFVOR.js";

// src/routes/detect.ts
import { config } from "virtual:astro-i18n/config";
var prerender = false;
var GET = ({ cookies, redirect }) => {
  const supported = config.locales.map((l) => l.code);
  const stored = cookies.get("locale")?.value;
  const locale = stored && supported.includes(stored) ? stored : config.defaultLocale;
  cookies.set("locale", locale, {
    path: "/",
    maxAge: COOKIE_AGE,
    sameSite: "lax"
  });
  return redirect(Locale.url(locale), 302);
};
export {
  GET,
  prerender
};
