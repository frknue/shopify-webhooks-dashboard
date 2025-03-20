#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

// Get the path to the binary based on the platform
const getBinaryPath = () => {
  const platform = process.platform;
  const binName =
    platform === "win32"
      ? "shopify-webhooks-dashboard.exe"
      : "shopify-webhooks-dashboard";
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
