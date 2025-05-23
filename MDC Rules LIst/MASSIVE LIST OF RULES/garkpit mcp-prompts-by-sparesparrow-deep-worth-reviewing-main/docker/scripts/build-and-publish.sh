#!/bin/bash

# Script to build and publish Docker images
# This script builds and publishes Docker images for production, development, and testing

set -e

# Colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get tag from command line argument or use current git tag if available
if [ $# -eq 0 ]; then
    # Try to get the current git tag
    GIT_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
    
    if [ -n "$GIT_TAG" ]; then
        TAG=${GIT_TAG#v} # Remove 'v' prefix if present
    else
        TAG="latest"
    fi
else
    TAG=$1
fi

echo -e "${BLUE}Building and publishing Docker images with tag: ${YELLOW}${TAG}${NC}"

# Build images
echo -e "${GREEN}Building production image${NC}"
docker build -t sparesparrow/mcp-prompts:${TAG} -f docker/Dockerfile.prod .
docker tag sparesparrow/mcp-prompts:${TAG} sparesparrow/mcp-prompts:latest

echo -e "${GREEN}Building development image${NC}"
docker build -t sparesparrow/mcp-prompts:${TAG}-dev -f docker/Dockerfile.development .
docker tag sparesparrow/mcp-prompts:${TAG}-dev sparesparrow/mcp-prompts:dev

echo -e "${GREEN}Building testing image${NC}"
docker build -t sparesparrow/mcp-prompts:${TAG}-test -f docker/Dockerfile.testing .
docker tag sparesparrow/mcp-prompts:${TAG}-test sparesparrow/mcp-prompts:test

# Publish images
echo -e "${GREEN}Publishing images to Docker Hub${NC}"
echo "You may need to run 'docker login' first if not already logged in."

docker push sparesparrow/mcp-prompts:${TAG}
docker push sparesparrow/mcp-prompts:latest

docker push sparesparrow/mcp-prompts:${TAG}-dev
docker push sparesparrow/mcp-prompts:dev

docker push sparesparrow/mcp-prompts:${TAG}-test
docker push sparesparrow/mcp-prompts:test

echo -e "${GREEN}Images published successfully:${NC}"
echo " - sparesparrow/mcp-prompts:${TAG}"
echo " - sparesparrow/mcp-prompts:latest"
echo " - sparesparrow/mcp-prompts:${TAG}-dev"
echo " - sparesparrow/mcp-prompts:dev"
echo " - sparesparrow/mcp-prompts:${TAG}-test"
echo " - sparesparrow/mcp-prompts:test" 