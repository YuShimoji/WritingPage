/**
 * 全機能UIキャプチャスクリプト
 * 既存の capture-ui-verification.js を拡張し、より多くの画面を取得する。
 *
 * 使い方:
 *   node scripts/capture-full-showcase.js
 *   node scripts/capture-full-showcase.js --port 19090 --out output/showcase
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const projectRoot = path.join(__dirname, '..');

let chromium;
try {
  ({ chromium } = require('@playwright/test'));
} catch {
  ({ chromium } = require('playwright'));
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if ((a === '--port' || a === '-p') && args[i + 1]) {
      out.port = parseInt(args[i + 1], 10);
      i += 1;
    } else if (a === '--out' && args[i + 1]) {
      out.outDir = args[i + 1];
      i += 1;
    }
  }
  return out;
}

function startStaticServer(rootDir, port) {
  return http.createServer((req, res) => {
    let reqPath = decodeURIComponent((req.url || '/').split('?')[0] || '/');
    let relPath = reqPath.replace(/^[/\\]+/, '');
    if (relPath === '') relPath = 'index.html';
    if (relPath === 'favicon.ico') relPath = 'favicon.svg';
    const filePath = path.resolve(rootDir, relPath);
    if (!filePath.startsWith(rootDir)) {
      res.writeHead(400); res.end('Bad Request'); return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not Found'); return; }
      const ext = path.extname(filePath).toLowerCase();
      const mime = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.svg': 'image/svg+xml', '.png': 'image/png',
        '.jpg': 'image/jpeg', '.gif': 'image/gif',
        '.woff': 'font/woff', '.woff2': 'font/woff2',
        '.json': 'application/json; charset=utf-8',
        '.webmanifest': 'application/manifest+json; charset=utf-8',
      };
      res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
      res.end(data);
    });
  }).listen(port, '127.0.0.1');
}

function waitForReady(url, timeoutMs = 30_000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      http.get(url, (res) => {
        if (res.statusCode === 200) { res.resume(); resolve(); return; }
        res.resume(); retry();
      }).on('error', retry);
    };
    const retry = () => {
      if (Date.now() - start >= timeoutMs) { reject(new Error('Timeout')); return; }
      setTimeout(tryOnce, 300);
    };
    tryOnce();
  });
}

async function waitForUiSettled(page, timeout = 15_000) {
  await page.waitForFunction(() => {
    const isVisible = (el) => {
      if (!el) return false;
      const s = window.getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
    };
    return isVisible(document.querySelector('#editor')) || isVisible(document.querySelector('#wysiwyg-editor'));
  }, { timeout });
  await page.waitForFunction(async () => {
    if (!document.fonts || !document.fonts.ready) return true;
    await document.fonts.ready;
    return true;
  }, { timeout });
}

async function stabilize(page) {
  await page.evaluate(() => {
    if (document.getElementById('codex-capture-style')) return;
    const style = document.createElement('style');
    style.id = 'codex-capture-style';
    style.textContent = `
      body, button, input, select, textarea, .toolbar, .sidebar,
      .modal-dialog, .sidebar-control-btn, .accordion-header,
      .swiki-root, .swiki-root * {
        font-family: var(--font-family), "Noto Serif JP", serif !important;
      }
    `;
    document.head.appendChild(style);
  });
}

async function seedContent(page) {
  await page.evaluate(() => {
    const content = [
      '# 全機能ショーケース',
      '',
      '## 基本テキスト',
      '',
      '普通の段落テキストです。**太字**と*斜体*と~~取り消し線~~を含みます。',
      '',
      '> 引用ブロックのテスト。',
      '',
      '### リスト',
      '',
      '- 項目A',
      '- 項目B',
      '  - ネスト項目',
      '',
      '## 日本語組版',
      '',
      '{漢字|かんじ}のルビ表示テスト。{kenten|傍点}の表示テスト。',
      '',
      '## テキストボックス',
      '',
      ':::zw-textbox{preset:"dialogue"}',
      '「テキストボックスのプリセット確認」',
      ':::',
      '',
      ':::zw-textbox{preset:"monologue"}',
      'これは内面描写のプリセットです。',
      ':::',
      '',
      '## 長文テスト',
      '',
      '彼女は窓辺に立ち、雨の降りしきる街を見下ろしていた。灰色の空から落ちてくる雨粒は、アスファルトに小さな波紋を作っては消えていく。',
    ].join('\n');

    const textarea = document.querySelector('#editor');
    const wysiwyg = document.querySelector('#wysiwyg-editor');
    const isVisible = (el) => {
      if (!el) return false;
      const s = window.getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
    };
    if (isVisible(textarea)) {
      textarea.value = content;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      textarea.scrollTop = 0;
    } else if (isVisible(wysiwyg)) {
      wysiwyg.innerHTML = `
        <h1>全機能ショーケース</h1>
        <h2>基本テキスト</h2>
        <p>普通の段落テキストです。<strong>太字</strong>と<em>斜体</em>と<s>取り消し線</s>を含みます。</p>
        <blockquote><p>引用ブロックのテスト。</p></blockquote>
        <h3>リスト</h3>
        <ul><li>項目A</li><li>項目B<ul><li>ネスト項目</li></ul></li></ul>
        <h2>日本語組版</h2>
        <p>ルビ表示テスト。傍点の表示テスト。</p>
        <h2>テキストボックス</h2>
        <div class="zw-textbox" data-preset="dialogue"><p>「テキストボックスのプリセット確認」</p></div>
        <div class="zw-textbox" data-preset="monologue"><p>これは内面描写のプリセットです。</p></div>
        <h2>長文テスト</h2>
        <p>彼女は窓辺に立ち、雨の降りしきる街を見下ろしていた。灰色の空から落ちてくる雨粒は、アスファルトに小さな波紋を作っては消えていく。</p>
      `;
      wysiwyg.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
}

async function _safeClick(page, selector, timeout = 3000) {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout });
    await page.click(selector);
    return true;
  } catch {
    return false;
  }
}

async function safeEvalClick(page, evalFn) {
  try {
    await page.evaluate(evalFn);
    return true;
  } catch {
    return false;
  }
}

async function captureAll(baseUrl, outDir) {
  const browser = await chromium.launch({ headless: true });
  const shots = [];
  const shot = async (page, name) => {
    const p = path.join(outDir, name);
    await page.screenshot({ path: p, fullPage: false });
    shots.push(name);
    console.log(`  [OK] ${name}`);
  };

  try {
    // === Desktop (1440x900) ===
    console.log('--- Desktop 1440x900 ---');
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${baseUrl}/?reset=1`, { waitUntil: 'domcontentloaded' });
    await waitForUiSettled(page);
    await stabilize(page);
    await seedContent(page);
    await page.waitForTimeout(500);

    // 01: メイン画面
    await shot(page, '01-main-desktop.png');

    // サイドバーを開く
    await safeEvalClick(page, () => {
      const btn = document.getElementById('toggle-sidebar');
      if (btn) btn.click();
    });
    await page.waitForTimeout(400);

    // サイドバー要素のスクリーンショットを撮るヘルパー
    const shotSidebar = async (pg, name) => {
      const sidebar = await pg.$('.sidebar');
      if (sidebar) {
        const p = path.join(outDir, name);
        await sidebar.screenshot({ path: p });
        shots.push(name);
        console.log(`  [OK] ${name}`);
      } else {
        await shot(pg, name); // フォールバック
      }
    };

    // ヘルパー: evaluate で全閉じ→対象だけ開く（ガジェット初期化含む）
    const openCategory = async (catId) => {
      await page.evaluate((id) => {
        // 全カテゴリを閉じる（aria-expanded + maxHeight + display）
        document.querySelectorAll('.accordion-header[aria-expanded="true"]').forEach((h) => {
          h.setAttribute('aria-expanded', 'false');
          const cId = h.getAttribute('aria-controls');
          const c = cId ? document.getElementById(cId) : null;
          if (c) { c.style.maxHeight = '0px'; c.setAttribute('aria-hidden', 'true'); }
        });
        // 対象のヘッダーをクリック（SidebarManager の click handler が発火する）
        const target = document.querySelector(`[aria-controls="accordion-${id}"]`);
        if (target) target.click();
      }, catId);
      await page.waitForTimeout(600);
    };

    // 02: サイドバー (structure)
    await openCategory('structure');
    await shotSidebar(page, '02-sidebar-structure.png');

    // 03: サイドバー (edit)
    await openCategory('edit');
    await shotSidebar(page, '03-sidebar-edit.png');

    // 04: サイドバー (theme)
    await openCategory('theme');
    await shotSidebar(page, '04-sidebar-theme.png');

    // 05: サイドバー (assist)
    await openCategory('assist');
    await shotSidebar(page, '05-sidebar-assist.png');

    // 06: サイドバー (advanced)
    await openCategory('advanced');
    await shotSidebar(page, '06-sidebar-advanced.png');

    // サイドバー閉じる
    await safeEvalClick(page, () => {
      const btn = document.getElementById('toggle-sidebar');
      if (btn) btn.click();
    });
    await page.waitForTimeout(200);

    // 07: 設定モーダル
    await safeEvalClick(page, () => {
      const btn = document.getElementById('toggle-settings');
      if (btn) btn.click();
    });
    await page.waitForSelector('#settings-modal', { state: 'visible', timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(300);
    await shot(page, '07-settings-modal.png');
    await safeEvalClick(page, () => {
      const btn = document.getElementById('close-settings-modal');
      if (btn) btn.click();
    });
    await page.waitForTimeout(200);

    // 08: ヘルプモーダル
    await safeEvalClick(page, () => {
      const btn = document.getElementById('toggle-help-modal');
      if (btn) btn.click();
    });
    await page.waitForSelector('#help-modal', { state: 'visible', timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(300);
    await shot(page, '08-help-modal.png');
    await safeEvalClick(page, () => {
      const btn = document.getElementById('close-help-modal');
      if (btn) btn.click();
    });
    await page.waitForTimeout(200);

    // 09: コマンドパレット
    await safeEvalClick(page, () => {
      if (window.commandPalette && typeof window.commandPalette.toggle === 'function') {
        window.commandPalette.toggle();
      }
    });
    await page.waitForSelector('#command-palette', { state: 'visible', timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(200);
    await shot(page, '09-command-palette.png');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // 10: Light テーマ
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      // CSS変数もlight用に更新
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    });
    await page.waitForTimeout(500);
    await shot(page, '10-theme-light.png');

    // 11: Sepia テーマ
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'sepia');
    });
    await page.waitForTimeout(500);
    await shot(page, '11-theme-sepia.png');

    // 12: Night テーマ
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'night');
    });
    await page.waitForTimeout(500);
    await shot(page, '12-theme-night.png');

    // Dark に戻す
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(300);

    // 13: Focus モード (evaluate で直接切替)
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-ui-mode', 'focus');
    });
    await page.waitForTimeout(500);
    await shot(page, '13-focus-mode.png');

    // 14: Normal に戻す
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-ui-mode', 'normal');
    });
    await page.waitForTimeout(300);

    // 15: Blank モード
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-ui-mode', 'blank');
    });
    await page.waitForTimeout(500);
    await shot(page, '15-blank-mode.png');

    // Normal に戻す
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-ui-mode', 'normal');
    });
    await page.waitForTimeout(300);

    // 16: エディタ Normal
    await shot(page, '16-editor-normal.png');

    await ctx.close();

    // === Mobile (390x844) ===
    console.log('--- Mobile 390x844 ---');
    const mCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    });
    const mp = await mCtx.newPage();
    await mp.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await waitForUiSettled(mp);
    await stabilize(mp);
    await seedContent(mp);
    await mp.waitForTimeout(400);

    // 17: モバイルメイン
    await shot(mp, '17-mobile-main.png');

    // 18: モバイルサイドバー
    await mp.click('#toggle-sidebar');
    await mp.waitForTimeout(300);
    await shot(mp, '18-mobile-sidebar.png');

    await mCtx.close();

    // === Reader Preview ===
    console.log('--- Reader Preview ---');
    const rCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const rp = await rCtx.newPage();
    await rp.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await waitForUiSettled(rp);
    await stabilize(rp);
    await seedContent(rp);
    await rp.waitForTimeout(500);

    // Reader モードへ遷移 (ZWReaderPreview.enter() を使用)
    await rp.evaluate(() => {
      if (window.ZWReaderPreview && typeof window.ZWReaderPreview.enter === 'function') {
        window.ZWReaderPreview.enter();
      }
    });
    await rp.waitForTimeout(1000);

    // 19: Reader Preview
    await shot(rp, '19-reader-preview.png');

    await rCtx.close();

  } finally {
    await browser.close();
  }

  return shots;
}

async function main() {
  const args = parseArgs();
  const port = args.port || 19090;
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outDir = path.resolve(args.outDir || path.join(projectRoot, 'output', 'showcase', `full-${ts}`));
  fs.mkdirSync(outDir, { recursive: true });

  const server = startStaticServer(projectRoot, port);
  try {
    const baseUrl = `http://127.0.0.1:${port}`;
    await waitForReady(`${baseUrl}/index.html`);
    console.log(`Server ready at ${baseUrl}`);

    const screenshots = await captureAll(baseUrl, outDir);

    const manifest = {
      createdAt: new Date().toISOString(),
      baseUrl,
      mode: 'project',
      screenshots,
      description: 'Full feature showcase capture',
    };
    fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`\nAll screenshots saved to: ${outDir}`);
    console.log(`Total: ${screenshots.length} screenshots`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exitCode = 1;
});
