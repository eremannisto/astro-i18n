# Astro Internationalization (i18n)

![banner](./assets/banner.png)

![npm version](https://img.shields.io/npm/v/@mannisto/astro-i18n)
![license](https://img.shields.io/badge/license-MIT-green)
![astro peer dependency](https://img.shields.io/npm/dependency-version/@mannisto/astro-i18n/peer/astro)

A full-featured i18n integration for Astro. Handles locale detection, URL routing, redirects, cookie persistence, and flat-key translations — across static, server, and hybrid rendering modes.

## Installation

```bash
pnpm add @mannisto/astro-i18n
```

```bash
npm install @mannisto/astro-i18n
```

```bash
yarn add @mannisto/astro-i18n
```

## Getting started

### 1. Configure the integration

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

### 2. Set up your file structure

```
src/
├── pages/
│   ├── [locale]/
│   │   └── index.astro   # your locale pages
│   └── 404.astro
└── translations/
    ├── en.json
    └── fi.json
```

> **Note:** Do not create a `src/pages/index.astro`. The integration injects its own root route for locale detection — having your own will cause a build error.

### 3. Add translations

Create one JSON file per locale in your translations directory. Files must use flat keys — no nesting.

```json
{
  "nav.home": "Home",
  "nav.about": "About",
  "footer.copyright": "All rights reserved"
}
```

All locale files must define the same set of keys.

### 4. Set up your layout

Your layout must sync the current locale to a cookie on every page load. This is how the integration remembers the user's locale across visits and correctly resolves it on 404 pages.

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

### 5. Create your locale pages

In `static` and `hybrid` mode, use `getStaticPaths` to prerender a page for each locale:

```astro
---
// src/pages/[locale]/index.astro
import { Locale } from "@mannisto/astro-i18n/runtime"
import Layout from "@layouts/Layout.astro"

export const getStaticPaths = () => {
  return Locale.supported.map((code) => ({
    params: { locale: code }
  }))
}

const locale = Locale.from(Astro.url)
const t = Locale.use(locale)
---

<Layout>
  <h1>{t("nav.home")}</h1>
</Layout>
```

In `server` mode, omit `getStaticPaths` and opt out of prerendering explicitly:

```astro
---
export const prerender = false

import { Locale } from "@mannisto/astro-i18n/runtime"
import Layout from "@layouts/Layout.astro"

const locale = Locale.from(Astro.url)
const t = Locale.use(locale)
---

<Layout>
  <h1>{t("nav.home")}</h1>
</Layout>
```

Without `prerender = false`, Astro will treat dynamic routes as static and throw a `GetStaticPathsRequired` error even in server mode.

### 6. Set up your 404 page

How you set up `404.astro` depends on your mode.

**In `server` mode**, the middleware automatically redirects unprefixed paths to their locale-prefixed equivalent before the 404 page renders (e.g. `/banana` → `/en/banana`). `Locale.from(Astro.url)` always returns the correct locale.

```astro
---
// src/pages/404.astro (server mode)
export const prerender = false

import { Locale } from "@mannisto/astro-i18n/runtime"
import Layout from "@layouts/Layout.astro"

const locale = Locale.from(Astro.url)
const t = Locale.use(locale)
---

<Layout>
  <h1>{t("error.title")}</h1>
  <p>{t("error.description")}</p>
</Layout>
```

**In `static` and `hybrid` mode**, unprefixed paths are not redirected automatically. Use `Locale.redirect(Astro)` at the top of your 404 page — it redirects to the locale-prefixed equivalent using the cookie locale, falling back to `defaultLocale`. Locale-prefixed paths like `/en/banana` pass through and render the 404 content directly.

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

<Layout>
  <h1>{t("error.title")}</h1>
  <p>{t("error.description")}</p>
</Layout>
```

## Modes

### `static`

Pages prebuilt at build time. The injected root route runs client-side, reads the locale cookie, and redirects via `window.location`. No server required.

- Works on any CDN with no adapter
- First-time visitors may briefly see the root URL before being redirected
- Unprefixed paths like `/about` are not auto-redirected — handle them in `404.astro` with `Locale.redirect(Astro)`

### `server`

Pages rendered on demand. The injected root route and middleware handle all locale detection and redirects server-side.

- Requires a Node adapter
- No flash on first visit
- Unprefixed paths (e.g. `/about`) are automatically redirected to their locale-prefixed equivalent

### `hybrid`

Pages prerendered for performance. The injected root route is server-rendered for locale detection, while all other pages are static.

- Requires a Node adapter
- No flash on first visit
- Unprefixed paths like `/about` are not auto-redirected — handle them in `404.astro` with `Locale.redirect(Astro)`

## Language switcher

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

## Middleware

The middleware is auto-registered in `server` and `hybrid` mode. It redirects unprefixed URLs (e.g. `/about` → `/en/about`) and keeps the locale cookie in sync.

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

| Method | Returns | Description |
| --- | --- | --- |
| `Locale.supported` | `["en", "fi"]` | Array of all supported locale codes |
| `Locale.defaultLocale` | `"en"` | The configured default locale |
| `Locale.get()` | `LocaleConfig[]` | All locale configs |
| `Locale.get("fi")` | `LocaleConfig` | Config for a specific locale |
| `Locale.from(Astro.url)` | `"fi"` | Derives the current locale from the URL |
| `Locale.use(locale)` | `t` | Returns a translation function for the given locale — call it as `t("key")` |
| `Locale.switch("fi")` | `void` | Sets the locale cookie and navigates to the equivalent page |


### URL helpers

| Method | Returns |
| --- | --- |
| `Locale.url("fi")` | `"/fi/"` |
| `Locale.url("fi", "/about")` | `"/fi/about"` |
| `Locale.url("fi", Astro.url.pathname)` | `"/fi/current-path"` |

### Locale.redirect

`Locale.redirect(Astro)` returns a redirect `Response` if the URL has no locale prefix, or `null` if it does. Uses the cookie locale if available, falls back to `defaultLocale`. Invalid cookie values are ignored.

Use it at the top of `404.astro` in `static` and `hybrid` mode:

```astro
const redirect = Locale.redirect(Astro)
if (redirect) return redirect
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