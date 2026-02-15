const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const { chromium } = require('@playwright/test');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--port' || a === '-p') {
      const p = parseInt(args[i + 1], 10);
      if (!Number.isNaN(p) && p > 0) out.port = p;
      i += 1;
      continue;
    }
    if (a.startsWith('--port=')) {
      const p = parseInt(a.split('=')[1], 10);
      if (!Number.isNaN(p) && p > 0) out.port = p;
      continue;
    }
    if (a === '--out') {
      out.outDir = args[i + 1];
      i += 1;
      continue;
    }
    if (a.startsWith('--out=')) {
      out.outDir = a.split('=')[1];
      continue;
    }
  }
  return out;
}

function makeTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function defaultOutDir() {
  return path.join(__dirname, '..', 'test-artifacts', 'ui-verification', makeTimestamp());
}

function startDevServer(port) {
  const serverScript = path.join(__dirname, 'dev-server.js');
  return spawn(process.execPath, [serverScript, '--port', String(port)], {
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
}

function waitForReady(url, timeoutMs = 30_000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      http
        .get(url, (res) => {
          if (res.statusCode === 200) {
            res.resume();
            resolve();
            return;
          }
          res.resume();
          retry();
        })
        .on('error', retry);
    };

    const retry = () => {
      if (Date.now() - start >= timeoutMs) {
        reject(new Error(`Timed out waiting for server: ${url}`));
        return;
      }
      setTimeout(tryOnce, 250);
    };

    tryOnce();
  });
}

async function captureDesktop(baseUrl, outDir) {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#editor', { timeout: 15_000 });
    await page.waitForTimeout(400);

    await page.screenshot({
      path: path.join(outDir, '01-main-desktop.png'),
      fullPage: true,
    });

    await page.click('#toggle-settings');
    await page.waitForSelector('#settings-modal', { state: 'visible' });
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(outDir, '02-settings-modal.png'),
      fullPage: true,
    });
    await page.click('#close-settings-modal');
    await page.waitForTimeout(150);

    await page.click('#toggle-help-modal');
    await page.waitForSelector('#help-modal', { state: 'visible' });
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(outDir, '03-help-modal.png'),
      fullPage: true,
    });
    await page.click('#close-help-modal');
    await page.waitForTimeout(150);

    const wikiTab = page.locator('.sidebar-tab[data-tab="wiki"]');
    if ((await wikiTab.count()) > 0) {
      await wikiTab.first().click();
      await page.waitForTimeout(200);
    }
    await page.screenshot({
      path: path.join(outDir, '04-wiki-tab.png'),
      fullPage: true,
    });

    await page.evaluate(() => {
      if (window.commandPalette && typeof window.commandPalette.toggle === 'function') {
        window.commandPalette.toggle();
      }
    });
    await page.waitForSelector('#command-palette', { state: 'visible' });
    await page.waitForTimeout(100);
    await page.screenshot({
      path: path.join(outDir, '05-command-palette.png'),
      fullPage: true,
    });

    await context.close();

    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobile.newPage();
    await mobilePage.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForSelector('#editor', { timeout: 15_000 });
    await mobilePage.waitForTimeout(300);
    await mobilePage.click('#toggle-sidebar');
    await mobilePage.waitForTimeout(250);
    await mobilePage.screenshot({
      path: path.join(outDir, '06-mobile-sidebar-open.png'),
      fullPage: true,
    });
    await mobile.close();
  } finally {
    await browser.close();
  }
}

async function main() {
  const args = parseArgs();
  const port = args.port || 19080;
  const outDir = path.resolve(args.outDir || defaultOutDir());
  fs.mkdirSync(outDir, { recursive: true });

  const server = startDevServer(port);
  server.stdout.on('data', () => {});
  server.stderr.on('data', () => {});

  try {
    const baseUrl = `http://127.0.0.1:${port}`;
    await waitForReady(`${baseUrl}/index.html`);
    await captureDesktop(baseUrl, outDir);

    const manifest = {
      createdAt: new Date().toISOString(),
      baseUrl,
      screenshots: fs
        .readdirSync(outDir)
        .filter((name) => name.endsWith('.png'))
        .sort(),
    };
    fs.writeFileSync(
      path.join(outDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf8',
    );

    console.log(`UI verification screenshots saved to: ${outDir}`);
    console.log(manifest.screenshots.join('\n'));
  } finally {
    if (!server.killed) {
      try {
        server.kill('SIGINT');
      } catch (_) {
        try {
          server.kill();
        } catch (_) {
          // Ignore cleanup errors.
        }
      }
    }
  }
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exitCode = 1;
});
