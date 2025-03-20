#!/bin/bash
set -e

# Build the React web UI
echo "Building the web UI with Vite..."
cd ../web
npm install
npm run build --emptyOutDir

# Build the Go CLI for multiple platforms
echo "Building the Go CLI for multiple platforms..."
cd ../cli

# Create dist directory if it doesn't exist
mkdir -p ../dist

# Build for Windows (amd64)
echo "Building for Windows (amd64)..."
GOOS=windows GOARCH=amd64 go build -o ../dist/shopify-webhooks-dashboard.exe

# Build for macOS (Intel)
echo "Building for macOS (amd64)..."
GOOS=darwin GOARCH=amd64 go build -o ../dist/shopify-webhooks-dashboard-darwin

# Build for macOS (Apple Silicon)
echo "Building for macOS (arm64)..."
GOOS=darwin GOARCH=arm64 go build -o ../dist/shopify-webhooks-dashboard-darwin-arm64

# Build for Linux (amd64)
echo "Building for Linux (amd64)..."
GOOS=linux GOARCH=amd64 go build -o ../dist/shopify-webhooks-dashboard-linux

# Build for Linux (arm64)
echo "Building for Linux (arm64)..."
GOOS=linux GOARCH=arm64 go build -o ../dist/shopify-webhooks-dashboard-linux-arm64

echo "Build complete! Binaries are available in the dist directory:"
ls -l ../dist
