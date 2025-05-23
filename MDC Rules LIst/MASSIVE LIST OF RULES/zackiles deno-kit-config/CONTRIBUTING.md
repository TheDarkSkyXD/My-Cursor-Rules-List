# Contributing to @deno-kit/config

Easily develop the library with a CLI, HTTP server, and WebSocket server that
dynamically exposes the methods of the library, in addition to whatever tests
you wish to write.

- 🔹 **CLI:** Automatically generates stdio command handlers for each function
  your library exposes.
- 🌐 **HTTP Server:** Automatically generates HTTP endpoints for each function
  your library exposes.
- ⚡ **WebSocket Server:** Automatically generates JSON-RPC handlers for each
  function your library exposes.

## CLI Interface

```bash
# Show help
deno task kit cli --help

# Execute a CLI method named "read" that calls your library methods:
deno task kit cli read --id=123
```

### HTTP API

```bash
# Start the HTTP server
deno task kit server

# After starting the server, make requests to the methods of your library (Curl, Fetch etc):
GET {DENO_KIT_HOST}:{DENO_KIT_PORT}/lib/read?id=123
POST {DENO_KIT_HOST}:{DENO_KIT_PORT}/lib/create
  {"name": "New Item", "value": 456}
```

## WebSocket API

```javascript
// After starting the server, make WebSocket requests to the methods of your library:

const ws = new WebSocket(`ws://${DENO_KIT_HOST}:${DENO_KIT_PORT}/lib/read`)
ws.onopen = () => {
  ws.send(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'read',
    params: { id: 123 },
  }))
}
```

## Extending

To extend this starter kit:

1. Add new methods to the `Lib` class in `src/lib.ts`
2. If you created any types for your users export them in `src/mod.ts`
3. Write any tests in `test/`

## Environment Variables

This library supports various environment variables. You can copy the `.env.example` file to `.env` and customize them as needed.

### General Configuration

- `DENO_ENV` - Environment mode (development, production). You can use
  NODE_ENVas well if you want.

### Library Configuration

- `DENO_KIT_PORT` - Port for the HTTP/WebSocket server (default: 8000)
- `DENO_KIT_HOST` - Host for the HTTP/WebSocket server (default: localhost)
- `LIB_LOG_NAME` - Name for the logger output
- `LIB_LOG_LEVEL` - Logging level (debug, verbose, info, warn, error)
- `LIB_LOG_TAGS` - Comma-separated list of tags to include in logs

### OpenTelemetry Configuration

#### Core Settings

- `OTEL_DENO` - Enable OpenTelemetry for Deno (true/false)
- `OTEL_SERVICE_NAME` - Name of the service for telemetry
- `OTEL_SERVICE_NAMESPACE` - Namespace for the service
- `OTEL_SERVICE_VERSION` - Version of the service
- `OTEL_RESOURCE_ATTRIBUTES` - Additional resource attributes

#### Exporter Configuration

- `OTEL_EXPORTER_TYPE` - Type of exporter (console, otlp)
- `OTEL_EXPORTER_ENDPOINT` - Endpoint for the exporter
- `OTEL_EXPORTER_PROTOCOL` - Protocol for the exporter
- `OTEL_EXPORTER_TIMEOUT_MILLIS` - Timeout for the exporter in milliseconds

#### Data Collection Settings

- `OTEL_TRACE_ENABLED` - Enable trace collection
- `OTEL_METRICS_ENABLED` - Enable metrics collection
- `OTEL_LOGS_ENABLED` - Enable logs collection

#### Sampling and Performance

- `OTEL_SAMPLING_RATE` - Sampling rate for traces (0.0-1.0)
- `OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT` - Maximum number of attributes per span
- `OTEL_SPAN_EVENT_COUNT_LIMIT` - Maximum number of events per span
- `OTEL_SPAN_LINK_COUNT_LIMIT` - Maximum number of links per span
- `OTEL_TRACES_SAMPLER` - Sampling strategy
