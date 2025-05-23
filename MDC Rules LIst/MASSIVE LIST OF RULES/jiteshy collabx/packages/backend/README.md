# CollabX Backend

This is the backend package for the CollabX real-time collaborative editor.

## Local Development

### Prerequisites

- Node.js (v18 or higher)
- pnpm
- Redis server running locally

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
pnpm --filter @collabx/backend dev

# Or directly from this directory:
pnpm dev
```

The server will be available at http://localhost:3001

### Available Scripts

- `pnpm dev` - Start in development mode
- `pnpm build` - Build the application
- `pnpm build:ncc` - Build production bundle with ncc
- `pnpm start` - Start the server in production mode
- `pnpm test` - Run unit tests

See the root README for more information about the CollabX project. 