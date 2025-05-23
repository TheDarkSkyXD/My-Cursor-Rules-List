## [0.7.0] - 2025-03-15

### Added
- Server-Sent Events (SSE) support for real-time updates
- New Docker Compose configuration for running with SSE support
- Script to configure Claude desktop to use MCP-Prompts with SSE support
- Script to build and push Docker images with improved error handling
- New environment variables: ENABLE_SSE, SSE_PATH, and CORS_ORIGIN
- Mermaid diagrams in README.md for visualizing multi-server integrations
- New advanced template-based prompts:
  - `advanced-multi-server-template.json`: Coordinates multiple MCP servers for complex tasks
  - `advanced-prompt-engineering.json`: Comprehensive guide to effective prompt engineering
  - `mcp-resources-integration.json`: Guide to working with the resources/list method
- Enhanced documentation for MCP Resources integration
- Updated multi-server integration documentation

### Changed
- Enhanced HTTP server implementation with SSE functionality
- Updated ServerConfig interface to include SSE-related properties
- Improved Docker Compose file to include both standard and SSE services
- Reorganized README.md with more detailed integration diagrams
- Updated prompt format documentation with resources integration 