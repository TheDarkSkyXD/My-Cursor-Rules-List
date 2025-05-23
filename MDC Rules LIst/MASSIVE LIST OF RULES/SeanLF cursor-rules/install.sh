#!/bin/bash
# install.sh - Install Cursor AI Senior Principal Engineer rules

# Check if a path was provided
if [ -z "$1" ]; then
  echo "Usage: ./install.sh /path/to/your/project"
  echo "Example: ./install.sh ~/code/my-project"
  exit 1
fi

# Ensure target directory exists
PROJECT_PATH="$1"
RULES_DIR="$PROJECT_PATH/.cursor/rules"

if [ ! -d "$PROJECT_PATH" ]; then
  echo "Error: Project directory '$PROJECT_PATH' does not exist"
  exit 1
fi

# Create rules directory
mkdir -p "$RULES_DIR"

# Copy all MDC files
cp .cursor/rules/*.mdc "$RULES_DIR/"

# Count files copied
COUNT=$(ls -1 "$RULES_DIR"/*.mdc 2>/dev/null | wc -l)

# Show success message
echo "✅ Successfully copied $COUNT Cursor AI rules to $RULES_DIR"
echo "   You may need to restart Cursor for the rules to take effect."