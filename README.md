# Astro Internationalization (i18n)

![banner](./assets/banner.png)

![npm version](https://img.shields.io/npm/v/@mannisto/astro-i18n)
![license](https://img.shields.io/badge/license-MIT-green)
![astro peer dependency](https://img.shields.io/npm/dependency-version/@mannisto/astro-i18n/peer/astro)

A full-featured i18n integration for Astro. Handles locale detection, URL routing, redirects, cookie persistence, and flat-key translations — across static, server, and hybrid rendering modes.

## Installation

```bash
pnpm add @mannisto/astro-i18n
npm install @mannisto/astro-i18n
yarn add @mannisto/astro-i18n
```

## Setup

```typescript
// astro.config.ts
import { defineConfig } from "astro/config"
import i18n from "@mannisto/astro-i18n"

export default defineConfig({
  integrations: [
    i18n({
      defaultLocale: "en",
      locales: [
        { code: "en", name: "English", endonym: "English", phrase: "In English" },
        { code: "fi", name: "Finnish", endonym: "Suomi", phrase: "Suomeksi" },
      ],
      mode: "hybrid",
      translations: "./src/translations",
    }),
  ],
})
```

See the full [Configuration reference](#configuration) below.

## Modes

### `static`

Pages prebuilt at build time, locale detection at the root via a small inline script.

- No server required — works on any CDN
- First-time visitors may briefly see the unlocalized root URL before being redirected
- Unprefixed paths like `/about` are not auto-redirected — handle them in `404.astro` with `Locale.redirect(Astro)`

### `server`

Pages rendered on demand, middleware handles all locale detection and redirects.

- Requires a Node adapter
- No flash on first visit
- Unprefixed paths (e.g. `/about`) are automatically redirected to their locale-prefixed equivalent

### `hybrid`

Pages prerendered for performance, with server-side locale handling at the root.

- Requires a Node adapter
- No flash on first visit
- Unprefixed paths like `/about` are not auto-redirected — handle them in `404.astro` with `Locale.redirect(Astro)`

## Translations

Create a `src/translations/` directory with one JSON file per locale. Files must use flat keys — no nesting.

```json
{
  "nav.home": "Home",
  "nav.about": "About",
  "footer.copyright": "All rights reserved"
}
```

All locale files must define the same set of keys.

## Usage

### Pages

In `static` and `hybrid` mode, use `getStaticPaths` to prerender pages for each locale:

```astro
---
import { Locale } from "@mannisto/astro-i18n/runtime"

export const getStaticPaths = () => {
  return Locale.supported.map((code) => ({ params: { locale: code } }))
}

const locale = Locale.from(Astro.url)
const t = Locale.use(locale)
---

<html lang={locale}>
  <head>
    <meta charset="UTF-8">
    <title>{t("nav.home")}</title>
  </head>
  <body>
    <h1>{t("nav.home")}</h1>
    <a href={Locale.url("fi", Astro.url.pathname)}>Suomeksi</a>
  </body>
</html>
```

In `server` mode, omit `getStaticPaths` and opt out of prerendering explicitly:

```astro
---
export const prerender = false

import { Locale } from "@mannisto/astro-i18n/runtime"

const locale = Locale.from(Astro.url)
const t = Locale.use(locale)
---
```

Without `prerender = false`, Astro will treat dynamic routes as static and throw a `GetStaticPathsRequired` error even in server mode.

### Layout

Your layout should derive the locale from the URL and sync it to a cookie on every page load. This ensures the correct locale is remembered across visits and that 404 pages can detect the locale correctly.

```astro
---
// src/layouts/Layout.astro
import { Locale } from "@mannisto/astro-i18n/runtime"

const locale = Locale.from(Astro.url)
---

<html lang={locale}>
  <head>
    <meta charset="UTF-8" />
    <script is:inline define:vars={{ locale }}>
      document.cookie = `locale=${locale}; path=/; SameSite=Lax; Max-Age=31536000`
    </script>
  </head>
  <body>
    <slot />
  </body>
</html>
```

### 404 pages

Create a `src/pages/404.astro` at the root of your pages directory. How the locale is resolved depends on your mode.

**In `server` mode**, the middleware automatically redirects all unprefixed paths to their locale-prefixed equivalent before the 404 page renders (e.g. `/banana` → `/en/banana`). `Locale.from(Astro.url)` always returns the correct locale.

```astro
---
// src/pages/404.astro (server mode)
export const prerender = false

import { Locale } from "@mannisto/astro-i18n/runtime"
import Layout from "@layouts/Layout.astro"

const locale = Locale.from(Astro.url)
const t = Locale.use(locale)
---

<Layout title={t("error.title")}>
  <h1>{t("error.title")}</h1>
  <p>{t("error.description")}</p>
</Layout>
```

**In `static` and `hybrid` mode**, unprefixed paths are not redirected automatically. Use `Locale.redirect(Astro)` at the top of your 404 page — it redirects the visitor to the locale-prefixed equivalent (e.g. `/banana` → `/en/banana`) using the cookie locale, falling back to `defaultLocale`. Locale-prefixed paths like `/en/banana` pass through and render the 404 content directly.

```astro
---
// src/pages/404.astro (static and hybrid mode)
export const prerender = false

import { Locale } from "@mannisto/astro-i18n/runtime"
import Layout from "@layouts/Layout.astro"

const redirect = Locale.redirect(Astro)
if (redirect) return redirect

const locale = Locale.from(Astro.url)
const t = Locale.use(locale)
---

<Layout title={t("error.title")}>
  <h1>{t("error.title")}</h1>
  <p>{t("error.description")}</p>
</Layout>
```

### Language switcher

```astro
---
import { Locale } from "@mannisto/astro-i18n/runtime"

const locales = Locale.get()
---

{locales.map((locale) => (
  <button data-locale={locale.code}>
    {locale.phrase ?? locale.endonym}
  </button>
))}

<script>
  import { Locale } from "@mannisto/astro-i18n/runtime"

  document.querySelectorAll("button[data-locale]").forEach((button) => {
    button.addEventListener("click", () => {
      const locale = button.getAttribute("data-locale")
      if (locale) Locale.switch(locale)
    })
  })
</script>
```

### Middleware

The middleware is auto-registered in `server` and `hybrid` mode. It redirects unprefixed URLs (e.g. `/about` → `/en/about`), keeps the locale cookie in sync, and automatically skips prerendered pages to avoid warnings about unavailable request headers.

You can also compose it manually with other middleware:

```typescript
// src/middleware.ts
import { sequence } from "astro/middleware"
import { onRequest as i18nMiddleware } from "@mannisto/astro-i18n/middleware"
import { onRequest as myMiddleware } from "./my-middleware"

export const onRequest = sequence(i18nMiddleware, myMiddleware)
```

## API

### Locale

```typescript
Locale.supported       // ["en", "fi"] — array of all locale codes
Locale.defaultLocale   // "en"
Locale.get()           // all locale configs
Locale.get("fi")       // { code: "fi", name: "Finnish", endonym: "Suomi", ... }
Locale.from(Astro.url) // "fi" — derives current locale from URL
```

### Translations

```typescript
const t = Locale.use(locale)
t("nav.home") // "Home"
```

### URL helpers

```typescript
Locale.url("fi")                     // "/fi/"
Locale.url("fi", "/about")           // "/fi/about"
Locale.url("fi", Astro.url.pathname) // "/fi/current-path"
```

### Switching locale

```typescript
Locale.switch("fi") // sets cookie and navigates to the equivalent page in the new locale
```

### Locale.redirect

```typescript
// Returns a redirect Response if the URL has no locale prefix, or null if it does.
// Use at the top of 404.astro in static and hybrid mode.
const redirect = Locale.redirect(Astro)
if (redirect) return redirect
```

Uses the locale cookie if available, falls back to `defaultLocale`. Invalid cookie values are ignored.

## Configuration

```typescript
i18n({
  // List of supported locales (required)
  locales: [
    {
      code: "en",           // used in URLs: /en/about
      name: "English",      // display name in English
      endonym: "English",   // display name in its own language
      phrase: "In English", // optional — for use in locale switchers
    },
  ],

  // Locale to fall back to when no preference is stored — default: first locale
  defaultLocale: "en",

  // Rendering and detection mode — default: "static"
  mode: "static" | "server" | "hybrid",

  // Path to translation JSON files — omit to disable translations
  translations: "./src/translations",

  // URL paths to bypass the middleware — server and hybrid mode only.
  // Plain paths match the exact path and all sub-paths (e.g. "/keystatic" also matches "/keystatic/dashboard").
  // Glob patterns are also supported for more specific rules (e.g. "/api/uploads/**/*.png").
  ignore: ["/keystatic", "/api"],
})
```

## Development

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, testing, and publishing instructions.

## License

MIT © [Ere Männistö](https://github.com/eremannisto)