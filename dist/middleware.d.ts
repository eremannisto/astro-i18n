import * as astro from 'astro';

declare const onRequest: astro.MiddlewareHandler;
declare const i18nMiddleware: astro.MiddlewareHandler;

export { i18nMiddleware, onRequest };
