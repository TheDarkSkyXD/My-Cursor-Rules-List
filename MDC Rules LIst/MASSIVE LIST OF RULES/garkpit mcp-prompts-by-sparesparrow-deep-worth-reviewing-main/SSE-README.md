# MCP Prompts SSE Implementation

This document describes the Server-Sent Events (SSE) implementation for the MCP Prompts project.

## Overview

The SSE implementation consists of the following components:

1. **SSE Server**: A standalone server that provides SSE endpoints for real-time communication.
2. **MCP Inspector SSE Client**: A bridge that connects to the SSE server and forwards events to the MCP Inspector.
3. **Test Client**: A simple client for testing the SSE connection.

## Components

### SSE Server (`mcp-inspector-sse-patch.js`)

This server provides the SSE endpoint at `/events` and a health check endpoint at `/health`. It sends heartbeat messages every 10 seconds to keep the connection alive.

Features:
- SSE endpoint at `/events`
- Health check endpoint at `/health`
- CORS support
- Heartbeat messages
- Connection tracking

### MCP Inspector SSE Client (`mcp-inspector-sse-client.js`)

This client connects to the SSE server and forwards events to the MCP Inspector via WebSockets. It acts as a bridge between the SSE server and the MCP Inspector.

Features:
- Connects to the SSE server
- Provides a WebSocket server for the MCP Inspector
- Forwards SSE events to WebSocket clients
- Health check endpoint
- Automatic reconnection

### Test Client (`simple-sse-test.js`)

A simple client for testing the SSE connection. It connects to the SSE server and logs received events.

## Setup and Usage

### Prerequisites

- Node.js 16 or higher
- npm or yarn

### Installation

1. Install the required dependencies:

```bash
npm install express cors eventsource ws
```

### Running the SSE Server

```bash
node mcp-inspector-sse-patch.js
```

The server will start on port 3004 by default. You can change the port by setting the `PORT` environment variable.

### Running the MCP Inspector SSE Client

```bash
node mcp-inspector-sse-client.js
```

The client will start on port 3005 by default. You can change the port by setting the `INSPECTOR_PORT` environment variable.

### Testing the SSE Connection

```bash
node simple-sse-test.js
```

This will connect to the SSE server and log received events.

## Environment Variables

- `PORT`: The port for the SSE server (default: 3004)
- `INSPECTOR_PORT`: The port for the MCP Inspector SSE client (default: 3005)
- `SSE_SERVER_URL`: The URL of the SSE server (default: http://localhost:3004/events)

## Docker Integration

To integrate with Docker, add the following to your Docker Compose file:

```yaml
services:
  mcp-prompts-sse:
    image: mcp-prompts:latest
    environment:
      - ENABLE_SSE=true
      - SSE_PATH=/events
    ports:
      - "3004:3004"
    volumes:
      - ./mcp-inspector-sse-patch.js:/app/mcp-inspector-sse-patch.js
    command: ["node", "/app/mcp-inspector-sse-patch.js"]
```

## Troubleshooting

### Connection Issues

If you're experiencing connection issues, check the following:

1. Ensure the SSE server is running and accessible
2. Check the health endpoint to verify the server status
3. Verify that CORS is properly configured
4. Check for any errors in the server logs

### Server Disconnected Error

If you see a "Server disconnected" error, it could be due to:

1. The server is not running
2. The connection timed out
3. The server closed the connection
4. Network issues

Try restarting the server and checking the logs for any errors.

## API Reference

### SSE Server

- `GET /events`: SSE endpoint for real-time events
- `GET /health`: Health check endpoint

### MCP Inspector SSE Client

- `ws://localhost:3005`: WebSocket endpoint for the MCP Inspector
- `GET /health`: Health check endpoint 