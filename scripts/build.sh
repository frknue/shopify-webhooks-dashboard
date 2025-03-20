#!/bin/bash
set -e

# Build the React web UI
echo "Building the web UI with Vite..."
cd ../web
npm install
npm run build --emptyOutDir

# Build the Go CLI
echo "Building the Go CLI..."
cd ../cli
go build -o shopify-webhooks-dashboard

echo "Build complete. The binary is located at: $(pwd)/shopify-webhooks-dashboard"
