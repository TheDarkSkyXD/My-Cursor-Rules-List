#!/bin/bash
# Bash script to update existing Cursor rules

# Define the rules directory
RULES_DIR=".cursor/rules"

# Check if the rules directory exists
if [ ! -d "$RULES_DIR" ]; then
    echo -e "\033[0;31mError: $RULES_DIR directory not found. Please run install.sh first.\033[0m"
    exit 1
fi

# Count for statistics
UPDATED_COUNT=0
NEW_COUNT=0

# Copy each .mdc file to the rules directory
for file in *.mdc; do
    if [ -f "$file" ]; then
        DEST_PATH="$RULES_DIR/$file"
        
        if [ -f "$DEST_PATH" ]; then
            # File exists, check if it's different
            if ! cmp -s "$file" "$DEST_PATH"; then
                cp "$file" "$RULES_DIR/"
                echo -e "\033[0;33mUpdated: $file\033[0m"
                UPDATED_COUNT=$((UPDATED_COUNT+1))
            else
                echo -e "\033[0;37mUnchanged: $file\033[0m"
            fi
        else
            # File doesn't exist, copy it
            cp "$file" "$RULES_DIR/"
            echo -e "\033[0;32mAdded: $file\033[0m"
            NEW_COUNT=$((NEW_COUNT+1))
        fi
    fi
done

# Print summary
echo -e "\n\033[0;36mUpdate complete!\033[0m"
echo -e "\033[0;36m$UPDATED_COUNT rules updated, $NEW_COUNT new rules added.\033[0m"
echo -e "\033[0;36mYour Cursor rules are now up to date.\033[0m" 