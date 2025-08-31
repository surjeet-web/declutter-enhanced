#!/bin/bash

echo "Starting Declutter Enhanced..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if package.json exists
if [ ! -f package.json ]; then
    echo "Error: package.json not found"
    echo "Please make sure you're in the correct directory"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d node_modules ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install dependencies"
        exit 1
    fi
fi

# Start the development server
echo "Starting development server..."
echo
echo "The demo will open at: http://localhost:3000/demo.html"
echo "The extension source is at: http://localhost:3000/src/"
echo
echo "Press Ctrl+C to stop the server"
echo

# Try to open browser (works on most systems)
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000/demo.html
elif command -v open &> /dev/null; then
    open http://localhost:3000/demo.html
fi

npm run dev