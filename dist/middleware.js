// src/middleware.ts
import { defineMiddleware } from "astro/middleware";
import { config } from "virtual:astro-i18n/config";
var onRequest = defineMiddleware(({ url, cookies, redirect }, next) => {
  const pathname = url.pathname;
  const ignore = config.ignore ?? [];
  const codes = config.locales.map((l) => l.code);
  if (ignore.some((path) => pathname.startsWith(path))) return next();
  if (pathname === "/") return next();
  const firstSegment = pathname.split("/")[1];
  if (codes.includes(firstSegment)) {
    const stored2 = cookies.get("locale")?.value;
    if (stored2 !== firstSegment) {
      cookies.set("locale", firstSegment, { path: "/", sameSite: "lax" });
    }
    return next();
  }
  const stored = cookies.get("locale")?.value;
  const targetLocale = stored && codes.includes(stored) ? stored : config.defaultLocale;
  return redirect(`/${targetLocale}${pathname}`, 302);
});
var i18nMiddleware = onRequest;
export {
  i18nMiddleware,
  onRequest
};
