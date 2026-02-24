# @mannisto/astro-i18n

A flexible alternative to Astro's built-in i18n, with locale routing,
detection, and translations for static and SSR sites.

## Features

- Three detection modes: `server`, `client`, and `none`
- Automatic locale prefixing via middleware
- Optional static translation files with key validation
- Works with Astro's static and SSR output modes

## Installation
```bash
pnpm add @mannisto/astro-i18n
```

## Setup

Add the integration to your `astro.config.ts`:
```typescript
import { defineConfig } from "astro/config"
import i18n from "@mannisto/astro-i18n"

export default defineConfig({
  integrations: [
    i18n({
      locales: [
        { code: "en", name: "English", endonym: "English" },
        { code: "fi", name: "Finnish", endonym: "Suomi", phrase: "Suomeksi" },
      ],
      routing: {
        fallback: "en",
        detection: "server",
        autoPrefix: {
          ignore: ["/keystatic"],
        },
      },
    }),
  ],
})
```

## Translations

Translations are optional. To enable them, add a `translations` path to
your config pointing to a directory with a JSON file for each locale:
```
src/translations/
  en.json
  fi.json
```
```typescript
i18n({
  locales: [...],
  translations: "./src/translations",
})
```

Each file should contain a flat object of key-value pairs:
```json
{
  "nav.home": "Home",
  "nav.about": "About",
  "footer.copyright": "All rights reserved"
}
```

All locales must have the same keys as the fallback locale or the
integration will throw an error at startup. If translations are not
configured, `Locale.t()` will log a warning when called.

## Usage

Import `Locale` from the runtime subpath in your pages and components:
```astro
---
import { Locale } from "@mannisto/astro-i18n/runtime"

export const getStaticPaths = () =>
  Locale.supported.map((code) => ({ params: { locale: code } }))

const { locale } = Astro.params
const t = Locale.t(locale) as Record<string, string>
---
<html lang={locale}>
  <body>
    <h1>{t["nav.home"]}</h1>
  </body>
</html>
```

## API

### `Locale.supported`

Returns all supported locale codes.
```typescript
Locale.supported // ["en", "fi"]
```

### `Locale.fallback`

Returns the fallback locale code.
```typescript
Locale.fallback // "en"
```

### `Locale.current(locale)`

Returns the current locale from `Astro.params`.
```typescript
const locale = Locale.current(Astro.params.locale)
```

### `Locale.get(code?)`

Returns the config for all locales, or a single locale by code.
```typescript
Locale.get()      // all locales
Locale.get("fi")  // { code: "fi", name: "Finnish", endonym: "Suomi", ... }
```

### `Locale.t(locale, key?)`

Returns translations for a locale. Without a key returns the full
translation object. With a key returns the translated string.

Requires `translations` to be configured in your i18n config. Logs a
warning if called without translations configured.
```typescript
Locale.t(locale)             // { "nav.home": "Home", ... }
Locale.t(locale, "nav.home") // "Home"
```

### `Locale.middleware`

Middleware that redirects requests without a locale prefix to the correct
locale based on the user's cookie. Auto-registered when detection is
`"server"` and `autoPrefix` is enabled.

Can also be used manually:
```typescript
import { sequence } from "astro/middleware"
import { Locale } from "@mannisto/astro-i18n/runtime"

export const onRequest = sequence(Locale.middleware, myMiddleware)
```

## Detection modes

### `server`

Reads the `Accept-Language` header on first visit, sets a cookie, and
redirects to the appropriate locale URL. Requires an adapter for
production builds.
```typescript
import { defineConfig } from "astro/config"
import node from "@astrojs/node"
import i18n from "@mannisto/astro-i18n"

export default defineConfig({
  adapter: node({ mode: "standalone" }),
  integrations: [
    i18n({
      locales: [
        { code: "en", name: "English", endonym: "English" },
        { code: "fi", name: "Finnish", endonym: "Suomi", phrase: "Suomeksi" },
      ],
      routing: {
        fallback: "en",
        detection: "server",
        autoPrefix: {
          ignore: ["/keystatic"],
        },
      },
    }),
  ],
})
```

