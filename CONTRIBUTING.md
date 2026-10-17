# Contributing

## Setup

```bash
pnpm install                 # Install dependencies
pnpm exec playwright install # Install playwright browsers
```

## Development

```bash
pnpm build  # Build the package
pnpm lint   # Lint code
pnpm check  # Check code and types
pnpm format # Format code
```

## Testing

```bash
pnpm test:unit # Run unit tests
pnpm test:e2e  # Run e2e tests
pnpm test      # Run all tests
```

The e2e tests use the fixtures in `tests/e2e/fixtures`:

| Folder | Content |
|---|---|
| `static/`, `server/`, `hybrid/` | One site for each rendering mode, with a `prefixed` and an `unprefixed` version |
| `base/` | Sites with the Astro `base` option set to `/docs` |
| `translations/` | The translation files that all sites use |
| `validation/` | One site for each startup error or warning |

Each site runs twice: with `astro dev` and with a production build. `pnpm test:e2e` builds the sites first. To run Playwright directly, run `pnpm build` and `pnpm test:fixtures` first. `unprefixed.test.ts`, `prefixed.test.ts` and the two `base-*.test.ts` files test the sites. `validation.test.ts` tests the validation sites.

## Publishing

```bash
# Switch to main and make sure it's up to date
git checkout main
git fetch origin
git pull origin main

# Run all tests
pnpm test

# Bump the version number, then create and push a version tag
git tag vX.Y.Z
git push origin vX.Y.Z

# Publish to npm
pnpm publish --access public
```

The `prepublishOnly` script runs `pnpm build` automatically before publishing.
