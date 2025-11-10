const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const FILES = [
  'pricing.js',
  'mcp-client.js',
  'model-data.js',
  'config.js',
  'api-manager.js',
  'wallet-manager.js',
  'wallet-integration.js',
  'account-dropdown.js',
  'onchain-checkin.js',
  'social-tasks.js',
  'bsc-testnet-guide.js',
  'contract-config.js',
  'svg/usdc.svg'
];

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

if (!fs.existsSync(DIST)) {
  console.warn('[copy-static] dist directory not found, skipping copy.');
  process.exit(0);
}

FILES.forEach((relativePath) => {
  const source = path.join(ROOT, relativePath);
  const target = path.join(DIST, relativePath);

  if (!fs.existsSync(source)) {
    console.warn(`[copy-static] source file missing: ${relativePath}`);
    return;
  }

  ensureDir(target);
  fs.copyFileSync(source, target);
  console.log(`[copy-static] copied ${relativePath}`);
});