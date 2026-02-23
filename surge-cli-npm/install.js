#!/usr/bin/env node

const os = require("os");
const fs = require("fs");
const path = require("path");
const https = require("https");
const { execSync } = require("child_process");

const VERSION = "0.1.0";
const REPO = "ankit12301/tvc";
const BASE_URL = `https://github.com/${REPO}/releases/download/v${VERSION}`;

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

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const follow = (url, redirects = 0) => {
      if (redirects > 5) return reject(new Error("Too many redirects"));

      https
        .get(url, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return follow(res.headers.location, redirects + 1);
          }
          if (res.statusCode !== 200) {
            return reject(new Error(`Download failed: HTTP ${res.statusCode}`));
          }

          const file = fs.createWriteStream(dest);
          res.pipe(file);
          file.on("finish", () => file.close(resolve));
          file.on("error", reject);
        })
        .on("error", reject);
    };

    follow(url);
  });
}

async function main() {
  const binaryName = getPlatformBinary();
  const url = `${BASE_URL}/${binaryName}`;
  const binDir = path.join(__dirname, "bin");
  const isWindows = os.platform() === "win32";
  const dest = path.join(binDir, isWindows ? "surge.exe" : "surge");

  if (fs.existsSync(dest)) {
    console.log("surge binary already installed");
    return;
  }

  fs.mkdirSync(binDir, { recursive: true });

  console.log(`Downloading surge v${VERSION} for ${os.platform()}-${os.arch()}...`);
  console.log(`  ${url}`);

  try {
    await download(url, dest);
    if (!isWindows) {
      fs.chmodSync(dest, 0o755);
    }
    console.log("surge installed successfully!");
  } catch (err) {
    console.error(`\nFailed to download surge binary: ${err.message}`);
    console.error(`\nAlternatives:`);
    console.error(`  1. Download manually from: https://github.com/${REPO}/releases`);
    console.error(`  2. Use Docker: docker run equixankit/driftsurge-cli`);
    console.error(`  3. Build from source: cd tvc-go && make build-cli`);
    process.exit(1);
  }
}

main();
