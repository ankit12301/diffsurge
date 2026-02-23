#!/usr/bin/env node

const os = require("os");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function getPlatformBinary() {
  const platform = os.platform();
  const arch = os.arch();

  const mapping = {
    "darwin-x64": "surge-darwin-amd64",
    "darwin-arm64": "surge-darwin-arm64",
    "linux-x64": "surge-linux-amd64",
    "linux-arm64": "surge-linux-arm64",
    "win32-x64": "surge-windows-amd64.exe",
  };

  const key = `${platform}-${arch}`;
  const binary = mapping[key];

  if (!binary) {
    console.error(
      `Unsupported platform: ${platform}-${arch}\n` +
        `Supported: ${Object.keys(mapping).join(", ")}\n` +
        `You can use Docker instead: docker run equixankit/driftsurge-cli`
    );
    process.exit(1);
  }

  return binary;
}

function main() {
  const binaryName = getPlatformBinary();
  const isWindows = os.platform() === "win32";
  const binDir = path.join(__dirname, "bin");
  const dest = path.join(binDir, isWindows ? "surge.exe" : "surge");

  if (fs.existsSync(dest)) {
    return;
  }

  const gzPath = path.join(__dirname, "binaries", `${binaryName}.gz`);

  if (!fs.existsSync(gzPath)) {
    console.error(`Binary not found: ${gzPath}`);
    console.error(`Use Docker instead: docker run equixankit/driftsurge-cli`);
    process.exit(1);
  }

  fs.mkdirSync(binDir, { recursive: true });

  console.log(`Installing surge for ${os.platform()}-${os.arch()}...`);

  const compressed = fs.readFileSync(gzPath);
  const decompressed = zlib.gunzipSync(compressed);
  fs.writeFileSync(dest, decompressed);

  if (!isWindows) {
    fs.chmodSync(dest, 0o755);
  }

  console.log("surge installed successfully!");
}

main();
