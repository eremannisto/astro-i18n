// Auto-registered middleware entrypoint when detection is "server"
// and autoPrefix is enabled. Proxies to Locale.middleware so the
// integration can inject it without the user having to wire it up.
//
// Can also be used manually via Astro's sequence() helper:
// @example
// import { sequence } from "astro/middleware"
// import { Locale } from "@mannisto/astro-i18n/runtime"
// export const onRequest = sequence(Locale.middleware, myMiddleware)
import { Locale } from "./lib/locale"

export const onRequest = Locale.middleware
