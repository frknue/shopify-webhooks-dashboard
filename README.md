# Shopify Webhooks Dashboard

A CLI tool for managing Shopify webhooks with an integrated web dashboard.

## Disclaimer

This tool is a third-party utility and is not affiliated with, officially maintained by, or in any way officially connected with Shopify Inc. or any of its subsidiaries or affiliates. The official Shopify website can be found at [www.shopify.com](https://www.shopify.com).

The names "Shopify" and "Shopify Webhooks" as well as related names, marks, emblems, and images are registered trademarks of their respective owners.

## Installation

```bash
npm install -g shopify-webhooks-dashboard
```

## Features

- Cross-platform support (Windows, macOS, Linux)
- ARM64 architecture support for macOS and Linux
- Web-based dashboard interface for webhook management

## System Requirements

- Node.js (latest LTS version recommended)
- Supported platforms:
  - Windows
  - macOS (Intel and Apple Silicon)
  - Linux (x64 and ARM64)

## Usage

You can run the CLI directly using `npx` without installation:

```bash
npx shopify-webhooks-dashboard --store <store> --api-key <api-key>
```

### Required Flags:

- `--store`: Your Shopify store domain (e.g., mystore.myshopify.com)
- `--api-key`: Your Shopify Admin API access token

### API Access Token Configuration

Your Shopify Admin API access token needs to have access to the resource you want to create webhooks for. For example:

- To create a webhook for products, you need `read_products`
- To create a webhook for orders, you need `read_orders`
- To create a webhook for customers, you need `read_customers`

To get an access token with the required scopes:

1. Go to your Shopify admin panel
2. Navigate to Settings > Apps and sales channels
3. Click on "Develop apps"
4. Create a new app or select an existing one
5. Configure the required scopes for your webhooks under "Configuration"
6. Install the app in your store
7. Get the Admin API access token from the app settings

Example:

```bash
npx shopify-webhooks-dashboard --store mystore.myshopify.com --api-key shpat_xxxxxxxxxxxxxxxxxxxx
```

When you run the command with the required flags, the CLI will:

1. Start a local server on port 3000
2. Automatically open your default web browser to the dashboard
3. Allow you to manage your Shopify webhooks through the web interface

### Notes:

- The API key should be an Admin API access token from your Shopify store
- The dashboard uses Shopify's Admin API version 2024-10
- All webhook management operations (create, list, delete) are performed through the web interface

## Project Structure

```bash
npm install
```

## Development

### Prerequisites

- Go (1.23.3 or later)
- Node.js (latest LTS version recommended)

### Local Development Setup

1. Clone the repository
2. Run the build script:

   ```bash
   ./scripts/build.sh
   ```

   This script will:

   - Build the Go binary
   - Build the web dashboard
   - Set up the development environment

3. For web dashboard development:
   ```bash
   cd web
   npm install
   npm run dev
   ```

### Project Structure

## License

MIT © frknue

## Author

frknue
