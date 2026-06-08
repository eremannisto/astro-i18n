# Contributing

## Setup

```bash
pnpm install                 # Install dependencies and 
pnpm exec playwright install # Install playwright browsers
```

## Development

```bash
pnpm build  # Build the package
pnpm lint   # Lint code
pnpm check  # Check code
pnpm format # Format code
```

## Testing

```bash
pnpm test:unit # Run unit tests
pnpm test:e2e  # Run e2e tests
pnpm test      # Run all tests
```

## Publishing

```bash
# Switch to main and make sure it's up to date
git checkout main
git fetch origin
git pull origin main

# Run all tests
pnpm test

# Bump version number and create 
# and push a version tag
git tag v1.x.x
git push origin v1.x.x

# Publish to npm
pnpm publish --access public
```

The `prepublishOnly` script runs `pnpm build` automatically before publishing.