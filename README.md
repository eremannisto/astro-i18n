# Astro Internationalization (i18n)

![banner](./assets/banner.png)

![npm version](https://img.shields.io/npm/v/@mannisto/astro-i18n)
![license](https://img.shields.io/badge/license-MIT-green)
![astro peer dependency](https://img.shields.io/npm/dependency-version/@mannisto/astro-i18n/peer/astro)

A flexible alternative to Astro's built-in internationalization, with locale routing, detection, and translations for static and SSR sites.

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

## Configuration

Add the integration to your `astro.config.ts`.

```typescript
// astro.config.ts
import { defineConfig } from "astro/config"
import i18n from "@mannisto/astro-i18n"

export default defineConfig({
  integrations: [
    i18n({
      /**
       * Supported locales in order of preference.
       * @required
       */
      locales: [
        {
          code: "en",           // Used in URLs: /en/about
          name: "English",      // Display name in English
          endonym: "English",   // Display name in its own language
          phrase: "In English", // Optional — for locale switchers
          direction: "ltr",     // Optional — defaults to "ltr"
        },
        {
          code: "fi",
          name: "Finnish",
          endonym: "Suomi",
          phrase: "Suomeksi",
        },
      ],

      /**
       * Default: first locale in the list.
       * @optional
       */
      defaultLocale: "en",

      /**
       * Controls locale detection behaviour. Default: "static". See Modes below.
       * @optional
       */
      mode: "static",

      /**
       * Path to translation JSON files. Omit to disable translations.
       * @optional
       */
      translations: "./src/translations",

      /**
       * URL paths that bypass the middleware. Server and hybrid mode only. Glob patterns supported.
       * @optional
       */
      ignore: ["/keystatic", "/api/uploads/**/*.png"],
    }),
  ],
})
```

## File structure

Pages are organized under a `[locale]` folder, and each page is served at a URL prefixed with the locale code, for example `/en/about` or `/fi/about`.

```
src/
├── pages/
│   ├── [locale]/
│   │   ├── index.astro
│   │   └── about.astro
│   └── 404.astro
└── translations/
    ├── en.json
    └── fi.json
```

> ⚠️ Do not create `src/pages/index.astro`. The integration injects its own root route for locale detection, and a conflicting file will cause a build error.

## Choosing a mode

Choose a mode that matches your site's output. Use `static` for fully static sites, `server` for fully server-rendered sites, and `hybrid` when you want static locale pages with a server-rendered entry point.

### Static

The default mode. All pages are built as static files at compile time. When a visitor lands on `/`, the browser runs a small script that checks their saved locale preference and redirects them to the correct locale URL.

- No server adapter required
- Locale pages built at compile time
- Root `/` redirect handled client-side

### Server

All pages are rendered on demand. When a visitor lands on `/` or any path without a locale prefix, the server reads their locale preference from a cookie and redirects them before any HTML is sent.

- Requires a server adapter (e.g. `@astrojs/node`)
- Locale pages rendered per request
- All redirects handled server-side via middleware

### Hybrid

Locale pages such as `/en/about` are built as static files, but the root `/` and 404 page are handled server-side. This gives you static locale pages with server-side redirect handling at the entry point.

- Requires a server adapter (e.g. `@astrojs/node`)
- Locale pages built at compile time
- Root `/` redirect handled server-side

## Locale pages

### Building a locale page

In `static` and `hybrid` mode, use `getStaticPaths` to generate a page for each supported locale at compile time:

```astro
---
// src/pages/[locale]/index.astro
import { Locale } from "@mannisto/astro-i18n/runtime"
import Layout from "@layouts/Layout.astro"

export const getStaticPaths = () => {
  return Locale.supported.map((code) => ({
    params: { locale: code },
  }))
}

const t = Locale.t(Astro.url)
---

<Layout>
  <h1>{t("nav.home")}</h1>
</Layout>
```

In `server` mode, omit `getStaticPaths` and add `export const prerender = false`. Without it, Astro throws a `GetStaticPathsRequired` error even when a server adapter is configured.

```astro
---
// src/pages/[locale]/index.astro
export const prerender = false

import { Locale } from "@mannisto/astro-i18n/runtime"
import Layout from "@layouts/Layout.astro"

const t = Locale.t(Astro.url)
---

<Layout>
  <h1>{t("nav.home")}</h1>
</Layout>
```

### The 404 page

Any URL without a locale prefix lands on the 404 page. The 404 page detects the user's locale preference and redirects to the correct URL, making it a key part of the routing setup. How this is handled depends on the mode.

#### Static

Without a server, the redirect happens in the browser. Place `<LocaleRedirect>` in the head.

```astro
---
// src/pages/404.astro
import { LocaleRedirect } from "@mannisto/astro-i18n/components"
import { Locale } from "@mannisto/astro-i18n/runtime"

const locale = Locale.from(Astro.url)
---

<html lang={locale}>
  <head>
    <LocaleRedirect />
    <title>404</title>
  </head>
  <body>
    <h1>404</h1>
  </body>
</html>
```

#### Server

The middleware catches unprefixed paths before they reach the 404 page. No additional handling is needed here.

```astro
---
// src/pages/404.astro
export const prerender = false

import { Locale } from "@mannisto/astro-i18n/runtime"

const locale = Locale.from(Astro.url)
---

<html lang={locale}>
  <head>
    <title>404</title>
  </head>
  <body>
    <h1>404</h1>
  </body>
</html>
```

#### Hybrid

Locale pages are static, so some unprefixed paths reach the 404 page directly. Use `Locale.response()` to redirect server-side.

```astro
---
// src/pages/404.astro
export const prerender = false

import { Locale } from "@mannisto/astro-i18n/runtime"

const response = Locale.response(Astro)
if (response) return response

const locale = Locale.from(Astro.url)
---

<html lang={locale}>
  <head>
    <title>404</title>
  </head>
  <body>
    <h1>404</h1>
  </body>
</html>
```

## Layout

Each locale page needs `<LocaleCookie>` in the `<head>` to persist the current locale to a cookie. A shared layout is a convenient place for it, but it can be added to each page directly as well.

`<LocaleHreflang>` renders `<link rel="alternate">` hreflang tags for all supported locales. It is optional, but recommended for SEO.

```astro
---
// src/layouts/Layout.astro
import { Locale } from "@mannisto/astro-i18n/runtime"
import { LocaleCookie, LocaleHreflang } from "@mannisto/astro-i18n/components"

const locale = Locale.from(Astro.url)
const site = Astro.site ?? Astro.url.origin
---

<html lang={locale}>
  <head>
    <meta charset="UTF-8" />
    <LocaleCookie locale={locale} />
    <LocaleHreflang url={Astro.url} site={site} />
  </head>
  <body>
    <slot />
  </body>
</html>
```

## Translations

Create one JSON file per locale in the configured `translations` directory. Use flat keys without nesting.

```json
{
  "nav.home": "Home",
  "nav.about": "About",
  "footer.copyright": "All rights reserved"
}
```

All locale files must define the same set of keys. Use `Locale.t` to get a translation function scoped to the current page's locale:

```astro
---
import { Locale } from "@mannisto/astro-i18n/runtime"

const t = Locale.t(Astro.url)
---

<h1>{t("nav.home")}</h1>
```

> For non-Astro components such as React or Vue, pass the locale as a prop from the parent page and use `Locale.use` to get the translation function.

## Language switcher

No switcher component is provided, but `Locale.get()` and `Locale.switch()` give you everything needed to build one. Below is an example pattern.

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
      if (locale) {
        Locale.switch(locale)
      }
    })
  })
