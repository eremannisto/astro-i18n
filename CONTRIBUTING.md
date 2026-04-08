# Contributing

## Setup

```bash
# install dependencies and playwright browsers
pnpm install
pnpm exec playwright install
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
# Switch to main and make sure it's up to date
git checkout main
git fetch origin
git pull origin main

# Bump version in package.json, then run all tests
pnpm test

# Create and push a version tag
git tag v1.x.x
git push origin v1.x.x

# Publish to npm
pnpm publish --access public
```

The `prepublishOnly` script runs `pnpm build` automatically before publishing.