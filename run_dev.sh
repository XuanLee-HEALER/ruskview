#!/bin/bash
echo "Building Ruskview..."

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install
fi

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "Error: Rust (cargo) is not installed."
    exit 1
fi

# Run Tauri dev mode
echo "Starting Tauri development server..."
npm run tauri dev