### `client`

Serves a static HTML page at `/` with an inline JS redirect script that
reads `navigator.language` and stores the result in `localStorage`.
Works without an adapter.
```typescript
i18n({
  locales: [
    { code: "en", name: "English", endonym: "English" },
    { code: "fi", name: "Finnish", endonym: "Suomi", phrase: "Suomeksi" },
  ],
  routing: {
    fallback: "en",
    detection: "client",
  },
})
```

### `none`

No detection. Users must navigate to a locale URL directly, e.g. `/en/`.
```typescript
i18n({
  locales: [
    { code: "en", name: "English", endonym: "English" },
    { code: "fi", name: "Finnish", endonym: "Suomi", phrase: "Suomeksi" },
  ],
  routing: {
    fallback: "en",
    detection: "none",
  },
})
```

## Configuration reference
```typescript
i18n({
  // required — list of supported locales
  locales: [
    {
      code: "en",         // locale code used in URLs
      name: "English",    // locale name in English
      endonym: "English", // locale name in its own language
      phrase: "In English", // optional, for locale switchers
    },
  ],

  routing: {
    // locale to use when no match is found
    // defaults to the first locale in the array
    fallback: "en",

    // how the user's locale is detected on first visit
    // "server" | "client" | "none" — defaults to "client"
    detection: "server",

    // middleware that prefixes unknown routes with the user's locale
    // only valid when detection is "server"
    // set to false to disable, or pass an object to configure ignore paths
    autoPrefix: {
      ignore: ["/keystatic", "/api"],
    },
  },

  // optional — path to translation files, relative to the project root
  // if not set, translations are disabled and Locale.t() will warn when called
  translations: "./src/translations",
})
```

# @mannisto/astro-i18n

A flexible alternative to Astro's built-in i18n, with locale routing,
detection, and translations for static and SSR sites.

## Features

- Three detection modes: `server`, `client`, and `none`
- Automatic locale prefixing via middleware
- Optional static translation files with key validation
- Works with Astro's static and SSR output modes

## Installation
```bash
pnpm add @mannisto/astro-i18n
```

## Setup

Add the integration to your `astro.config.ts`:
```typescript
import { defineConfig } from "astro/config"
import i18n from "@mannisto/astro-i18n"

export default defineConfig({
  integrations: [
    i18n({
      locales: [
        { code: "en", name: "English", endonym: "English" },
        { code: "fi", name: "Finnish", endonym: "Suomi", phrase: "Suomeksi" },
      ],
      routing: {
        fallback: "en",
        detection: "server",
        autoPrefix: {
          ignore: ["/keystatic"],
        },
      },
    }),
  ],
})
```

## Translations

Translations are optional. To enable them, add a `translations` path to
your config pointing to a directory with a JSON file for each locale:
```
src/translations/
  en.json
  fi.json
```
```typescript
i18n({
  locales: [...],
  translations: "./src/translations",
})
```

Each file should contain a flat object of key-value pairs:
```json
{
  "nav.home": "Home",
  "nav.about": "About",
  "footer.copyright": "All rights reserved"
}
```

All locales must have the same keys as the fallback locale or the
integration will throw an error at startup. If translations are not
configured, `Locale.t()` will log a warning when called.

## Usage

Import `Locale` from the runtime subpath in your pages and components:
```astro
---
import { Locale } from "@mannisto/astro-i18n/runtime"

export const getStaticPaths = () =>
  Locale.supported.map((code) => ({ params: { locale: code } }))

const { locale } = Astro.params
const t = Locale.t(locale) as Record<string, string>
---
<html lang={locale}>
  <body>
    <h1>{t["nav.home"]}</h1>
  </body>
</html>
```

## API

### `Locale.supported`

Returns all supported locale codes.
```typescript
Locale.supported // ["en", "fi"]
```

