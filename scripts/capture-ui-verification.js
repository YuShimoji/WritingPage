const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const chromiumLibDir = path.join(
  process.env.HOME || '',
  '.cache',
  'ms-playwright',
  'chromium_headless_shell-1200',
  'chrome-headless-shell-linux64',
);
const extractedLibDir = path.join(
  projectRoot,
  '.tmp-playwright-libs',
  'extracted',
  'usr',
  'lib',
  'x86_64-linux-gnu',
);

if (process.platform === 'linux') {
  process.env.LD_LIBRARY_PATH = [
    fs.existsSync(extractedLibDir) ? extractedLibDir : '',
    fs.existsSync(chromiumLibDir) ? chromiumLibDir : '',
    process.env.LD_LIBRARY_PATH || '',
  ].filter(Boolean).join(':');
}

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
    if (a === '--dist') {
      out.mode = 'dist';
      continue;
    }
    if (a === '--project') {
      out.mode = 'project';
      continue;
    }
    if (a === '--build') {
      out.buildFirst = true;
      continue;
    }
  }
  return out;
}

function makeTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function defaultOutDir() {
  return path.join(projectRoot, 'output', 'playwright', `manual-verification-${makeTimestamp()}`);
}

function startStaticServer(rootDir, port) {
  return http.createServer((req, res) => {
    let reqPath = decodeURIComponent((req.url || '/').split('?')[0] || '/');
    let relPath = reqPath.replace(/^[/\\]+/, '');
    if (relPath === '') relPath = 'index.html';
    if (relPath === 'favicon.ico') relPath = 'favicon.svg';
    const filePath = path.resolve(rootDir, relPath);
    if (!filePath.startsWith(rootDir)) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Bad Request');
      return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const mime = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ico': 'image/x-icon',
        '.json': 'application/json; charset=utf-8',
        '.webmanifest': 'application/manifest+json; charset=utf-8',
      };
      res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
      res.end(data);
    });
  }).listen(port, '127.0.0.1');
}

