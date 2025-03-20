#!/usr/bin/env node

const https = require("https");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const stream = require("stream");
const { mkdir } = require("fs/promises");

const pipeline = promisify(stream.pipeline);

// Configuration
const BINARY_NAME = "shopify-webhooks-dashboard";
const VERSION = "1.0.0";
const GITHUB_OWNER = "frknue";
const GITHUB_REPO = "shopify-webhooks-dashboard";

async function getBinaryUrl() {
  const platform = process.platform;
  const arch = process.arch;

  let binaryName = BINARY_NAME;

  // Adjust binary name based on platform
  switch (platform) {
    case "win32":
      binaryName += ".exe";
      break;
    case "darwin":
      binaryName = `${BINARY_NAME}-darwin`;
      break;
    case "linux":
      binaryName = `${BINARY_NAME}-linux`;
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  // Add architecture suffix if needed
  if (arch === "arm64") {
    binaryName += "-arm64";
  }

  // Construct the download URL - adjust this to match your actual release URL structure
  return `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/v${VERSION}/${binaryName}`;
}

async function downloadFile(url, destPath) {
  console.log(`Downloading from: ${url}`);
  console.log(`Saving to: ${destPath}`);

  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        downloadFile(response.headers.location, destPath)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(destPath);
      pipeline(response, fileStream)
        .then(() => {
          // Make the binary executable on Unix-like systems
          if (process.platform !== "win32") {
            fs.chmodSync(destPath, "755");
          }
          resolve();
        })
        .catch(reject);
    });

    request.on("error", reject);
  });
}

async function main() {
  try {
    // Create dist directory if it doesn't exist
    const distPath = path.join(__dirname, "..", "dist");
    await mkdir(distPath, { recursive: true });

    // Get the appropriate binary URL for the current platform
    const binaryUrl = await getBinaryUrl();

    // Determine the binary name and path
    const binaryName =
      process.platform === "win32" ? `${BINARY_NAME}.exe` : BINARY_NAME;
    const binaryPath = path.join(distPath, binaryName);

    // Download the binary
    await downloadFile(binaryUrl, binaryPath);

    console.log("Binary downloaded successfully!");
  } catch (error) {
    console.error("Error downloading binary:", error.message);
    process.exit(1);
  }
}

main();
