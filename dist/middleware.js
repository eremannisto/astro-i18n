import {
  Paths
} from "./chunk-4N5FPK3J.js";
import {
  FALLBACK_PATTERN
} from "./chunk-M3HKFVOR.js";

// src/middleware.ts
import { config } from "virtual:astro-i18n/config";
import { defineMiddleware } from "astro/middleware";
var codes = config.locales.map((l) => l.code);
function isRootRoute(pattern) {
  return !pattern.startsWith("/[locale]") && pattern !== "/404" && pattern !== FALLBACK_PATTERN;
}
var onRequest = defineMiddleware((context, next) => {
  if (context.isPrerendered && !import.meta.env.DEV) return next();
  if (context.locals.i18nRewrite) return next();
  const path = Paths.strip(context.url.pathname);
  if (isRootRoute(context.routePattern)) return next();
  const locale = path.split("/")[1];
  if (config.prefixDefaultLocale) {
    return codes.includes(locale) ? render(context, next) : redirect(context, path);
  }
  if (locale === config.defaultLocale) return notFound(context);
  return codes.includes(locale) ? render(context, next) : rewrite(context, path);
});
function render(context, next) {
  return context.routePattern === FALLBACK_PATTERN ? notFound(context) : next();
}
function redirect(context, path) {
  const stored = context.cookies.get("locale")?.value;
  const locale = stored && codes.includes(stored) ? stored : config.defaultLocale;
  return context.redirect(Paths.add(`/${locale}${path}`), 302);
}
async function rewrite(context, path) {
  context.locals.i18nRewrite = true;
  const target = Paths.add(`/${config.defaultLocale}${path}`);
  const response = await context.rewrite(target).catch(() => null);
  if (!response || response.status === 404) return notFound(context);
  return response;
}
async function notFound(context) {
  context.locals.i18nRewrite = true;
  const response = await context.rewrite(Paths.add("/404")).catch(() => null);
  if (!response || response.status >= 500) return new Response(null, { status: 404 });
  return new Response(response.body, { status: 404, headers: response.headers });
}
export {
  onRequest
};
