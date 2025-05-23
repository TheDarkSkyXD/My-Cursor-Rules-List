# MCP Prompts Server

An MCP server for managing prompts and templates with project orchestration capabilities. Part of the Model Context Protocol ecosystem.

<a href="https://glama.ai/mcp/servers/i0z4f3pr82">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/i0z4f3pr82/badge" alt="Prompts Server MCP server" />
</a>

This server provides a simple way to store, retrieve, and apply templates for AI prompts, making it easier to maintain consistent prompting patterns across your AI applications.

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
  - [Using with Claude](#using-with-claude)
  - [Available Tools](#available-tools)
  - [API Usage Examples](#api-usage-examples)
  - [Managing Prompts](#managing-prompts)
  - [Using Prompts in Your Workflow](#using-prompts-in-your-workflow)
- [Prompt Format](#prompt-format)
- [Multi-Format Prompt Support](#multi-format-prompt-support)
  - [Converting Between Formats](#converting-between-formats)
  - [Applying Templates](#applying-templates)
  - [Extracting Variables](#extracting-variables)
  - [Creating from Different Formats](#creating-from-different-formats)
  - [Integration with Storage Adapters](#integration-with-storage-adapters)
- [Storage Adapters](#storage-adapters)
  - [PostgreSQL Setup](#postgresql-setup)
- [Docker Deployment](#docker-deployment)
  - [Purpose-Driven Container Architecture](#purpose-driven-container-architecture)
  - [Docker Compose Orchestration](#docker-compose-orchestration)
    - [Base Deployment](#base-deployment)
    - [Development Environment](#development-environment)
    - [PostgreSQL Integration](#postgresql-integration)
    - [Testing Environment](#testing-environment)
    - [Multiple MCP Servers Integration](#multiple-mcp-servers-integration)
    - [Building and Publishing Docker Images](#building-and-publishing-docker-images)
- [Development](#development)
  - [Development Workflow](#development-workflow)
  - [Development Commands](#development-commands)
  - [Build Process](#build-process)
  - [Testing](#testing)
  - [Directory Structure](#directory-structure)
- [Release Process](#release-process)
- [Changelog](#changelog)
- [Best Practices](#best-practices)
- [License](#license)
- [Architecture](#architecture)
- [MCP Resources Integration](#mcp-resources-integration)
  - [The `resources/list` Method](#the-resourceslist-method)
  - [Using Resources in Prompts](#using-resources-in-prompts)
  - [Integration Pattern with Multiple MCP Servers](#integration-pattern-with-multiple-mcp-servers)
  - [Configuring Resource Integration](#configuring-resource-integration)
- [MCP Server Integration](#mcp-server-integration)
  - [Integration with Mermaid Diagram Server](#integration-with-mermaid-diagram-server)
  - [Integration with Orchestrator Server](#integration-with-orchestrator-server)
  - [Advanced Integration with MCP Router](#advanced-integration-with-mcp-router)
    - [Router Configuration](#router-configuration)
  - [Use Cases and Integration Examples](#use-cases-and-integration-examples)
    - [Project Documentation Generator](#1-project-documentation-generator)
    - [Prompt Visualization Dashboard](#2-prompt-visualization-dashboard)
    - [Template-Based Project Generator](#3-template-based-project-generator)
    - [Docker Compose for Full Integration](#docker-compose-for-full-integration)
- [Server-Sent Events (SSE) Support](#server-sent-events-sse-support)
  - [Running with SSE Support](#running-with-sse-support)
  - [Configuring Claude Desktop to Use SSE](#configuring-claude-desktop-to-use-sse)
  - [SSE API](#sse-api)

## Implementation Updates

The MCP Prompts Server has been refactored to use the new registration methods from MCP SDK version 1.6.1:

- **server.resource** for defining resource endpoints (e.g., for prompts and templates).
- **server.tool** for registering tool operations (e.g., add, get, update, list, delete, and apply_template).
- **server.prompt** for prompt-specific operations (e.g., "review-code").

These changes simplify the codebase, improve maintainability, and ensure better compatibility with the latest MCP SDK.

## Features

- Store and retrieve prompts
- Create and use templates with variables
- List prompts with filtering by tags
- Apply variables to templates
- Multiple storage backends (file system, PostgreSQL, and MDC format)
- Easy to use with Claude and other AI assistants
- Project orchestration capabilities
- Health check endpoints

## Installation

### Using npx (recommended)

```bash
npx -y @sparesparrow/mcp-prompts
```

### Global installation

```bash
npm install -g @sparesparrow/mcp-prompts
```

### Using Docker

```bash
docker run -p 3003:3003 -v ~/mcp/data:/app/data sparesparrow/mcp-prompts:latest
```

### Verifying Installation

After installation, you can verify that the server is working by:

1. Opening Claude Desktop
2. Typing "/" in the chat input to see if prompts from the server appear
3. Testing with a simple tool call:
   ```
   use_mcp_tool({
     server_name: "prompt-manager",
     tool_name: "list_prompts",
     arguments: {}
   });
   ```

## Configuration

The server can be configured using environment variables:

| Environment Variable | Description | Default |
|----------------------|-------------|---------|
| SERVER_NAME | Server name | MCP Prompts Server |
| SERVER_VERSION | Server version | package.json version |
| STORAGE_TYPE | Storage type: 'file', 'postgres', or 'mdc' | file |
| PROMPTS_DIR | Directory for storing prompts | ~/mcp/data/prompts |
| BACKUPS_DIR | Directory for backups | ~/mcp/data/backups |
| PORT | Port for HTTP server | 3003 |
| LOG_LEVEL | Logging level | info |
| HTTP_SERVER | Enable HTTP server | false |
| HOST | Host for HTTP server | 0.0.0.0 |

### PostgreSQL settings (required if STORAGE_TYPE=postgres)

| Environment Variable | Description | Default |
|----------------------|-------------|---------|
| PG_HOST | PostgreSQL host | localhost |
| PG_PORT | PostgreSQL port | 5432 |
| PG_DATABASE | PostgreSQL database name | mcp_prompts |
| PG_USER | PostgreSQL username | postgres |
| PG_PASSWORD | PostgreSQL password | |
| PG_SSL | Use SSL for PostgreSQL connection | false |
| POSTGRES_CONNECTION_STRING | Full PostgreSQL connection string (overrides individual settings) | |

### MDC settings (required if STORAGE_TYPE=mdc)

| Environment Variable | Description | Default |
|----------------------|-------------|---------|
| MDC_RULES_DIR | Directory for MDC rules | ./.cursor/rules |

## Usage

### Using with Claude

In Claude 3 Desktop app, you can configure the MCP Prompts server in your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "prompts": {
      "command": "npx",
      "args": [
        "-y",
        "@sparesparrow/mcp-prompts"
      ],
      "env": {
        "STORAGE_TYPE": "file",
        "PROMPTS_DIR": "/path/to/your/prompts/directory",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

### Available Tools

The MCP Prompts server provides the following tools:

- `add_prompt`: Add a new prompt
- `get_prompt`: Get a prompt by ID
- `update_prompt`: Update an existing prompt
- `list_prompts`: List all prompts
- `delete_prompt`: Delete a prompt by ID
- `apply_template`: Apply variables to a prompt template

### API Usage Examples

#### Listing Available Prompts

To see what prompts are available:

```
use_mcp_tool({
  server_name: "prompt-manager",
  tool_name: "list_prompts",
  arguments: {}
});
```

To filter by tags:

```
use_mcp_tool({
  server_name: "prompt-manager",
  tool_name: "list_prompts",
  arguments: {
    tags: ["development"]
  }
});
```

#### Getting a Specific Prompt

To retrieve a specific prompt by ID:

```
use_mcp_tool({
  server_name: "prompt-manager",
  tool_name: "get_prompt",
  arguments: {
    id: "development-workflow"
  }
});
```

#### Using a Template Prompt

To apply variables to a template prompt:

```
use_mcp_tool({
  server_name: "prompt-manager",
  tool_name: "apply_template",
  arguments: {
    id: "development-system-prompt",
    variables: {
      "project_type": "web frontend",
      "language": "JavaScript/React",
      "project_name": "TaskManager",
      "project_goal": "create a task management application with drag-and-drop functionality",
      "technical_context": "Using React 18, TypeScript, and Material UI"
    }
  }
});
```

### Managing Prompts

#### Adding a New Prompt

To add a new prompt:

```
use_mcp_tool({
  server_name: "prompt-manager",
  tool_name: "add_prompt",
  arguments: {
    name: "Bug Report Template",
    description: "Template for submitting bug reports",
    content: "## Bug Report\n\n### Description\n{{description}}\n\n### Steps to Reproduce\n{{steps}}\n\n### Expected Behavior\n{{expected}}\n\n### Actual Behavior\n{{actual}}\n\n### Environment\n{{environment}}",
    isTemplate: true,
    variables: ["description", "steps", "expected", "actual", "environment"],
    tags: ["bug", "template", "documentation"]
  }
});
```

#### Editing an Existing Prompt

To edit an existing prompt:

```
use_mcp_tool({
  server_name: "prompt-manager",
  tool_name: "edit_prompt",
  arguments: {
    id: "development-workflow",
    content: "Updated workflow content here...",
    tags: ["development", "workflow", "python", "updated"]
  }
});
```

### Using Prompts in Your Workflow

#### Development Workflow Example

When starting work on a new feature:

1. Request the development system prompt template
2. Fill in the template with your project details
3. Use the resulting system prompt to guide Claude's assistance

#### Code Review Example

When reviewing code:

1. Request the code review template
2. Provide the code to be reviewed
3. Claude will provide a structured review

## Prompt Format

A prompt has the following structure:

```json
{
  "id": "unique-id",
  "name": "Prompt Name",
  "description": "Optional description",
  "content": "The prompt content with {{variables}}",
  "tags": ["tag1", "tag2"],
  "isTemplate": true,
  "variables": ["variable1", "variable2"],
  "metadata": {
    "author": "Your Name",
    "version": "1.0.0"
  }
}
```

## Multi-Format Prompt Support

The MCP Prompts Server includes a powerful `MutablePrompt` interface that allows prompts to be converted between multiple formats:

- **JSON Format**: Standard internal format used by the server
- **MDC Format**: Cursor Rules Markdown format (.mdc files)
- **PGAI Format**: Format with embedding support for PostgreSQL AI
- **Template Format**: Dynamic format with variable placeholders

### Converting Between Formats

The MutablePrompt interface provides methods to convert prompts between these formats:

```typescript
// Create a mutable prompt
const factory = new MutablePromptFactoryImpl();
const prompt = factory.create({
  name: "API Design Guide",
  description: "Template for designing RESTful APIs",
  content: "# API Design for {{service_name}}\n\n## Endpoints\n\n{{endpoints}}\n\n## Authentication\n\n{{auth_method}}",
  isTemplate: true,
  variables: ["service_name", "endpoints", "auth_method"],
  tags: ["api", "design", "rest", "glob:*.md"]
});

// Convert to MDC format
const mdcContent = prompt.toMdc({
  includeVariables: true
});

// Convert to PGAI format with embeddings
const pgaiData = prompt.toPgai({
  generateEmbeddings: true,
  collection: "prompts",
  vectorConfig: {
    dimension: 1536,
    metric: "cosine"
  }
});

// Convert to template format with dollar-style variables
const templateContent = prompt.toTemplate({
  delimiterStyle: "dollar"
});
```

### Applying Templates

You can easily apply variables to template prompts:

```typescript
const result = prompt.applyVariables({
  service_name: "User Management API",
  endpoints: "GET /users, POST /users, GET /users/{id}, PUT /users/{id}, DELETE /users/{id}",
  auth_method: "JWT Bearer Token"
});
```

### Extracting Variables

Extract variables from template content:

```typescript
const variables = prompt.extractVariables();
// Returns ["service_name", "endpoints", "auth_method"]
```

### Creating from Different Formats

You can also create prompts from various formats:

```typescript
// From MDC format
const mdcContent = `---
description: Template for code reviews
globs: ["*.js", "*.ts"]
---

# Code Review Template

## Context
{{context}}

## Patterns
{{patterns}}

## Variables

- \`context\`: Description of the code being reviewed
- \`patterns\`: Common patterns to look for
`;

const promptFromMdc = factory.fromMdc(mdcContent);

// From PGAI format
const pgaiData = {
  id: "api-design",
  name: "API Design Guide",
  content: "# API Design Guide\n\nUse this guide...",
  metadata: {
    description: "Comprehensive API design guide",
    tags: ["api", "rest"],
    isTemplate: false
  }
};

const promptFromPgai = factory.fromPgai(pgaiData);
```

### Integration with Storage Adapters

The MutablePrompt interface works seamlessly with the existing storage adapters:

```typescript
// Save a prompt in MDC format
const mdcPrompt = factory.fromMdc(mdcContent);
await fileAdapter.savePrompt(mdcPrompt);

// Save a prompt to PostgreSQL with PGAI format
const pgaiPrompt = factory.fromPgai(pgaiData);
await postgresAdapter.savePrompt(pgaiPrompt);
```

This flexible format handling enables:

1. **Cross-Platform Compatibility**: Use prompts in different tools and platforms
2. **Vector Search**: Use PGAI format for semantic search capabilities
3. **IDE Integration**: Direct compatibility with Cursor Rules
4. **Template Systems**: Export templates for use in various programming languages

## Storage Adapters

The server supports three types of storage adapters:

1. **File Adapter**: Stores prompts as individual JSON files in a directory.
2. **PostgreSQL Adapter**: Stores prompts in a PostgreSQL database.
3. **MDC Adapter**: Stores prompts in Cursor Rules MDC format.

Storage types can be configured using the `STORAGE_TYPE` environment variable:

```
STORAGE_TYPE=file      # Default
STORAGE_TYPE=postgres  # Requires PostgreSQL configuration
STORAGE_TYPE=mdc       # For Cursor Rules format
```

### PostgreSQL Setup

When using PostgreSQL storage, configure the following environment variables:

```
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=mcp_prompts
PG_USER=postgres
PG_PASSWORD=your_password
PG_SSL=false
```

Alternatively, use a connection string:

```
POSTGRES_CONNECTION_STRING=postgresql://user:password@host:port/database
```

## Docker Deployment

The MCP Prompts server can be deployed using Docker in various configurations, depending on your needs.

### Using the Docker Compose Manager

We provide a convenient script for managing Docker Compose configurations, making it easy to launch the server with different profiles and environments:

```bash
# Start MCP Prompts with file storage
./docker/scripts/docker-compose-manager.sh up

# Start with PostgreSQL database
./docker/scripts/docker-compose-manager.sh up -p postgres

# Start development environment with PostgreSQL
./docker/scripts/docker-compose-manager.sh up -e development -p postgres

# Start with SSE support (for Server-Sent Events)
./docker/scripts/docker-compose-manager.sh up -p sse

# Start with multiple MCP servers integration
./docker/scripts/docker-compose-manager.sh up -p integration
```

### Purpose-Driven Container Architecture

Our Docker architecture is designed around specific use cases:

1. **Production Environment**: Optimized for performance and security
2. **Development Environment**: Includes hot-reloading and debugging tools
3. **Test Environment**: For running automated tests
4. **PostgreSQL Integration**: Adds PostgreSQL storage backend
5. **Multiple MCP Servers Integration**: Connects with other MCP servers

### Available Docker Images

The official MCP Prompts Docker images are available on Docker Hub:

- **Production**: `sparesparrow/mcp-prompts:latest`
- **Development**: `sparesparrow/mcp-prompts:dev`
- **Test**: `sparesparrow/mcp-prompts:test`

### Docker Compose Configurations

We offer several Docker Compose configurations that can be combined:

#### Base Deployment

```bash
docker compose -f docker/compose/docker-compose.base.yml up -d
```

This provides a basic MCP Prompts server with file-based storage.

#### Development Environment

```bash
docker compose -f docker/compose/docker-compose.base.yml -f docker/compose/docker-compose.development.yml up -d
```

Includes hot-reloading, source code mounting, and Node.js inspector for debugging.

#### PostgreSQL Integration

```bash
docker compose -f docker/compose/docker-compose.base.yml -f docker/compose/docker-compose.postgres.yml up -d
```

Adds PostgreSQL database and Adminer for database management.

#### Testing Environment

```bash
docker compose -f docker/compose/docker-compose.base.yml -f docker/compose/docker-compose.test.yml up -d
```

Sets up a environment optimized for running tests.

#### Multiple MCP Servers Integration

The MCP Prompts Server is designed to integrate seamlessly with other MCP servers in the ecosystem, providing a comprehensive solution for AI contextual needs. This integration enables advanced capabilities through the combined power of specialized servers.

```mermaid
graph TD
    classDef mainServer fill:#f96,stroke:#333,stroke-width:2px;
    classDef serverNode fill:#9cf,stroke:#333,stroke-width:1px;
    classDef dataStore fill:#fcf,stroke:#333,stroke-width:1px;
    classDef client fill:#cfc,stroke:#333,stroke-width:1px;
    
    Client[AI Client/Claude Desktop] --> |Requests| MCP[MCP Prompts Server]
    
    MCP:::mainServer --> |Template Variables| Memory[MCP Memory Server]
    MCP --> |File Operations| FS[MCP Filesystem Server]
    MCP --> |Repository Access| GitHub[MCP GitHub Server]
    MCP --> |Thought Process| Thinking[MCP Sequential Thinking]
    MCP --> |Voice Output| ElevenLabs[MCP ElevenLabs Server]
    MCP --> |Vector Search| PGAI[PostgreSQL AI Server]
    
    Memory:::serverNode --> |Stores| MemoryCache[(In-Memory Cache)]:::dataStore
    FS:::serverNode --> |Accesses| FileSystem[(Local Files)]:::dataStore
    GitHub:::serverNode --> |Connects to| GitHubAPI[(GitHub Repositories)]:::dataStore
    Thinking:::serverNode --> |Processes| ThoughtFlow[(Thought Chains)]:::dataStore
    ElevenLabs:::serverNode --> |Generates| Audio[(Voice Output)]:::dataStore
    PGAI:::serverNode --> |Queries| VectorDB[(Vector Database)]:::dataStore
    
    Client:::client
```

#### Data Flow Architecture

```mermaid
sequenceDiagram
    participant Client as AI Client/Claude
    participant MCP as MCP Prompts Server
    participant Mem as Memory Server
    participant FS as Filesystem Server
    participant GH as GitHub Server
    participant PGAI as PostgreSQL AI
    
    Client->>MCP: Request prompt by name
    Note over MCP: Lookup prompt source
    
    alt Filesystem Storage
        MCP->>FS: Fetch prompt file
        FS-->>MCP: Return prompt content
    else Database Storage
        MCP->>PGAI: Query prompt by name
        PGAI-->>MCP: Return prompt with embeddings
    end
    
    MCP->>Mem: Get template variables
    Mem-->>MCP: Return variable values
    
    alt GitHub Sync Enabled
        MCP->>GH: Sync prompt changes
        GH-->>MCP: Confirmation
    end
    
    MCP->>Client: Return processed prompt
    
    Note over Client,MCP: Additional resource requests
    
    Client->>MCP: Request related resources
    MCP->>Client: Return linked resources
```

#### Configuration for Multi-Server Setup

To enable integration with multiple MCP servers, you need to:

1. Start the required MCP servers using Docker Compose:

```bash
docker compose -f docker/compose/docker-compose.base.yml -f docker/compose/docker-compose.integration.yml up -d
```

2. Configure your MCP client (such as Claude Desktop) with the appropriate server URLs:

```json
{
  "mcpServers": {
    "prompts": {
      "transport": "http",
      "url": "http://localhost:3003"
    },
    "memory": {
      "transport": "http",
      "url": "http://localhost:3020"
    },
    "filesystem": {
      "transport": "http",
      "url": "http://localhost:3021"
    },
    "github": {
      "transport": "http",
      "url": "http://localhost:3022"
    },
    "sequential-thinking": {
      "transport": "http",
      "url": "http://localhost:3023"
    },
    "elevenlabs": {
      "transport": "http",
      "url": "http://localhost:3024"
    }
  }
}
```

#### Server-Specific Environment Variables

When integrating with other servers, the following environment variables can be set:

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_INTEGRATION` | Enable integration with other MCP servers | `false` |
| `MCP_MEMORY_URL` | URL for the MCP Memory Server | `http://mcp-memory:3000` |
| `MCP_FILESYSTEM_URL` | URL for the MCP Filesystem Server | `http://mcp-filesystem:3000` |
| `MCP_GITHUB_URL` | URL for the MCP GitHub Server | `http://mcp-github:3000` |
| `MCP_THINKING_URL` | URL for the MCP Sequential Thinking Server | `http://mcp-sequential-thinking:3000` |
| `MCP_ELEVENLABS_URL` | URL for the MCP ElevenLabs Server | `http://mcp-elevenlabs:3000` |

#### Integration Use Cases

1. **Template Variables with Memory Server**:
   - Store frequently used variables in the Memory Server
   - Retrieve them dynamically when applying templates

2. **Prompt Synchronization with GitHub Server**:
   - Maintain a version-controlled repository of prompts
   - Sync changes between local and remote repositories

3. **Filesystem Management**:
   - Access and manage prompt files across the filesystem
   - Import/export prompts from different locations

4. **Advanced Reasoning with Sequential Thinking**:
   - Break down complex prompt processing into sequential steps
   - Leverage chain-of-thought for step-by-step reasoning

5. **Voice Feedback with ElevenLabs**:
   - Convert prompt descriptions to speech
   - Provide voice-based feedback on prompt selection

6. **Vector Search with PostgreSQL AI**:
   - Find semantically similar prompts
   - Store and retrieve prompts with vector embeddings

### Building and Publishing Docker Images

To build and publish Docker images:

```bash
# Build all images with a specific tag
./docker/scripts/build-and-publish.sh 1.0.0

# Build just the production image
./docker/scripts/docker-compose-manager.sh image -e production -t 1.0.0
```

### Data Persistence

By default, Docker volumes are used for persistence:
- `mcp-prompts-data`: For prompt storage
- `mcp-prompts-postgres-data`: For PostgreSQL data

To use a local directory instead:

```bash
docker run -p 3003:3003 -v /path/to/local/data:/app/data sparesparrow/mcp-prompts:latest
```

## Development

### Development Workflow

#### Setting Up Development Environment

1. **Clone the repository**
   ```bash
   git clone https://github.com/user/mcp-prompt-manager.git
   cd mcp-prompt-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with the necessary configuration.

### Development Commands

- **Start development server with hot reloading**
  ```bash
  npm run dev
  ```

- **Build the project**
  ```bash
  npm run build
  ```

- **Run unit tests**
  ```bash
  npm test
  ```

- **Run integration tests**
  ```bash
  npm run test:integration
  ```

- **Test build process**
  ```bash
  npm run test:build
  ```

- **Test Docker build**
  ```bash
  npm run test:docker
  ```

- **Build Docker image**
  ```bash
  npm run docker:build
  ```

### Build Process

The build process includes several important steps:

1. **TypeScript Compilation**
   ```bash
   npm run build
   ```

2. **Make Entry Point Executable**
   ```bash
   chmod +x dist/index.js
   ```

### Testing

Run the tests:

```bash
npm test
```

Run the MCP Inspector for testing:

```bash
npm run test:inspector
```

#### Comprehensive Test Scripts

For more advanced testing options, use the provided test script:

```bash
# Run all tests (unit and integration)
./scripts/run-tests.sh

# Run only unit tests
./scripts/run-tests.sh --unit

# Run only integration tests
./scripts/run-tests.sh --integration

# Generate test coverage report
./scripts/run-tests.sh --coverage

# Run tests in Docker
./scripts/run-tests.sh --docker

# Clean up Docker resources after testing
./scripts/run-tests.sh --docker --clean
```

#### Docker Container Health Testing

To test the health of Docker containers:

```bash
# Run the Docker health check tests
TEST_DOCKER_HEALTH=true npm test -- tests/integration/docker-health.integration.test.ts
```

This test verifies that the health check endpoint is working correctly when the MCP-Prompts server is running in a Docker container.

### Directory Structure

The project follows a structured organization to maintain clean separation of concerns:

```
mcp-prompt-manager/
├── .github/workflows/    # CI/CD workflow configurations
├── dist/                 # Built files
├── src/                  # Source code
│   ├── adapters.ts       # Storage adapters
│   ├── interfaces.ts     # Core types and interfaces
│   └── index.ts          # Main entry point
├── scripts/              # Maintenance and utility scripts
├── package.json          # Project metadata and scripts
└── README.md             # Project documentation
```

## Release Process

### Pre-Release Checklist

- All TypeScript errors are resolved
- Code linting passes with no errors
- Code is properly formatted according to project standards
- Unit tests pass
- Integration tests pass
- Build test passes
- Docker build test passes
- Package installation test passes
- README is up-to-date with the latest features and changes
- CHANGELOG is updated with all notable changes

### Version Update

- Update version in `package.json` according to semantic versioning
- Ensure dependencies are up-to-date
- Update any version references in documentation

### Publishing

- Create a git tag for the new version
- Push changes and tag to GitHub
- Publish to npm (`npm publish`)
- Build and push Docker image

### Post-Release Verification

- Verify installation from npm
- Verify package can be run with npx
- Verify Docker image works as expected
- Verify integration with Claude Desktop

## Changelog

### [1.2.20] - 2025-03-14
- Automated version bump

### [1.2.19] - 2024-03-16
#### Fixed
- Fixed TypeScript errors in PostgresAdapter implementation
- Enhanced savePrompt method to properly return the created prompt
- Added updatePrompt method to the PostgresAdapter
- Fixed StorageAdapter interface to include listPrompts and clearAll methods
- Improved error handling in database-tools.ts for the clearAll method
- Enhanced health check endpoint with more detailed information

#### Added
- Added better documentation and error handling for health check endpoint

### [1.2.18] - 2024-03-14
#### Added
- Added HTTP server with health check endpoint
- Added Docker container health checks
- Added ESM module compatibility for Node.js 18-23+
- Enhanced database tools with better error handling

#### Changed
- Improved Docker build process with multi-stage builds
- Streamlined configuration management
- Optimized PostgreSQL adapter connection handling
- Updated dependencies to latest versions

#### Fixed
- Fixed issues with file adapter on certain file systems
- Improved error messages for better debugging
- Fixed template variable extraction

### [1.2.0] - 2025-03-14
#### Changed
- Reorganized codebase structure for better maintainability
- Moved Docker-related files to `docker/` directory
- Moved build scripts to `scripts/build/` directory
- Moved test scripts to `scripts/test/` directory
- Updated GitHub workflows to use new file paths
- Updated Docker Compose configuration to use new file paths
- Added comprehensive development documentation

#### Added
- Created development documentation with detailed instructions
- Created release checklist for release preparation
- Added CHANGELOG.md to track changes

#### Removed
- Removed duplicate and redundant files
- Removed incomplete scripts

### [1.1.0] - 2024-03-01
#### Added
- PGAI vector search for semantic prompt discovery
- Support for embeddings in PostgreSQL
- Improved prompts collection with professional templates
- Batch processing capabilities for prompt collections

#### Changed
- Enhanced prompt processing pipeline
- Improved command-line interface with more options
- Better error handling and validation

### [1.0.0] - 2024-02-15
#### Added
- Initial release of MCP Prompts Server
- Basic prompt management capabilities (add, edit, get, list, delete)
- Template variable substitution
- Tag-based organization
- File-based storage
- Import/export functionality
- MCP protocol compatibility

## Best Practices

1. **Organize with Tags**: Use tags to categorize your prompts for easier retrieval
2. **Use Templates**: Create reusable templates with variables for consistent prompting
3. **Include Metadata**: Add author, version, and other metadata for better organization
4. **Regular Backups**: Use the backup functionality if managing critical prompts
5. **Optimize Large Collections**: Use pagination when retrieving large prompt collections
6. **Use Consistent Naming**: Name prompts clearly and consistently for easy discovery
7. **Tag Effectively**: Use tags to organize prompts by purpose, project, or context
8. **Templatize Reusable Prompts**: Create templates for frequently used prompts with variables
9. **Update Regularly**: Keep your prompts up-to-date as your needs change
10. **Share with Team**: Share effective prompts with your team for consistent interactions

## License

MIT

## Architecture

The MCP Prompts Server is designed to integrate seamlessly with other MCP servers to provide a comprehensive ecosystem for AI prompt management. Below are diagrams illustrating various integration scenarios:

### Core Architecture

```mermaid
graph TD
    Client[Client Application] -->|API Requests| MCP[MCP Prompts Server]
    MCP -->|File Storage| FileSystem[(File Storage)]
    MCP -->|PostgreSQL Storage| Postgres[(PostgreSQL)]
    MCP -->|MDC Format| MDC[(MDC Rules)]
    
    subgraph Storage Adapters
        FileSystem
        Postgres
        MDC
    end
    
    MCP -->|Templates| Templates[Template Processing]
    MCP -->|Variables| Variables[Variable Substitution]
    MCP -->|Health Check| Health[Health Check Endpoint]
```

### Multiple MCP Servers Integration

```mermaid
graph LR
    Claude[Claude Desktop/AI Client] --> |Requests| MCP[MCP Prompts Server]
    
    subgraph MCP Ecosystem
        MCP -->|Resource Lists| FileServer[MCP Filesystem Server]
        MCP -->|Memory Storage| MemoryServer[MCP Memory Server]
        MCP -->|Database Operations| PostgresServer[MCP PostgreSQL Server]
        MCP -->|Web Browsing| PuppeteerServer[MCP Puppeteer Server]
        MCP -->|GitHub Integration| GitHubServer[MCP GitHub Server]
        MCP -->|Search| BraveServer[MCP Brave Search Server]
        MCP -->|Voice| ElevenLabsServer[MCP ElevenLabs Server]
    end
    
    FileServer -->|Filesystem Access| Files[(Local Files)]
    MemoryServer -->|In-Memory Storage| Memory[(Memory Cache)]
    PostgresServer -->|Database Access| DB[(PostgreSQL Database)]
    PuppeteerServer -->|Web Automation| Web[(Web Pages)]
    GitHubServer -->|Git Operations| GitHub[(GitHub Repos)]
    BraveServer -->|Search Results| Internet[(Internet)]
    ElevenLabsServer -->|TTS Processing| Audio[(Audio Files)]
```

### Data Flow for Prompt Management

```mermaid
sequenceDiagram
    participant Client as Client Application
    participant MCP as MCP Prompts Server
    participant Storage as Storage Adapter
    participant Resources as Resource MCP Servers
    
    Client->>MCP: Request Prompt by ID
    MCP->>Storage: Retrieve Prompt
    Storage-->>MCP: Return Prompt Data
    
    alt Template Processing
        Client->>MCP: Apply Template with Variables
        MCP->>MCP: Process Template
        MCP->>Resources: Request Additional Resources
        Resources-->>MCP: Return Resource Data
        MCP-->>Client: Return Processed Prompt
    else Direct Retrieval
        MCP-->>Client: Return Raw Prompt
    end
    
    alt Update/Create
        Client->>MCP: Add/Update Prompt
        MCP->>Storage: Save Prompt
        Storage-->>MCP: Confirmation
        MCP-->>Client: Success Response
    end
```

### Resource Integration Pattern

```mermaid
graph TD
    subgraph Client Application
        UI[User Interface]
        UI -->|Interacts with| Assistant[AI Assistant]
        Assistant -->|Sends Requests| MCPClient[MCP Client]
    end
    
    subgraph MCP Server Ecosystem
        MCPClient -->|Requests| PromptsServer[MCP Prompts Server]
        PromptsServer -->|resources/list| ResourceList[Resource List Tool]
        
        ResourceList -->|Discovers| FS[Filesystem Resources]
        ResourceList -->|Discovers| GH[GitHub Resources]
        ResourceList -->|Discovers| DB[Database Resources]
        ResourceList -->|Discovers| Web[Web Resources]
        
        PromptsServer -->|apply_template| TemplateEngine[Template Engine]
        TemplateEngine -->|Processes| Variables[Variable Substitution]
        Variables -->|Uses| ResourceData[Resource Data]
        
        FS -->|Provides| ResourceData
        GH -->|Provides| ResourceData
        DB -->|Provides| ResourceData
        Web -->|Provides| ResourceData
    end
    
    MCPClient -->|Receives Results| Assistant
```

### Docker Deployment Architecture

```mermaid
graph TD
    subgraph Host Machine
        Docker[Docker Engine]
        Volumes[(Docker Volumes)]
        Network[Docker Network]
    end
    
    subgraph MCP Containers
        PromptsCont[MCP Prompts Container]
        PostgresCont[PostgreSQL Container]
        MemoryCont[Memory MCP Container]
        GitHubCont[GitHub MCP Container]
    end
    
    Docker -->|Runs| MCP Containers
    PromptsCont -->|Connects to| Network
    PostgresCont -->|Connects to| Network
    MemoryCont -->|Connects to| Network
    GitHubCont -->|Connects to| Network
    
    PromptsCont -->|Persists Data| Volumes
    PostgresCont -->|Persists Data| Volumes
    
    Client[External Client] -->|HTTP Requests| PromptsCont
```

## MCP Resources Integration

The MCP Prompts Server integrates with various MCP resource servers to enhance prompt capabilities. This integration allows prompts to access and incorporate external data, making AI interactions more contextual and powerful.

### MCP Resources Architecture

```mermaid
graph TD
    AI[AI Client] -->|Request| MCP[MCP Prompts Server]
    
    subgraph "Resource Integration Layer"
        MCP -->|Resource URIs| Parser[Resource URI Parser]
        Parser -->|Dispatch Request| Router[Resource Router]
        
        Router -->|Filesystem Request| Filesystem[Filesystem Resource Handler]
        Router -->|Memory Request| Memory[Memory Resource Handler]
        Router -->|GitHub Request| GitHub[GitHub Resource Handler]
        Router -->|Sequential Thinking| Thinking[Sequential Thinking Handler]
        Router -->|Audio Generation| Audio[Audio Generation Handler]
    end
    
    Filesystem -->|Access Local Files| FS[(Local File System)]
    Memory -->|Access Memory Store| Mem[(In-Memory Data Store)]
    GitHub -->|API Requests| GH[(GitHub API)]
    Thinking -->|Process Analysis| Think[(Reasoning Pipeline)]
    Audio -->|Generate Speech| Sound[(Audio Output)]
    
    MCP -->|Enhanced Response| AI
    
    classDef primary fill:#f96,stroke:#333,stroke-width:2px
    classDef resource fill:#bbf,stroke:#333,stroke-width:1px
    classDef storage fill:#bfb,stroke:#333,stroke-width:1px
    
    class MCP,AI primary
    class Parser,Router,Filesystem,Memory,GitHub,Thinking,Audio resource
    class FS,Mem,GH,Think,Sound storage
```

### Resource URI Format

MCP Resources are referenced using a consistent URI format:

```
@resource-type:resource-path
```

Examples:
- `@filesystem:/path/to/file.js` - Access a local file
- `@memory:session/12345` - Retrieve data from memory
- `@github:owner/repo/path/to/file` - Get content from a GitHub repository
- `@sequential-thinking:analysis-1234` - Reference a reasoning chain
- `@elevenlabs:text-to-speak` - Generate audio from text

### Integration with Templates

Templates can be enhanced with MCP resources to create dynamic, context-aware prompts:

```json
{
  "name": "GitHub Repository Analysis",
  "content": "# Analysis of {{repo_name}}\n\n## Repository Structure\n@github:{{owner}}/{{repo_name}}/structure\n\n## Key Files\n@github:{{owner}}/{{repo_name}}/{{main_branch}}/README.md\n@github:{{owner}}/{{repo_name}}/{{main_branch}}/package.json\n\n## Previous Analysis\n@memory:repos/{{repo_name}}/previous-analysis\n\n## Analysis Process\n@sequential-thinking:repo-analysis-{{repo_name}}",
  "isTemplate": true,
  "variables": ["repo_name", "owner", "main_branch"]
}
```

### Available Resource Types

| Resource Type | URI Format | MCP Server | Purpose |
|---------------|------------|------------|---------|
| `filesystem` | `@filesystem:/path` | @modelcontextprotocol/server-filesystem | Access local files |
| `memory` | `@memory:key/subkey` | @modelcontextprotocol/server-memory | Store/retrieve data |
| `github` | `@github:owner/repo/path` | @modelcontextprotocol/server-github | Access GitHub repositories |
| `sequential-thinking` | `@sequential-thinking:id` | @modelcontextprotocol/server-sequential-thinking | Process complex reasoning |
| `elevenlabs` | `@elevenlabs:text` | elevenlabs-mcp-server | Generate voice from text |

### Resource Fallback Strategies

For robust production use, implement fallback strategies when resources are unavailable:

```mermaid
graph TD
    Request[Resource Request] --> Available{Resource Available?}
    Available -->|Yes| Fetch[Fetch Resource]
    Available -->|No| Cache{Cache Available?}
    
    Cache -->|Yes| UseCache[Use Cached Version]
    Cache -->|No| Fallback{Fallback Defined?}
    
    Fallback -->|Yes| UseFallback[Use Fallback Content]
    Fallback -->|No| Error[Return Error Message]
    
    Fetch --> Success{Success?}
    Success -->|Yes| Return[Return Content]
    Success -->|No| Cache
    
    UseCache --> Return
    UseFallback --> Return
    Error --> Return
```

### Setting Up MCP Resource Servers

To enable resource integration, deploy the required MCP servers using Docker Compose:

```bash
# Start all resource servers
docker/scripts/docker-compose-manager.sh up integration

# Start specific resource servers
docker/scripts/docker-compose-manager.sh up memory github
```

For detailed setup instructions for each resource server, refer to the [MCP Servers Documentation](https://github.com/modelcontextprotocol/servers).

## MCP Server Integration

The MCP Prompts Server can be integrated with other specialized MCP servers to enhance its capabilities and provide a more comprehensive solution. This section outlines how to integrate with the Mermaid Diagram Server and the Orchestrator Server.

### Integration with Mermaid Diagram Server

The Mermaid Diagram Server provides tools for generating, analyzing, and modifying Mermaid diagrams using natural language instructions. Integrating this server with the MCP Prompts Server enables visualization of prompts, their relationships, and their usage patterns.

```mermaid
graph TD
    User[User/Client] -->|Requests Prompt Visualization| PromptsServer[MCP Prompts Server]
    PromptsServer -->|Retrieves Prompts| Storage[(Storage Adapter)]
    PromptsServer -->|Sends Prompt Structure| MermaidServer[Mermaid Diagram Server]
    MermaidServer -->|Generates Diagram| Diagram[Mermaid Diagram]
    PromptsServer -->|Returns Visualization| User
    
    subgraph Visualization Types
        PromptRelationships[Prompt Relationships]
        TemplateStructure[Template Structure]
        VariableUsage[Variable Usage]
        ResourceDependencies[Resource Dependencies]
    end
    
    Diagram --> PromptRelationships
    Diagram --> TemplateStructure
    Diagram --> VariableUsage
    Diagram --> ResourceDependencies
    
    style PromptsServer fill:#2ecc71,stroke:#27ae60
    style MermaidServer fill:#3498db,stroke:#2980b9
    style Diagram fill:#9b59b6,stroke:#8e44ad
```

#### Use Cases for Mermaid Integration

1. **Prompt Relationship Visualization**: Generate diagrams showing how different prompts are related and categorized.
2. **Template Structure Representation**: Visualize the structure of complex templates with their variables and conditional blocks.
3. **Variable Usage Analysis**: Create charts showing how variables are used across different templates.
4. **Resource Dependencies Graph**: Visualize which prompts depend on which MCP resources.
5. **Prompt Flow Diagrams**: Create sequence diagrams showing the flow of prompt processing.

### Integration with Orchestrator Server

The Orchestrator Server implements the Orchestrator-Workers pattern to coordinate between multiple specialized servers. Integrating this server with the MCP Prompts Server enables complex workflows that involve multiple steps and servers.

```mermaid
graph LR
    User[User/Client] -->|Sends Request| OrchestratorServer[Orchestrator Server]
    OrchestratorServer -->|Coordinates Tasks| PromptsServer[MCP Prompts Server]
    OrchestratorServer -->|Coordinates Tasks| MermaidServer[Mermaid Diagram Server]
    OrchestratorServer -->|Coordinates Tasks| FileServer[Filesystem Server]
    OrchestratorServer -->|Coordinates Tasks| GitHubServer[GitHub Server]
    
    PromptsServer -->|Template Processing| TemplateEngine[Template Engine]
    MermaidServer -->|Diagram Generation| DiagramGen[Diagram Generator]
    FileServer -->|File Access| Files[(File Storage)]
    GitHubServer -->|Repository Access| Repos[(GitHub Repos)]
    
    TemplateEngine & DiagramGen & Files & Repos --> OrchestratorServer
    OrchestratorServer -->|Combined Result| User
    
    style OrchestratorServer fill:#e74c3c,stroke:#c0392b
    style PromptsServer fill:#2ecc71,stroke:#27ae60
    style MermaidServer fill:#3498db,stroke:#2980b9
```

#### Orchestration Workflows

```mermaid
sequenceDiagram
    participant User as User
    participant Orchestrator as Orchestrator Server
    participant Prompts as MCP Prompts Server
    participant Mermaid as Mermaid Diagram Server
    participant GitHub as GitHub Server
    
    User->>Orchestrator: Request integrated analysis
    Orchestrator->>GitHub: Fetch repository data
    GitHub-->>Orchestrator: Repository data
    
    Orchestrator->>Prompts: Retrieve relevant prompts
    Prompts-->>Orchestrator: Processed prompts
    
    Orchestrator->>Mermaid: Generate diagrams from data
    Mermaid-->>Orchestrator: Visualizations
    
    Orchestrator->>Prompts: Apply templates to results
    Prompts-->>Orchestrator: Formatted output
    
    Orchestrator-->>User: Complete analysis with visuals
```

### Multi-Server Project Analysis Pattern

This pattern leverages multiple MCP servers for comprehensive project analysis:

```mermaid
graph TD
    User[User/Client] -->|Analysis Request| OrchestratorServer[Orchestrator Server]
    OrchestratorServer -->|Task 1: Load Project| FileServer[Filesystem Server]
    OrchestratorServer -->|Task 2: Get Prompts| PromptsServer[MCP Prompts Server]
    OrchestratorServer -->|Task 3: Analyze Structure| AnalysisEngine[Project Analysis Engine]
    OrchestratorServer -->|Task 4: Visualize| MermaidServer[Mermaid Diagram Server]
    
    FileServer -->|Project Files| OrchestratorServer
    PromptsServer -->|Analysis Prompts| OrchestratorServer
    AnalysisEngine -->|Analysis Results| OrchestratorServer
    MermaidServer -->|Visualizations| OrchestratorServer
    
    OrchestratorServer -->|Comprehensive Report| User
    
    subgraph Analysis Outputs
        CodeStructure[Code Structure]
        DependencyGraph[Dependency Graph]
        ArchitectureDiagram[Architecture Diagram]
        DataFlowDiagram[Data Flow Diagram]
    end
    
    OrchestratorServer --> Analysis Outputs
    
    style OrchestratorServer fill:#e74c3c,stroke:#c0392b
    style PromptsServer fill:#2ecc71,stroke:#27ae60
    style MermaidServer fill:#3498db,stroke:#2980b9
    style AnalysisEngine fill:#f1c40f,stroke:#f39c12
```

### Setting Up Integration

To integrate the MCP Prompts Server with the Mermaid and Orchestrator servers, follow these steps:

1. **Configure Server Connections**:
   ```json
   {
     "router": {
       "port": 3000,
       "host": "0.0.0.0",
       "discovery": {
         "enableAutoDiscovery": true,
         "refreshInterval": 30000
       }
     },
     "servers": [
       {
         "name": "prompts",
         "url": "http://prompts:3003",
         "capabilities": ["prompts", "resources", "templates"]
       },
       {
         "name": "mermaid",
         "url": "http://mermaid:3004",
         "capabilities": ["diagrams", "visualization"]
       },
       {
         "name": "orchestrator",
         "url": "http://orchestrator:3005",
         "capabilities": ["workflows", "coordination"]
       },
       {
         "name": "filesystem",
         "url": "http://filesystem:3006",
         "capabilities": ["files", "storage"]
       },
       {
         "name": "postgres",
         "url": "http://postgres:3007",
         "capabilities": ["database", "query"]
       }
     ]
   }
   ```

2. **Enable Resource Sharing**:
   Set the `ENABLE_RESOURCES` environment variable to `true` for the MCP Prompts Server.

3. **Set Up Docker Compose**:
   Create a `docker-compose.yml` file that includes all required servers:
   ```yaml
   version: '3'
   services:
     mcp-prompts:
       image: sparesparrow/mcp-prompts:latest
       environment:
         - ENABLE_RESOURCES=true
         - STORAGE_TYPE=file
         - PROMPTS_DIR=/app/data/prompts
       volumes:
         - ./data:/app/data
       ports:
         - "3003:3003"
     
     mcp-github:
       image: node:alpine
       command: npx -y @modelcontextprotocol/server-github
       environment:
         - GITHUB_PERSONAL_ACCESS_TOKEN=your-token-here
       ports:
         - "3004:3000"
     
     mcp-filesystem:
       image: node:alpine
       command: npx -y @modelcontextprotocol/server-filesystem /data
       volumes:
         - ./data:/data
       ports:
         - "3005:3000"
       
     mcp-postgres:
       image: postgres:14
       environment:
         - POSTGRES_USER=mcp
         - POSTGRES_PASSWORD=mcp_password
         - POSTGRES_DB=mcp_prompts
       volumes:
         - postgres-data:/var/lib/postgresql/data
       
 volumes:
   prompts-data:
   postgres-data:
   ```

By integrating these servers, you can create powerful workflows that combine prompt management, orchestration, and visualization capabilities.

## Advanced Integration with MCP Router

For more complex deployments, you can use the MCP Router to create a centralized access point for all MCP servers. This enables seamless discovery and routing of requests between servers.

```mermaid
graph TD
    Client[Client Application] -->|Requests| Router[MCP Router]
    
    Router -->|Prompt Operations| PromptsServer[MCP Prompts Server]
    Router -->|Diagram Generation| MermaidServer[Mermaid Diagram Server]
    Router -->|Workflow Orchestration| OrchestratorServer[Orchestrator Server]
    Router -->|File Operations| FileServer[Filesystem Server]
    Router -->|Storage Operations| PostgresServer[PostgreSQL Server]
    
    PromptsServer <-->|Data Exchange| MermaidServer
    PromptsServer <-->|Data Exchange| OrchestratorServer
    PostgresServer <-->|Data Storage| PromptsServer
    FileServer <-->|File Access| PromptsServer
    
    subgraph Service Discovery
        Router -->|Register Capabilities| Registry[(Capability Registry)]
        PromptsServer & MermaidServer & OrchestratorServer & FileServer & PostgresServer -->|Register| Registry
        Registry -->|Service Info| Router
    end
    
    style Router fill:#3498db,stroke:#2980b9,stroke-width:3px
    style PromptsServer fill:#2ecc71,stroke:#27ae60
    style MermaidServer fill:#9b59b6,stroke:#8e44ad
    style OrchestratorServer fill:#e74c3c,stroke:#c0392b
```

#### Router Configuration

To set up the MCP Router with multiple servers, create a `router-config.json` file:

```json
{
  "router": {
    "port": 3000,
    "host": "0.0.0.0",
    "discovery": {
      "enableAutoDiscovery": true,
      "refreshInterval": 30000
    }
  },
  "servers": [
    {
      "name": "prompts",
      "url": "http://prompts:3003",
      "capabilities": ["prompts", "resources", "templates"]
    },
    {
      "name": "mermaid",
      "url": "http://mermaid:3004",
      "capabilities": ["diagrams", "visualization"]
    },
    {
      "name": "orchestrator",
      "url": "http://orchestrator:3005",
      "capabilities": ["workflows", "coordination"]
    },
    {
      "name": "filesystem",
      "url": "http://filesystem:3006",
      "capabilities": ["files", "storage"]
    },
    {
      "name": "postgres",
      "url": "http://postgres:3007",
      "capabilities": ["database", "query"]
    }
  ]
}
```

## Use Cases and Integration Examples

### 1. Project Documentation Generator

Use the integrated servers to automatically generate comprehensive project documentation with diagrams:

```mermaid
sequenceDiagram
    participant User as User
    participant Orchestrator as Orchestrator
    participant FileSystem as Filesystem Server
    participant Prompts as Prompts Server
    participant Mermaid as Mermaid Server
    
    User->>Orchestrator: Generate Project Documentation
    Orchestrator->>FileSystem: Fetch Project Structure
    FileSystem-->>Orchestrator: Directory Structure
    
    Orchestrator->>FileSystem: Read Source Files
    FileSystem-->>Orchestrator: Source Code
    
    Orchestrator->>Prompts: Get Documentation Template
    Prompts-->>Orchestrator: Documentation Template
    
    Orchestrator->>Prompts: Apply Template with Code Analysis
    Prompts-->>Orchestrator: Documentation Draft
    
    Orchestrator->>Mermaid: Generate Architecture Diagram
    Mermaid-->>Orchestrator: Architecture Diagram
    
    Orchestrator->>Mermaid: Generate Class Diagrams
    Mermaid-->>Orchestrator: Class Diagrams
    
    Orchestrator->>Mermaid: Generate Sequence Diagrams
    Mermaid-->>Orchestrator: Sequence Diagrams
    
    Orchestrator->>FileSystem: Write Documentation Files
    FileSystem-->>Orchestrator: Confirmation
    
    Orchestrator-->>User: Documentation Complete
```

### 2. Prompt Visualization Dashboard

Create a dashboard for visualizing and managing prompts with their relationships:

```mermaid
graph LR
    User[User] -->|Access| Dashboard[Prompt Dashboard]
    
    subgraph Backend Services
        Dashboard -->|List Prompts| PromptsServer[Prompts Server]
        Dashboard -->|Generate Diagrams| MermaidServer[Mermaid Server]
        PromptsServer -->|Prompt Data| MermaidServer
    end
    
    PromptsServer -->|Fetch Prompts| Storage[(Storage)]
    
    subgraph Visualization Views
        MermaidServer -->|Category Graph| CategoryView[Category View]
        MermaidServer -->|Dependency Graph| DependencyView[Dependency View]
        MermaidServer -->|Template Structure| TemplateView[Template View]
        MermaidServer -->|Usage Statistics| UsageView[Usage Stats View]
    end
    
    CategoryView & DependencyView & TemplateView & UsageView --> Dashboard
    
    style Dashboard fill:#3498db,stroke:#2980b9
    style PromptsServer fill:#2ecc71,stroke:#27ae60
    style MermaidServer fill:#9b59b6,stroke:#8e44ad
```

### 3. Template-Based Project Generator

Generate new projects using templates and visualize the project structure:

```mermaid
graph TD
    User[User] -->|Project Request| OrchestratorServer[Orchestrator Server]
    
    OrchestratorServer -->|Get Project Template| PromptsServer[Prompts Server]
    OrchestratorServer -->|Create Project Structure| FileServer[Filesystem Server]
    OrchestratorServer -->|Generate Diagrams| MermaidServer[Mermaid Server]
    
    PromptsServer -->|Template| OrchestratorServer
    FileServer -->|Confirmation| OrchestratorServer
    MermaidServer -->|Project Diagrams| OrchestratorServer
    
    OrchestratorServer -->|Complete Project| User
    
    subgraph Project Components
        CodeFiles[Source Code Files]
        ConfigFiles[Configuration Files]
        DocFiles[Documentation Files]
        DiagramFiles[Diagram Files]
    end
    
    OrchestratorServer --> Project Components
    
    style OrchestratorServer fill:#e74c3c,stroke:#c0392b
    style PromptsServer fill:#2ecc71,stroke:#27ae60
    style MermaidServer fill:#9b59b6,stroke:#8e44ad
    style FileServer fill:#f1c40f,stroke:#f39c12
```

### Docker Compose for Full Integration

Here's a complete Docker Compose configuration for integrating all servers with the MCP Router:

```yaml
version: "3"
services:
  router:
    image: mcp/router:latest
    ports:
      - "3000:3000"
    volumes:
      - ./router-config.json:/app/router-config.json
    command: ["--config", "/app/router-config.json"]
    
  prompts:
    image: sparesparrow/mcp-prompts:latest
    environment:
      - ENABLE_RESOURCES=true
      - STORAGE_TYPE=file
      - PROMPTS_DIR=/app/data/prompts
      - HTTP_SERVER=true
      - PORT=3003
      - HOST=0.0.0.0
    volumes:
      - ./data:/app/data
    ports:
      - "3003:3003"
    
  mermaid:
    image: mcp/mermaid-server:latest
    ports:
      - "3004:3004"
    
  orchestrator:
    image: mcp/orchestrator-server:latest
    ports:
      - "3005:3005"
    
  filesystem:
    image: mcp/filesystem-server:latest
    volumes:
      - ./data:/data
    ports:
      - "3006:3006"
    
  postgres:
    image: postgres:14
    environment:
      - POSTGRES_USER=mcp
      - POSTGRES_PASSWORD=mcp_password
      - POSTGRES_DB=mcp_prompts
    volumes:
      - postgres-data:/var/lib/postgresql/data
      
  postgres-server:
    image: mcp/postgres-server:latest
    environment:
      - POSTGRES_CONNECTION_STRING=postgresql://mcp:mcp_password@postgres:5432/mcp_prompts
    ports:
      - "3007:3007"
    depends_on:
      - postgres

volumes:
  pg_data:
```

This integration approach provides a complete ecosystem for managing prompts, creating visualizations, orchestrating workflows, and persisting data.

## Server-Sent Events (SSE) Support

The MCP-Prompts server now includes support for Server-Sent Events (SSE), which enables real-time updates without polling. This is particularly useful for applications that need to receive prompt updates in real-time, such as the Claude desktop application.

### Running with SSE Support

You can run the MCP-Prompts server with SSE support using Docker Compose:

```bash
docker-compose up mcp-prompts-sse
```

This will start the MCP-Prompts server with SSE enabled on port 3003. The SSE endpoint is available at `/events`.

### Configuring Claude Desktop to Use SSE

To configure Claude desktop to use the dockerized MCP-Prompts server with SSE support, update your `claude_desktop_config.json` file (typically located at `~/.config/Claude/claude_desktop_config.json`):

```json
"prompts": {
  "command": "docker",
  "args": [
    "run",
    "--rm",
    "-p",
    "3003:3003",
    "-v",
    "/path/to/your/prompts:/app/data/prompts",
    "-v",
    "/path/to/your/backups:/app/data/backups",
    "--name",
    "mcp-prompts-sse",
    "-e",
    "STORAGE_TYPE=file",
    "-e",
    "PROMPTS_DIR=/app/data/prompts",
    "-e",
    "BACKUPS_DIR=/app/data/backups",
    "-e",
    "HTTP_SERVER=true",
    "-e",
    "PORT=3003",
    "-e",
    "HOST=0.0.0.0",
    "-e",
    "ENABLE_SSE=true",
    "-e",
    "SSE_PATH=/events",
    "-e",
    "CORS_ORIGIN=*",
    "sparesparrow/mcp-prompts:latest"
  ]
}
```

Replace `/path/to/your/prompts` and `/path/to/your/backups` with your actual paths.

### SSE API

The SSE endpoint sends the following events:

1. **Connect Event**: Sent when a client connects to the SSE endpoint
   ```json
   { "type": "connect", "message": "Connected to MCP Prompts SSE stream" }
   ```

2. **Heartbeat Event**: Sent every 30 seconds to keep the connection alive
   ```json
   { "type": "heartbeat", "timestamp": "2023-03-15T12:34:56.789Z" }
   ```

You can listen for these events in your client application:

```javascript
const eventSource = new EventSource('http://localhost:3003/events');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received SSE event:', data);
};

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  eventSource.close();
};
```