</script>
```

## Advanced

### Middleware composition

In `server` and `hybrid` mode, the integration middleware is registered automatically with `order: "pre"`. Any middleware you add in `src/middleware.ts` will run after it without any additional setup.

### Ignoring paths

In `server` and `hybrid` mode, paths can be excluded from middleware processing with the `ignore` option. Plain paths match the path and all sub-paths. Glob patterns are also supported.

```typescript
i18n({
  ignore: ["/keystatic", "/api/uploads/**/*.png"],
})
```


## Components

### `LocaleCookie`

Writes the current locale to a cookie. Place in the `<head>` on every locale page through your layout.

```astro
import { LocaleCookie } from "@mannisto/astro-i18n/components"

<LocaleCookie locale={locale} />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `locale` | `string` | required | Current locale code |
| `age` | `number` | `31536000` | Cookie max-age in seconds |

### `LocaleHreflang`

Renders `<link rel="alternate">` hreflang tags for all supported locales plus `x-default`. Place in the `<head>` through your layout.

```astro
import { LocaleHreflang } from "@mannisto/astro-i18n/components"

<LocaleHreflang url={Astro.url} site={Astro.site ?? Astro.url.origin} />
```

| Prop | Type | Description |
|------|------|-------------|
| `url` | `URL` | Current page URL. Pass `Astro.url`. |
| `site` | `URL \| string` | Base site URL. Pass `Astro.site ?? Astro.url.origin`. |

### `LocaleRedirect`

A client-side redirect script that reads the locale cookie and redirects the browser to the correct locale-prefixed path. Has no effect if the current path already has a valid locale prefix. Use in `404.astro` in `static` mode only.

```astro
import { LocaleRedirect } from "@mannisto/astro-i18n/components"

<LocaleRedirect />
```

## API reference

### Locale

| Method | Returns | Description |
|--------|---------|-------------|
| `Locale.supported` | `string[]` | All supported locale codes |
| `Locale.defaultLocale` | `string` | The configured default locale |
| `Locale.get()` | `LocaleConfig[]` | All locale configs |
| `Locale.get("fi")` | `LocaleConfig` | Config for a specific locale |
| `Locale.from(Astro.url)` | `string` | Derives the current locale from the URL |
| `Locale.t(Astro.url)` | `(key: string) => string` | Translation function for the current URL |
| `Locale.use(locale)` | `(key: string) => string` | Translation function for a given locale code |
| `Locale.url("fi", "/about")` | `string` | Builds a locale-prefixed URL |
| `Locale.direction(Astro.url)` | `"ltr" \| "rtl"` | Text direction for the current locale |
| `Locale.switch("fi")` | `void` | Sets the locale cookie and navigates |
| `Locale.hreflang(url, site)` | `{ href, hreflang }[]` | Hreflang entries for all locales |
| `Locale.response(Astro)` | `Response \| null` | Redirect response if URL has no locale prefix |

## License

MIT © [Ere Männistö](https://github.com/eremannisto)
