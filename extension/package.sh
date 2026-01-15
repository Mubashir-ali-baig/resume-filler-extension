#!/bin/bash

# Package script for Resume Filler Extension
# Creates a zip file ready for distribution

set -e

EXTENSION_NAME="resume-filler-extension"
VERSION=$(grep '"version"' manifest.json | cut -d'"' -f4)
PACKAGE_NAME="${EXTENSION_NAME}-v${VERSION}.zip"
TEMP_DIR=$(mktemp -d)

echo "📦 Packaging Resume Filler Extension v${VERSION}..."

# Copy extension files to temp directory
echo "📋 Copying files..."
cp -r . "$TEMP_DIR/$EXTENSION_NAME" 2>/dev/null || {
  # Exclude certain files/directories
  rsync -av --exclude='.git' \
            --exclude='node_modules' \
            --exclude='.DS_Store' \
            --exclude='*.log' \
            --exclude='.vscode' \
            --exclude='.idea' \
            . "$TEMP_DIR/$EXTENSION_NAME"
}

# Remove config.js if it exists (users should create from config.example.js)
if [ -f "$TEMP_DIR/$EXTENSION_NAME/config.js" ]; then
  echo "⚠️  Removing config.js (users should create from config.example.js)"
  rm "$TEMP_DIR/$EXTENSION_NAME/config.js"
fi

# Create zip file
cd "$TEMP_DIR"
echo "📦 Creating zip file..."
zip -r "$PACKAGE_NAME" "$EXTENSION_NAME" -q

# Move zip to original directory
mv "$PACKAGE_NAME" "$OLDPWD/"
cd "$OLDPWD"

# Cleanup
rm -rf "$TEMP_DIR"

echo "✅ Package created: $PACKAGE_NAME"
echo "📝 Users should:"
echo "   1. Extract the zip file"
echo "   2. Copy config.example.js to config.js"
echo "   3. Add their API keys to config.js"
echo "   4. Load the extension in Chrome via chrome://extensions/"
