# Astro Internationalization (i18n)

![banner](./assets/banner.png)

![npm version](https://img.shields.io/npm/v/@mannisto/astro-i18n)
![license](https://img.shields.io/badge/license-MIT-green)
![astro peer dependency](https://img.shields.io/npm/dependency-version/@mannisto/astro-i18n/peer/astro)

A full-featured i18n integration for Astro. Handles locale detection, URL routing, redirects, cookie persistence, and flat-key translations — across static, server, and hybrid rendering modes.

## Installation

```bash
npm install @mannisto/astro-i18n
pnpm add @mannisto/astro-i18n
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

The `mode` option controls how pages are rendered and how locale detection works.

### Static

Pages prebuilt at build time, locale detection at the root via a small inline script.

- No server required — works on any CDN
- First-time visitors may briefly see the unlocalized root URL before being redirected

### Server

Pages rendered on demand, middleware handles all locale detection and redirects.

- Requires a Node adapter
- No flash on first visit
- Supports unprefixed URL rewrites (e.g. `/about` → `/en/about`)

### Hybrid

Recommended. Pages prerendered for performance, with a server-rendered catch-all route handling root detection and unprefixed URL redirects.

- Requires a Node adapter
- Best of both worlds: static performance with server-side locale handling

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

```astro
---
import { Locale } from "@mannisto/astro-i18n/runtime"

export const getStaticPaths = () => {
  return Locale.supported.map((code) => (
    { params: { locale: code } }
  ))
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

> **Note:** In `server` mode, omit `getStaticPaths` — pages are rendered on demand.

### Layout

Your layout should derive the locale from the URL and sync it to a cookie on every page load. This ensures the correct locale is remembered across visits.

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

### Middleware (server mode)

The middleware is auto-registered in `server` mode. It redirects unprefixed URLs (e.g. `/about` → `/en/about`) and keeps the locale cookie in sync.

You can also compose it manually with other middleware:

```typescript
// src/middleware.ts
import { sequence } from "astro/middleware"
import { onRequest as i18nMiddleware } from "@mannisto/astro-i18n/middleware"
import { onRequest as myMiddleware } from "./my-middleware"

export const onRequest = sequence(i18nMiddleware, myMiddleware)
```

> **Note:** In `hybrid` mode, unprefixed URL redirects are handled by an injected catch-all route, not middleware.

## API

### Locale

```typescript
Locale.supported         // ["en", "fi"] — array of all locale codes
Locale.defaultLocale     // "en"
Locale.get()             // all locale configs
Locale.get("fi")         // { code: "fi", name: "Finnish", endonym: "Suomi", ... }
Locale.from(Astro.url)   // "fi" — derives current locale from URL
```

### Translations

```typescript
const t = Locale.use(locale)
t("nav.home")            // "Home"
```

### URL helpers

```typescript
Locale.url("fi")                      // "/fi/"
Locale.url("fi", "/about")            // "/fi/about"
Locale.url("fi", Astro.url.pathname)  // "/fi/current-path"
```

### Switching locale

```typescript
Locale.switch("fi")  // sets cookie and redirects to the equivalent page in the new locale
```

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

  // URL paths to bypass the middleware — server mode only
  ignore: ["/keystatic", "/api"],
})
```

## License

MIT © [Ere Männistö](https://github.com/eremannisto)