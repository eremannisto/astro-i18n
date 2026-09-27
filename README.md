# Astro Internationalization

![banner](./docs/banner.png)

![Astro](https://img.shields.io/badge/astro-%232C2052.svg?style=for-the-badge&logo=astro&logoColor=white)
![npm version](https://img.shields.io/npm/v/@mannisto/astro-i18n?style=for-the-badge)
![license](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

A flexible alternative to Astro's built-in internationalization, with locale routing, detection, and translations for static and SSR sites.

## Installation

```bash
npm install @mannisto/astro-i18n
```

```bash
pnpm add @mannisto/astro-i18n
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
      locales: [
        {
          code: "en",           // Used in URLs: /en/about
          name: "English",      // Display name in English (optional)
          endonym: "English",   // Display name in its own language (optional)
          phrase: "In English", // For locale switchers (optional)
          direction: "ltr",     // Defaults to "ltr" (optional)
        },
        {
          code: "fi",
          name: "Finnish",
          endonym: "Suomi",
          phrase: "Suomeksi",
        },
      ],

      // Defaults to the first locale in the list
      defaultLocale: "en",

      // true: /en/about. false: /about. Defaults to true.
      prefixDefaultLocale: true,

      // Path to translation JSON files. Omit to disable translations.
      translations: "./src/translations",

      // URL paths that bypass the middleware. Requires a server adapter.
      // Glob patterns supported.
      ignore: ["/keystatic", "/api/uploads/**/*.png"],
    }),
  ],
})
```

## File structure

Put the locale pages in a `[locale]` folder. Pages outside this folder, for example `privacy.astro`, do not get a locale prefix.

```
src/
├── pages/
│   ├── [locale]/
│   │   ├── index.astro
│   │   └── about.astro
│   ├── 404.astro
│   └── privacy.astro
└── translations/
    ├── en.json
    └── fi.json
```

`src/pages/index.astro` is optional:

- With `prefixDefaultLocale: true`, the file replaces the locale detection at `/`. Use it for a custom root page, for example a language selector.
- With `prefixDefaultLocale: false`, the root URL belongs to the default locale home page. The integration stops with an error if this file exists.

## URLs

The `prefixDefaultLocale` option sets the URLs of the default locale. The other locales always have a prefix.

| Request      | `prefixDefaultLocale: true`              | `prefixDefaultLocale: false` |
|--------------|------------------------------------------|------------------------------|
| `/`          | Redirect to `/en/` or to the cookie locale | English home page          |
| `/about`     | Redirect to `/en/about` or to the cookie locale | English about page      |
| `/en/about`  | English about page                       | 404                          |
| `/fi/about`  | Finnish about page                       | Finnish about page           |
| `/privacy`   | Page outside `[locale]`                  | Page outside `[locale]`      |
| `/de/about`  | Redirect to `/en/de/about`, then 404     | 404                          |

This table applies to all rendering modes, in dev and in the build.

## Rendering modes

Your Astro `output` and `adapter` choice map to three rendering modes:

| Mode     | Output             | Adapter | Behaviour     |
|----------|--------------------|:-------:|---------------|
| `Static` | `output: "static"` | No      | Fully static  |
| `Hybrid` | `output: "static"` | Yes     | Mostly static |
| `Server` | `output: "server"` | N/A     | Fully server  |

The integration makes the URLs in the table above in this way:

- **With an adapter** (Hybrid and Server): A middleware does the redirects and the rewrites. The integration also adds a catch-all route, so the middleware runs for all paths.
- **Static, `prefixDefaultLocale: false`**: After the build, the integration moves the `dist/en/` files to the root of `dist`. In dev, a middleware does the same work.
- **Static, `prefixDefaultLocale: true`**: A static host cannot redirect. The `/` page and the 404 page redirect in the browser.

> ⚠ With `prefixDefaultLocale: false`, a default locale page renders at its `/[locale]` path. So `Astro.url.pathname` is `/en/about`, not `/about`. Use `Locale.url()` to make links and canonical URLs. The build stops with an error if two pages have the same URL, for example `src/pages/about.astro` and `src/pages/[locale]/about.astro`.

## Locale pages

How you write locale pages depends on your rendering mode.

### Static & Hybrid

Use `getStaticPaths` to generate a page for each locale at build time.

```astro
---
// src/pages/[locale]/index.astro
import { Locale } from "@mannisto/astro-i18n/runtime"

export const getStaticPaths = () => {
  return Locale.supported.map((code) => {
    return {
      params: {
        locale: code,
      },
    }
  })
}

const { code, t } = Locale.use(Astro)
---

<html lang={code}>
  <body>
    <h1>{t("nav.home")}</h1>
  </body>
</html>
```

### Server

Skip `getStaticPaths` and mark pages as not prerendered.

```astro
---
// src/pages/[locale]/index.astro
export const prerender = false

import { Locale } from "@mannisto/astro-i18n/runtime"

const { code, t } = Locale.use(Astro)
---

<html lang={code}>
  <body>
    <h1>{t("nav.home")}</h1>
  </body>
</html>
```

## The 404 page

Put one `404.astro` in the root of `src/pages`. All locales use this page. It can be prerendered or render on demand.

```astro
---
// src/pages/404.astro
import { LocaleRedirect } from "@mannisto/astro-i18n/components"
import { Locale } from "@mannisto/astro-i18n/runtime"

const { code } = Locale.use(Astro)
---

<html lang={code}>
  <head>
    <LocaleRedirect />
    <title>404</title>
  </head>
  <body>
    <h1>404</h1>
  </body>
</html>
```

`<LocaleRedirect>` is necessary only for `Static` mode with `prefixDefaultLocale: true`. There, the browser must redirect `/about` to `/en/about`. In all other setups, the component does nothing.

## Layout

Each locale page needs `<LocaleCookie>` in the `<head>` to persist the current locale to a cookie. A shared layout is a convenient place for it, but it can be added to each page directly as well.

`<LocaleHreflang>` renders `<link rel="alternate">` tags for all supported locales. Optional but recommended for SEO.

```astro
---
// src/layouts/Layout.astro
import { Locale } from "@mannisto/astro-i18n/runtime"
import { LocaleCookie, LocaleHreflang } from "@mannisto/astro-i18n/components"

const { code } = Locale.use(Astro)
const site = Astro.site ?? Astro.url.origin
---

<html lang={code}>
  <head>
    <meta charset="UTF-8" />
    <LocaleCookie locale={code} />
    <LocaleHreflang url={Astro.url} site={site} />
  </head>
  <body>
    <slot />
  </body>
</html>
```

## Translations

Create one JSON file per locale in the configured `translations` directory. Keys must be flat strings — no nesting.

```json
{
  "nav.home": "Home",
  "nav.about": "About",
  "footer.copyright": "All rights reserved"
}
```

Use `t` from `Locale.use(Astro)` to look up a key for the current locale.

- **Key missing in a locale:** The integration shows a warning at startup, and `t` returns the default locale text.
- **Key missing in the default locale:** `t` throws an error.

```astro
---
import { Locale } from "@mannisto/astro-i18n/runtime"

const { t } = Locale.use(Astro)
---

<h1>{t("nav.home")}</h1>
```

For non-Astro components such as React or Vue, destructure `t` from `Locale.use(Astro)` in the parent page and pass it as a prop.

## Language switcher

No switcher component is included, but `Locale.get()` and `Locale.switch()` give you everything needed to build one.

```astro
---
import { Locale } from "@mannisto/astro-i18n/runtime"

const locales = Locale.get()
---

{locales.map((locale) => (
  <button data-locale={locale.code}>
    {locale.phrase ?? locale.endonym ?? locale.code}
  </button>
))}

<script>
  import { Locale } from "@mannisto/astro-i18n/runtime"

  document.querySelectorAll("button[data-locale]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const code = btn.getAttribute("data-locale")
      if (code) Locale.switch(code)
    })
  })
</script>
```

## Advanced

### Middleware composition

The integration middleware runs before your own middleware. It runs when a server adapter is configured, or when `prefixDefaultLocale` is `false`. Any middleware you define in `src/middleware.ts` runs after it with no additional setup.

### Sitemap

With `prefixDefaultLocale: false`, `@astrojs/sitemap` lists the default locale pages with their `/en/` paths. Use the `serialize` option of the sitemap to remove the prefix.

```typescript
sitemap({
  serialize(item) {
    item.url = item.url.replace("/en/", "/")
    return item
  },
})
```

### Ignoring paths

Paths can be excluded from middleware processing with the `ignore` option. Plain paths match the path and all sub-paths. Glob patterns are also supported.

```typescript
i18n({
  ignore: ["/keystatic", "/api/uploads/**/*.png"],
})
```

## Components

### `LocaleCookie`

Writes the current locale to a cookie on page load. Place in `<head>` on every locale page through your layout.

```astro
import { LocaleCookie } from "@mannisto/astro-i18n/components"

<LocaleCookie locale={code} />
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `locale` | `string` | — | Current locale code |
| `age` | `number` | `31536000` | Cookie max-age in seconds (1 year) |

### `LocaleHreflang`

Renders `<link rel="alternate">` hreflang tags for all supported locales plus `x-default`. Place in `<head>` through your layout.

```astro
import { LocaleHreflang } from "@mannisto/astro-i18n/components"

<LocaleHreflang url={Astro.url} site={Astro.site ?? Astro.url.origin} />
```

| Prop | Type | Description |
|---|---|---|
| `url` | `URL` | Current page URL |
| `site` | `URL \| string` | Base site URL |

### `LocaleRedirect`

A client-side script that reads the locale cookie and redirects the browser to the correct locale-prefixed path. It is necessary in `404.astro` in `Static` mode with `prefixDefaultLocale: true`. In all other setups, it does nothing.

```astro
import { LocaleRedirect } from "@mannisto/astro-i18n/components"

<LocaleRedirect />
```

## API reference

### `Locale.use(Astro)`

The primary way to access locale data in a page or layout. Returns a request-scoped instance — all members are safe to destructure.

```astro
const { code, name, endonym, phrase, direction, t } = Locale.use(Astro)
```

| Member | Type | Description |
|---|---|---|
| `code` | `string` | Current locale code derived from the URL |
| `name` | `string \| undefined` | Display name in English |
| `endonym` | `string \| undefined` | Display name in its own language |
| `phrase` | `string \| undefined` | Short phrase for locale switchers |
| `direction` | `"ltr" \| "rtl"` | Text direction, defaults to `"ltr"` |
| `t(key)` | `string` | Looks up a translation key for the current locale |

### Other methods

| Method | Returns | Description |
|---|---|---|
| `Locale.supported` | `string[]` | All configured locale codes |
| `Locale.defaultLocale` | `string` | The configured default locale code |
| `Locale.get()` | `LocaleConfig[]` | All locale configs |
| `Locale.get("fi")` | `LocaleConfig` | Config for a specific locale |
| `Locale.fromURL(url)` | `string` | Derives the locale code from a URL |
| `Locale.url("fi", "/about")` | `string` | Builds the URL path of a page in a locale. Follows `prefixDefaultLocale` |
| `Locale.switch("fi")` | `void` | Sets the locale cookie and navigates (browser only) |
| `Locale.hreflang(url, site)` | `{ href, hreflang }[]` | Hreflang entries for all locales plus `x-default` |

---

## Migrating from v2

### Remove `response()` from the 404 page

The middleware now does the redirects in all modes with an adapter. The 404 page does not need `response()` or `prerender = false`.

```diff
---
- export const prerender = false
-
import { Locale } from "@mannisto/astro-i18n/runtime"

- const { code, response } = Locale.use(Astro)
- const redirect = response()
- if (redirect) return redirect
+ const { code } = Locale.use(Astro)
---
```

### Update Astro

The integration requires Astro 6 or 7. Astro 5 is not supported.

### Optional: remove the default locale prefix

Set `prefixDefaultLocale: false` to serve the default locale without a prefix, for example `/about` in place of `/en/about`. The `/en/` URLs then give a 404. See [URLs](#urls).

## License

MIT © [Ere Männistö](https://github.com/eremannisto)
