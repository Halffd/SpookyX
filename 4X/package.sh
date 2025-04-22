#!/bin/bash

# Package script for 4X extension

# Check if zip is installed
if ! command -v zip &> /dev/null; then
    echo "Error: zip command not found. Please install zip."
    exit 1
fi

# Get version from manifest
VERSION=$(grep -oP '"version":\s*"\K[^"]+' manifest.json)
echo "Packaging 4X Extension v$VERSION"

# Create dist directory if it doesn't exist
mkdir -p dist

# Define output file name
OUTPUT_FILE="dist/4X-$VERSION.zip"

# Check if external libraries exist
MISSING_LIBS=0
REQUIRED_LIBS=("lib/jquery.min.js" "lib/jquery.selection.js" "lib/jquery.mousewheel.min.js" "lib/colz.class.min.js")

for LIB in "${REQUIRED_LIBS[@]}"; do
    if [ ! -f "$LIB" ]; then
        echo "Error: Missing library file: $LIB"
        MISSING_LIBS=1
    fi
done

# Check if icons exist
REQUIRED_ICONS=("images/icon16.png" "images/icon24.png" "images/icon32.png" "images/icon48.png" "images/icon128.png")

for ICON in "${REQUIRED_ICONS[@]}"; do
    if [ ! -f "$ICON" ]; then
        echo "Error: Missing icon file: $ICON"
        MISSING_LIBS=1
    fi
done

if [ $MISSING_LIBS -eq 1 ]; then
    echo "Missing required files. Please check the README files in lib/ and images/ directories."
    exit 1
fi

# Create the zip file
echo "Creating package: $OUTPUT_FILE"
zip -r "$OUTPUT_FILE" \
    manifest.json \
    LICENSE \
    README.md \
    popup.html \
    options.html \
    js/ \
    css/ \
    lib/*.js \
    images/*.png \
    popup/ \
    -x "*/README.md" "*/.gitkeep" "*/.*"

# Check if zip was successful
if [ $? -eq 0 ]; then
    echo "Package created successfully: $OUTPUT_FILE"
    echo "Package size: $(du -h "$OUTPUT_FILE" | cut -f1)"
else
    echo "Error creating package"
    exit 1
fi

echo "Done!"
exit 0 