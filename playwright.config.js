// @ts-check
const { defineConfig } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const chromiumLibDir = path.join(
  process.env.HOME || '',
  '.cache',
  'ms-playwright',
  'chromium_headless_shell-1200',
  'chrome-headless-shell-linux64',
);

// WSL等でOS依存ライブラリをroot権限なしで同梱した場合も、Chromium起動時に解決できるようにする。
if (process.platform === 'linux' && fs.existsSync(chromiumLibDir)) {
  process.env.LD_LIBRARY_PATH = [
    chromiumLibDir,
    process.env.LD_LIBRARY_PATH || '',
  ].filter(Boolean).join(':');
}

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  fullyParallel: true,
  reporter: process.env.CI
    ? [['line'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:9080',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    // E2Eテストではtextareaモードをデフォルトにする (WYSIWYGテストは個別に有効化)
    storageState: {
      cookies: [],
      origins: [{
        origin: 'http://127.0.0.1:9080',
        localStorage: [{ name: 'zenwriter-wysiwyg-mode', value: 'false' }],
      }],
    },
  },
  webServer: {
    command: 'node scripts/run-two-servers.js 9080',
    url: 'http://127.0.0.1:9080/index.html',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
