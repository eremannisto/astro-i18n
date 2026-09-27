import {
  FALLBACK_PATTERN
} from "./chunk-MSYXYLNW.js";

// src/middleware.ts
import { config } from "virtual:astro-i18n/config";
import { defineMiddleware } from "astro/middleware";
import pm from "picomatch";
var codes = config.locales.map((l) => l.code);
function expandPattern(pattern) {
  if (pattern.includes("*")) return [pattern];
  return [pattern, `${pattern}/**`];
}
var isIgnored = pm(config.ignore.flatMap(expandPattern));
function isRootRoute(pattern) {
  return !pattern.startsWith("/[locale]") && pattern !== "/404" && pattern !== FALLBACK_PATTERN;
}
var onRequest = defineMiddleware((context, next) => {
  if (context.isPrerendered && !import.meta.env.DEV) return next();
  if (context.locals.i18nRewrite) return next();
  const { pathname } = context.url;
  if (isIgnored(pathname) || isRootRoute(context.routePattern)) return next();
  const locale = pathname.split("/")[1];
  if (config.prefixDefaultLocale) {
    return codes.includes(locale) ? render(context, next) : redirect(context);
  }
  if (locale === config.defaultLocale) return notFound(context);
  return codes.includes(locale) ? render(context, next) : rewrite(context);
});
function render(context, next) {
  return context.routePattern === FALLBACK_PATTERN ? notFound(context) : next();
}
function redirect(context) {
  const stored = context.cookies.get("locale")?.value;
  const locale = stored && codes.includes(stored) ? stored : config.defaultLocale;
  return context.redirect(`/${locale}${context.url.pathname}`, 302);
}
async function rewrite(context) {
  context.locals.i18nRewrite = true;
  const path = `/${config.defaultLocale}${context.url.pathname}`;
  const response = await context.rewrite(path).catch(() => null);
  if (!response || response.status === 404) return notFound(context);
  return response;
}
async function notFound(context) {
  context.locals.i18nRewrite = true;
  const response = await context.rewrite("/404").catch(() => null);
  if (!response || response.status >= 500) return new Response(null, { status: 404 });
  return new Response(response.body, { status: 404, headers: response.headers });
}
export {
  onRequest
};
