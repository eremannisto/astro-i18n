# Contributing

## Setup
```bash
# install dependencies and playwright browsers
pnpm install
pnpm playwright install chromium
```

## Development
```bash
# build the package
pnpm build

# lint
pnpm lint

# check (lint + formatting)
pnpm check

# format
pnpm format
```

## Testing
```bash
# run unit tests
pnpm test:unit

# run e2e tests
pnpm test:e2e

# run all tests
pnpm test
```

## Publishing
```bash
# bump version in package.json, then:
pnpm publish --access public
```

The `prepublishOnly` script runs `pnpm build` automatically before publishing.