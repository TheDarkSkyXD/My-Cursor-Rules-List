#!/bin/bash
# Comprehensive cleanup script for the MCP-Prompts codebase

# Set script to exit on error
set -e

echo "=== MCP-Prompts Codebase Cleanup ==="
echo "Cleaning up temporary files and moving legacy code..."

# Create a legacy directory if it doesn't exist
mkdir -p legacy/sse
mkdir -p legacy/scripts
mkdir -p legacy/configs
mkdir -p legacy/builds

# Move SSE-related JavaScript files to the legacy directory
echo "Moving SSE-related JavaScript files to legacy/sse directory..."
find . -maxdepth 1 -name "*sse*.js" -type f -not -path "*/node_modules/*" -not -path "*/dist/*" -exec mv -v {} legacy/sse/ \; 2>/dev/null || true

# Move temporary shell scripts to the legacy directory
echo "Moving temporary shell scripts to legacy/scripts directory..."
find . -maxdepth 1 -name "run-*.sh" -type f -not -path "*/node_modules/*" -exec mv -v {} legacy/scripts/ \; 2>/dev/null || true
find . -maxdepth 1 -name "start-*.sh" -type f -not -path "*/node_modules/*" -exec mv -v {} legacy/scripts/ \; 2>/dev/null || true

# Move temporary configuration files to legacy
echo "Moving temporary configuration files to legacy/configs directory..."
mv -v claude_desktop_config_stdio.json legacy/configs/ 2>/dev/null || true
mv -v mcp-config-stdio.json legacy/configs/ 2>/dev/null || true
mv -v mcp-config.json legacy/configs/ 2>/dev/null || true
mv -v temp*.json legacy/configs/ 2>/dev/null || true

# Remove temporary npm package files
echo "Removing temporary npm package files..."
rm -vf *.tgz 2>/dev/null || true

# Clean build artifacts
echo "Cleaning build artifacts..."
rm -rf dist/
rm -rf build/
rm -rf output/
rm -rf coverage/
rm -rf .nyc_output/
rm -rf test-results/

# Clean logs
echo "Cleaning log files..."
find . -name "*.log" -type f -not -path "*/node_modules/*" -delete 2>/dev/null || true
find . -name "npm-debug.log*" -type f -delete 2>/dev/null || true

# Clean editor-specific temporary files
echo "Cleaning editor-specific temporary files..."
find . -name "*.swp" -type f -delete 2>/dev/null || true
find . -name "*.swo" -type f -delete 2>/dev/null || true
find . -name ".DS_Store" -type f -delete 2>/dev/null || true

# Create a README in the legacy directory
cat > legacy/README.md << EOF
# Legacy Files

This directory contains legacy files that have been replaced by TypeScript implementations or are no longer needed.

## SSE Files

The SSE-related JavaScript files in the \`sse\` directory have been replaced by the TypeScript implementation in \`src/sse.ts\`.

## Scripts

The shell scripts in the \`scripts\` directory have been replaced by the TypeScript implementation in \`src/scripts/start-server.ts\`.

## Configs

The configuration files in the \`configs\` directory are temporary configurations that should not be committed to the repository.

## Builds

The build artifacts in the \`builds\` directory are temporary builds that should not be committed to the repository.

These files are kept for reference only and should not be used in production.
EOF

# Rebuild the project
echo "Rebuilding the project..."
npm run clean
npm run build

echo "Cleanup complete!"
echo "Legacy files have been moved to the legacy directory."
echo "See legacy/README.md for more information."
echo "Temporary files have been deleted."
echo "Build artifacts have been cleaned."
echo ""
echo "Run 'npm run build' to rebuild the project." 