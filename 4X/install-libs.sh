#!/bin/bash

# Script to download required libraries for 4X extension

echo "Installing required libraries..."

# Create lib directory if it doesn't exist
mkdir -p lib

# Change to lib directory
cd lib

# Download jQuery
echo "Downloading jQuery..."
curl -s -L -o jquery.min.js https://code.jquery.com/jquery-3.7.1.min.js

# Download jQuery selection
echo "Downloading jQuery.selection..."
curl -s -L -o jquery.selection.js https://raw.githubusercontent.com/madapaja/jquery.selection/master/src/jquery.selection.js

# Download jQuery mousewheel
echo "Downloading jQuery.mousewheel..."
curl -s -L -o jquery.mousewheel.min.js https://raw.githubusercontent.com/jquery/jquery-mousewheel/master/jquery.mousewheel.min.js

# Download Colz color manipulation library
echo "Downloading Colz color library..."
curl -s -L -o colz.class.min.js https://cdn.jsdelivr.net/npm/colz@0.0.5/dist/colz.min.js

echo "All libraries downloaded successfully!"
echo "If you see any errors above, please check your internet connection and try again."

# Return to original directory
cd ..

echo ""
echo "Library installation complete!"
echo "Installed libraries:"
ls -la lib/*.js

echo ""
echo "Note: If you encounter any issues with these libraries, please download them manually"
echo "from their respective sources as mentioned in lib/README.md" 