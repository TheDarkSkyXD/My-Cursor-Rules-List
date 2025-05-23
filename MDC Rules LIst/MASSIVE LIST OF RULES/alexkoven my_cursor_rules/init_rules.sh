#!/bin/bash

# Check if we're not in /Code/my_cursor_rules/ or any of its subdirectories
current_dir=$(realpath "$(pwd)")
if [[ "$current_dir" == "/home/falcon/Code/my_cursor_rules" ]] || [[ "$current_dir" == /home/falcon/Code/my_cursor_rules/* ]]; then
    echo "Error: This script must not be run from /Code/my_cursor_rules/ or any of its subdirectories"
    exit 1
fi

# Check if we're in a .cursor directory of a git repo
parent_dir=$(dirname "$current_dir")
if [ ! -d "$parent_dir/.git" ]; then
    echo "Error: Parent directory ($parent_dir) is not a git repository"
    exit 1
fi

# Clone the rules repository
echo "Cloning cursor rules repository..."
git clone git@github.com:alexkoven/my_cursor_rules.git .

# Move the rules to the current directory
# echo "Moving rules to .cursor directory..."
# mv ./my_cursor_rules/* ./
# rm -r ./my_cursor_rules/

# Add .cursor to parent's .gitignore if not already present
parent_gitignore="$parent_dir/.gitignore"
if ! grep -q "^\.cursor/" "$parent_gitignore" 2>/dev/null; then
    echo ".cursor/" >> "$parent_gitignore"
    echo "Added .cursor/ to .gitignore"
else
    echo ".cursor/ already in .gitignore"
fi

echo "Rules initialization completed successfully!"

