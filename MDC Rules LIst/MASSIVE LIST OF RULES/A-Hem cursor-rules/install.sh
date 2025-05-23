#!/bin/bash
# Bash script to install Cursor rules

# Create the .cursor/rules directory if it doesn't exist
RULES_DIR=".cursor/rules"
mkdir -p "$RULES_DIR"
echo "Created $RULES_DIR directory"

# Copy all .mdc files to the rules directory
for file in *.mdc; do
    if [ -f "$file" ]; then
        cp "$file" "$RULES_DIR/"
        echo "Copied $file to $RULES_DIR"
    fi
done

echo "Installation complete! Rules are now available in your Cursor IDE." 