function startProjectServer(port) {
  const serverScript = path.join(__dirname, 'dev-server.js');
  return spawn(process.execPath, [serverScript, '--port', String(port)], {
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
}

function runBuild() {
  return new Promise((resolve, reject) => {
    const buildScript = path.join(__dirname, 'build-dist.js');
    const child = spawn(process.execPath, [buildScript], {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr || `Build failed with exit code ${code}`));
    });
    child.on('error', reject);
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

async function waitForEditableSurface(page, timeout = 15_000) {
  await page.waitForFunction(() => {
    const isVisible = (el) => {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    };

    const textarea = document.querySelector('#editor');
    const wysiwyg = document.querySelector('#wysiwyg-editor');
    return isVisible(textarea) || isVisible(wysiwyg);
  }, { timeout });
}

async function waitForUiSettled(page, timeout = 15_000) {
  await waitForEditableSurface(page, timeout);
  await page.waitForFunction(async () => {
    if (!document.fonts || !document.fonts.ready) return true;
    await document.fonts.ready;
    return true;
  }, { timeout });
}

async function seedEditorContent(page) {
  await page.evaluate(() => {
    const sampleLines = [
      '# 夜明け前のメモ',
      '',
      '雨の匂いがまだ部屋に残っている。',
      '今日は本文エリアとサイドバー導線を確認する。',
      '',
      '## シーン1',
      '主人公は机に向かい、静かに最初の一文を書き始めた。',
    ];
    const textarea = document.querySelector('#editor');
    const wysiwyg = document.querySelector('#wysiwyg-editor');
    const isVisible = (el) => {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    };

    if (isVisible(textarea)) {
      textarea.value = sampleLines.join('\n');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      textarea.scrollTop = 0;
      return;
    }

    if (isVisible(wysiwyg)) {
      wysiwyg.innerHTML = `
        <h1>${sampleLines[0].replace(/^# /, '')}</h1>
        <p>${sampleLines[2]}</p>
        <p>${sampleLines[3]}</p>
        <h2>${sampleLines[5].replace(/^## /, '')}</h2>
        <p>${sampleLines[6]}</p>
      `;
      wysiwyg.dispatchEvent(new Event('input', { bubbles: true }));
      wysiwyg.dispatchEvent(new Event('change', { bubbles: true }));
      wysiwyg.scrollTop = 0;
    }
  });
}

async function stabilizeUiForCapture(page) {
  await page.evaluate(() => {
    if (document.getElementById('codex-capture-style')) return;
    const style = document.createElement('style');
    style.id = 'codex-capture-style';
    style.textContent = `
      body,
      button,
      input,
      select,
      textarea,
      .toolbar,
      .sidebar,
      .modal-dialog,
      .sidebar-control-btn,
      .accordion-header,
      .swiki-root,
      .swiki-root * {
        font-family: var(--font-family), "Noto Serif JP", serif !important;
      }
    `;
    document.head.appendChild(style);
  });
}

async function captureDesktop(baseUrl, outDir) {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await waitForUiSettled(page, 15_000);
    await stabilizeUiForCapture(page);
    await seedEditorContent(page);
    await page.waitForTimeout(400);

    await page.screenshot({
      path: path.join(outDir, '01-main-desktop.png'),
      fullPage: true,
    });

    await page.evaluate(() => {
      if (window.ZenWriterApp && typeof window.ZenWriterApp.openSettingsModal === 'function') {
        window.ZenWriterApp.openSettingsModal();
      }
    });
    await page.waitForSelector('#settings-modal', { state: 'visible' });
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(outDir, '02-settings-modal.png'),
      fullPage: true,
    });
    await page.evaluate(() => {
      const btn = document.getElementById('close-settings-modal');
      if (btn) btn.click();
    });
    await page.waitForTimeout(150);

    await page.evaluate(() => {
      if (window.ZenWriterApp && typeof window.ZenWriterApp.openHelpModal === 'function') {
        window.ZenWriterApp.openHelpModal();
      }
    });
    await page.waitForSelector('#help-modal', { state: 'visible' });
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(outDir, '03-help-modal.png'),
      fullPage: true,
    });
    await page.evaluate(() => {
      const btn = document.getElementById('close-help-modal');
      if (btn) btn.click();
    });
    await page.waitForTimeout(150);

    await page.evaluate(() => {
      const sidebarToggle = document.getElementById('toggle-sidebar');
      if (sidebarToggle) sidebarToggle.click();
    });
    await page.waitForTimeout(250);

    await page.evaluate(() => {
      const btn = document.querySelector('.accordion-category[data-category="edit"] .accordion-header');
      if (btn) btn.click();
    });
    await page.waitForTimeout(350);
    await page.screenshot({
      path: path.join(outDir, '04-sidebar-desktop-open.png'),
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
    await waitForUiSettled(mobilePage, 15_000);
    await stabilizeUiForCapture(mobilePage);
    await seedEditorContent(mobilePage);
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
  const mode = args.mode || 'project';
  fs.mkdirSync(outDir, { recursive: true });

  if (args.buildFirst) {
    await runBuild();
  }

  const rootDir = mode === 'dist' ? path.join(projectRoot, 'dist') : projectRoot;
  if (!fs.existsSync(path.join(rootDir, 'index.html'))) {
    throw new Error(`index.html not found under ${rootDir}`);
  }

  const server = mode === 'dist'
    ? startStaticServer(rootDir, port)
    : startProjectServer(port);

  if (typeof server.stdout?.on === 'function') server.stdout.on('data', () => {});
  if (typeof server.stderr?.on === 'function') server.stderr.on('data', () => {});

  try {
    const baseUrl = `http://127.0.0.1:${port}`;
    await waitForReady(`${baseUrl}/index.html`);
    await captureDesktop(baseUrl, outDir);

    const manifest = {
      createdAt: new Date().toISOString(),
      baseUrl,
      mode,
      rootDir,
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
    if (typeof server.close === 'function') {
      await new Promise((resolve) => server.close(resolve));
      return;
    }
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
