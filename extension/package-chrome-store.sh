#!/bin/bash

# Package script for Chrome Web Store submission
# Creates a clean zip file with only essential extension files

set -e

EXTENSION_NAME="resume-filler-extension"
VERSION=$(grep '"version"' manifest.json | cut -d'"' -f4)
PACKAGE_NAME="${EXTENSION_NAME}-v${VERSION}-chrome-store.zip"
TEMP_DIR=$(mktemp -d)

echo "📦 Packaging Resume Filler Extension v${VERSION} for Chrome Web Store..."
echo ""

# Essential files and directories to include
ESSENTIAL_DIRS=(
  "popup"
  "background"
  "content"
  "lib"
  "icons"
)

ESSENTIAL_FILES=(
  "manifest.json"
)

# Copy essential directories
echo "📋 Copying essential files..."
for dir in "${ESSENTIAL_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    echo "  ✅ Copying $dir/"
    cp -r "$dir" "$TEMP_DIR/"
  else
    echo "  ⚠️  Warning: $dir/ not found"
  fi
done

# Copy essential files
for file in "${ESSENTIAL_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ Copying $file"
    cp "$file" "$TEMP_DIR/"
  else
    echo "  ⚠️  Warning: $file not found"
  fi
done

# Copy config.js for Chrome Web Store (should have real backend URL)
# If config.js doesn't exist, create one from config.example.js
if [ -f "config.js" ]; then
  echo "  ✅ Copying config.js (with backend URL: $(grep 'BACKEND_API_URL' config.js | head -1 | cut -d'"' -f2))"
  cp "config.js" "$TEMP_DIR/"
elif [ -f "config.example.js" ]; then
  echo "  ⚠️  Warning: config.js not found, using config.example.js"
  echo "  ⚠️  Make sure to update BACKEND_API_URL in config.example.js before packaging!"
  cp "config.example.js" "$TEMP_DIR/config.js"
else
  echo "  ❌ Error: Neither config.js nor config.example.js found!"
  exit 1
fi

# Create zip file (from inside temp directory, so zip contains files directly)
cd "$TEMP_DIR"
echo ""
echo "📦 Creating zip file..."
zip -r "$PACKAGE_NAME" . -q -x "*.DS_Store" "*.git*"

# Move zip to original directory
mv "$PACKAGE_NAME" "$OLDPWD/"
cd "$OLDPWD"

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Chrome Web Store package created: $PACKAGE_NAME"
echo ""
echo "📝 Next steps:"
echo "   1. Go to Chrome Web Store Developer Dashboard"
echo "   2. Click 'Add new item'"
echo "   3. Upload: $PACKAGE_NAME"
echo "   4. Fill in store listing details (description, screenshots, etc.)"
echo "   5. Submit for review"
echo ""
echo "⚠️  Note: Make sure your backend API is deployed and accessible"
echo "   The extension uses: https://resume-filler-server.vercel.app"
