// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests/e2e',
  timeout: 45 * 1000,
  expect: { timeout: 5000 },
  reporter: 'list',
  retries: 1,
  use: {
    baseURL: 'http://127.0.0.1:8099',
    headless: true,
    acceptDownloads: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'node scripts/dev-server.js --port 8099',
    url: 'http://127.0.0.1:8099',
    reuseExistingServer: !process.env.CI,
    timeout: 30 * 1000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