### `Locale.fallback`

Returns the fallback locale code.
```typescript
Locale.fallback // "en"
```

### `Locale.current(locale)`

Returns the current locale from `Astro.params`.
```typescript
const locale = Locale.current(Astro.params.locale)
```

### `Locale.get(code?)`

Returns the config for all locales, or a single locale by code.
```typescript
Locale.get()      // all locales
Locale.get("fi")  // { code: "fi", name: "Finnish", endonym: "Suomi", ... }
```

### `Locale.t(locale, key?)`

Returns translations for a locale. Without a key returns the full
translation object. With a key returns the translated string.

Requires `translations` to be configured in your i18n config. Logs a
warning if called without translations configured.
```typescript
Locale.t(locale)             // { "nav.home": "Home", ... }
Locale.t(locale, "nav.home") // "Home"
```

### `Locale.middleware`

Middleware that redirects requests without a locale prefix to the correct
locale based on the user's cookie. Auto-registered when detection is
`"server"` and `autoPrefix` is enabled.

Can also be used manually:
```typescript
import { sequence } from "astro/middleware"
import { Locale } from "@mannisto/astro-i18n/runtime"

export const onRequest = sequence(Locale.middleware, myMiddleware)
```

## Detection modes

### `server`

Reads the `Accept-Language` header on first visit, sets a cookie, and
redirects to the appropriate locale URL. Requires an adapter for
production builds.
```typescript
import { defineConfig } from "astro/config"
import node from "@astrojs/node"
import i18n from "@mannisto/astro-i18n"

export default defineConfig({
  adapter: node({ mode: "standalone" }),
  integrations: [
    i18n({
      locales: [
        { code: "en", name: "English", endonym: "English" },
        { code: "fi", name: "Finnish", endonym: "Suomi", phrase: "Suomeksi" },
      ],
      routing: {
        fallback: "en",
        detection: "server",
        autoPrefix: {
          ignore: ["/keystatic"],
        },
      },
    }),
  ],
})
```

### `client`

Serves a static HTML page at `/` with an inline JS redirect script that
reads `navigator.language` and stores the result in `localStorage`.
Works without an adapter.
```typescript
i18n({
  locales: [
    { code: "en", name: "English", endonym: "English" },
    { code: "fi", name: "Finnish", endonym: "Suomi", phrase: "Suomeksi" },
  ],
  routing: {
    fallback: "en",
    detection: "client",
  },
})
```

### `none`

No detection. Users must navigate to a locale URL directly, e.g. `/en/`.
```typescript
i18n({
  locales: [
    { code: "en", name: "English", endonym: "English" },
    { code: "fi", name: "Finnish", endonym: "Suomi", phrase: "Suomeksi" },
  ],
  routing: {
    fallback: "en",
    detection: "none",
  },
})
```

## Configuration reference
```typescript
i18n({
  // required — list of supported locales
  locales: [
    {
      code: "en",         // locale code used in URLs
      name: "English",    // locale name in English
      endonym: "English", // locale name in its own language
      phrase: "In English", // optional, for locale switchers
    },
  ],

  routing: {
    // locale to use when no match is found
    // defaults to the first locale in the array
    fallback: "en",

    // how the user's locale is detected on first visit
    // "server" | "client" | "none" — defaults to "client"
    detection: "server",

    // middleware that prefixes unknown routes with the user's locale
    // only valid when detection is "server"
    // set to false to disable, or pass an object to configure ignore paths
    autoPrefix: {
      ignore: ["/keystatic", "/api"],
    },
  },

  // optional — path to translation files, relative to the project root
  // if not set, translations are disabled and Locale.t() will warn when called
  translations: "./src/translations",
})
```

## Development
```bash
# install dependencies and playwright browsers
pnpm install
pnpm playwright install chromium

# run unit tests
pnpm test:unit

# run e2e tests
pnpm test:e2e

# run all tests
pnpm test
```

## License

MIT © [Ere Männistö](https://github.com/eremannisto)