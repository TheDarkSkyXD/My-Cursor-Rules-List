#!/bin/bash

# Cleanup script for folder reorganization

# Old App Router files
echo "Removing old App Router files..."
rm -rf app/components/ColorPicker.tsx
rm -rf app/components/DrawingCanvas.tsx
rm -rf app/components/ToolPanel.tsx
rm -rf app/components/SettingsDialog.tsx
rm -rf app/globals.css
rm -rf app/layout.tsx
rm -rf app/page.tsx
rm -rf app/components

# Check for old Pages Router files we don't need anymore
echo "Removing old Pages Router files..."
rm -rf src/pages/index.tsx  # If it exists
# Keep _app.tsx and _document.tsx until we're fully migrated

echo "Cleanup complete! You can now run 'pnpm dev' to start the app with the new structure." 