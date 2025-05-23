# CollabX Frontend

This is the frontend package for the CollabX real-time collaborative editor.

## Local Development

### Prerequisites

- Node.js (v18 or higher)
- pnpm

### Setup

1. Install dependencies from the root of the monorepo:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
# From the root directory:
pnpm --filter @collabx/frontend dev

# Or directly from this directory:
pnpm dev
```

The application will be available at http://localhost:3000

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm test` - Run tests

See the root README for more information about the CollabX project.
