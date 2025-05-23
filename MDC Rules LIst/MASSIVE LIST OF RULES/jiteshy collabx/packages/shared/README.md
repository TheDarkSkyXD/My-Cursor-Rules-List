# CollabX Shared

This is the shared package for the CollabX real-time collaborative editor, containing common types, interfaces, and utilities used across the frontend and backend.

## Local Development

### Prerequisites

- Node.js (v18 or higher)
- pnpm

### Setup

1. Install dependencies from the root of the monorepo:
```bash
pnpm install
```

2. Build the package:
```bash
# From the root directory:
pnpm --filter @collabx/shared build

# Or directly from this directory:
pnpm build
```

### Using in Other Packages

The shared package is automatically linked to the other packages in the monorepo. When you make changes to the shared package, you need to rebuild it for the changes to be reflected in the other packages:

```bash
pnpm --filter @collabx/shared build
```

### Available Scripts

- `pnpm build` - Build the package
- `pnpm test` - Run tests

See the root README for more information about the CollabX project. 