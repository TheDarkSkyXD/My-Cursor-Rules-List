# **@deno-kit/config**

[![JSR Score](https://jsr.io/badges/@deno-kit/config/score)](https://jsr.io/@deno-kit/config)
[![JSR](https://jsr.io/badges/@deno-kit/1.%20Clone%20this%20repository)](https://jsr.io/@deno-kit/config)
[![JSR Scope](https://jsr.io/badges/@deno-kit})](https://jsr.io/@deno-kit})
[![ci](https://github.com/zackiles/deno-kit-config/actions/workflows/ci.yml/badge.svg)](https://github.com/zackiles/deno-kit-config/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/zackiles/deno-kit-config/blob/main/LICENSE)

Combine dot-env, `Deno.env`, and general overrides into a simple unified global config module for your application.

> [!NOTE]
> This is a **new** project and the documentation is unlikely to be comprehensive or accurate.

## Features

- 🦖 **Modern Deno Features:** Built with the latest Deno runtime features
- 🔄 **Global Singleton:** Configure once, access anywhere - all modules get the same configuration instance
- 🔒 **Type-Safe:** Returns a strongly-typed proxy object for safe access to config values
- 🔁 **Auto-Sync:** Automatically keeps `Deno.env` variables in sync with config changes
- ⚙️ **Flexible Configuration:** Merges multiple sources in order of precedence:
  1. Runtime overrides
  2. Custom env file (via `--config` flag)
  3. Local `.env` file
  4. `Deno.env` variables
  5. Default values
- 📝 **Customizable Logging:** Bring your own logger for better integration
- 📦 **Dynamic Values:** Support for async functions and promises as default values

## Installation

```bash
deno add jsr:@deno-kit/config
```

## Usage

### Basic Usage

```typescript
import { loadConfig } from '@deno-kit/config'

// Initialize global config (do this once at app startup)
const config = await loadConfig()

// Access values like properties
console.log(config.DENO_ENV) // "development" by default
console.log(config.DATABASE_URL) // Value from .env or Deno.env
```

### With Environment Files

Create a `.env` file in your project root:

```env
DATABASE_URL=postgres://localhost:5432/mydb
API_KEY=secret123
```

The values will be automatically loaded when calling `loadConfig()`. You can also specify a custom env file:

```bash
deno run -A --config=prod.env script.ts
```

### With Runtime Overrides

```typescript
// Values passed to loadConfig() take highest precedence
const config = await loadConfig({
  API_KEY: 'override-key',
  DATABASE_URL: 'postgres://prod-host/db',
})

// These values are now available to all modules
console.log(config.API_KEY) // "override-key"
console.log(Deno.env.get('API_KEY')) // Also "override-key" - stays in sync!
```

### Singleton Pattern Benefits

The config object is a global singleton, meaning:

1. Configure once at app startup, use anywhere
2. All modules get the same configuration instance
3. Changes are reflected everywhere immediately
4. `Deno.env` stays in sync automatically

```typescript
// module1.ts
import { loadConfig } from '@deno-kit/config'

const config = await loadConfig({ INITIAL: 'value' })
export function doSomething() {
  console.log(config.INITIAL) // "value"
}

// module2.ts
import { loadConfig } from '@deno-kit/config'

const config = await loadConfig() // Returns same instance
config.INITIAL = 'new-value' // Updates everywhere

// Both the config object and Deno.env are updated
console.log(config.INITIAL) // "new-value"
console.log(Deno.env.get('INITIAL')) // "new-value"
```

### Custom Logger Integration

```typescript
import { log } from '@std/log'

const config = await loadConfig(null, log)
// Now uses your logger for all config-related logs
```

## Development

```bash
# Run tests
deno task tests

# Format / lint / type-check code
deno task pre-publish
```

For details on the release process and CI/CD workflows, see the [RELEASING.md](RELEASING.md) document.

## **Changelog**

See the [`CHANGELOG`](CHANGELOG.md) for details.

## **Contributing**

See the [`CONTRIBUTING`](CONTRIBUTING.md) for details.

## **License**

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT) — see the [`LICENSE`](LICENSE) for details.
