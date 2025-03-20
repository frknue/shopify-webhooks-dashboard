#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

// Get the path to the binary based on the platform
const getBinaryPath = () => {
  const platform = process.platform;
  const arch = process.arch;
  let binName = "shopify-webhooks-dashboard";

  switch (platform) {
    case "win32":
      binName += ".exe";
      break;
    case "darwin":
      binName += "-darwin";
      if (arch === "arm64") {
        binName += "-arm64";
      }
      break;
    case "linux":
      binName += "-linux";
      if (arch === "arm64") {
        binName += "-arm64";
      }
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  return path.join(__dirname, "dist", binName);
};

// Execute the binary with the provided arguments
const binary = getBinaryPath();
const child = spawn(binary, process.argv.slice(2), {
  stdio: "inherit",
});

child.on("error", (err) => {
  console.error("Failed to start binary:", err);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code);
});
