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

async function waitForSidebarCategory(page, categoryId) {
  await page.waitForFunction((id) => {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById(`accordion-${id}`);
    return !!(sidebar && content) &&
      document.documentElement.getAttribute('data-left-nav-state') === 'category' &&
      document.documentElement.getAttribute('data-left-nav-active') === id &&
      sidebar.classList.contains('open') &&
      content.getAttribute('aria-hidden') === 'false' &&
      content.hidden === false;
  }, categoryId, { timeout: 10_000 });
}

async function openSidebarCategory(page, categoryId) {
  await page.evaluate((id) => {
    if (window.sidebarManager && typeof window.sidebarManager.activateSidebarGroup === 'function') {
      window.sidebarManager.activateSidebarGroup(id);
      return;
    }
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.add('open');
    document.documentElement.setAttribute('data-left-nav-state', 'category');
    document.documentElement.setAttribute('data-left-nav-active', id);
    const target = document.querySelector(`[aria-controls="accordion-${id}"]`);
    if (target) target.click();
  }, categoryId);
  await waitForSidebarCategory(page, categoryId);
}

async function returnLeftNavRoot(page) {
  await page.evaluate(() => {
    if (window.sidebarManager && typeof window.sidebarManager.returnToLeftNavRoot === 'function') {
      window.sidebarManager.returnToLeftNavRoot();
      return;
    }
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');
    document.documentElement.setAttribute('data-left-nav-state', 'root');
    document.documentElement.removeAttribute('data-left-nav-active');
  });
  await page.waitForTimeout(200);
}

async function openCurrentSettingsRoute(page) {
  await page.evaluate(() => {
    if (window.ZenWriterApp && typeof window.ZenWriterApp.openSettingsModal === 'function') {
      window.ZenWriterApp.openSettingsModal();
      return;
    }
    if (window.sidebarManager && typeof window.sidebarManager.activateSidebarGroup === 'function') {
      window.sidebarManager.activateSidebarGroup('advanced');
    }
  });
  await waitForSidebarCategory(page, 'advanced');
}

async function openDesignCockpit(page) {
  await page.waitForFunction(() => {
    return !!(window.ZWDesignCockpit && typeof window.ZWDesignCockpit.open === 'function');
  }, { timeout: 10_000 });
  await page.evaluate(() => {
    window.ZWDesignCockpit.open();
  });
  await page.waitForFunction(() => {
    const panel = document.getElementById('design-cockpit');
    if (!panel) return false;
    const style = window.getComputedStyle(panel);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }, { timeout: 10_000 });
}

async function readShowcaseState(page, kind) {
  return page.evaluate((readKind) => {
    const visible = (el) => {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    };
    const legacyModal = document.getElementById('settings-modal');
    const cockpit = document.getElementById('design-cockpit');
    const summary = document.getElementById('design-cockpit-summary');
    const cockpitText = cockpit ? cockpit.textContent || '' : '';
    const summaryText = summary ? summary.textContent || '' : '';
    const fixtureLeakPattern = /全機能ショーケース|普通の段落テキスト|彼女は窓辺に立ち/;
    return {
      kind: readKind,
      uiMode: document.documentElement.getAttribute('data-ui-mode') || '',
      leftNavState: document.documentElement.getAttribute('data-left-nav-state') || '',
      leftNavActive: document.documentElement.getAttribute('data-left-nav-active') || '',
      legacySettingsModalVisible: visible(legacyModal),
      designCockpitVisible: visible(cockpit),
      designCockpitPrivacyMarker: summaryText.includes('manuscript_content=copied_never'),
      designCockpitPanelContainsFixtureText: fixtureLeakPattern.test(cockpitText),
      designCockpitSummaryContainsFixtureText: fixtureLeakPattern.test(summaryText),
    };
  }, kind);
}

function assertShowcaseReadback(readback) {
  if (!readback || typeof readback !== 'object') {
    throw new Error('Missing showcase readback');
  }
  if (readback.kind === 'settings_route' &&
      (readback.leftNavActive !== 'advanced' || readback.legacySettingsModalVisible)) {
    throw new Error(`Current settings route did not resolve to advanced sidebar: ${JSON.stringify(readback)}`);
  }
  if (readback.kind === 'design_cockpit') {
    if (!readback.designCockpitVisible || !readback.designCockpitPrivacyMarker) {
      throw new Error(`Design Cockpit showcase readback failed: ${JSON.stringify(readback)}`);
    }
    if (readback.designCockpitPanelContainsFixtureText || readback.designCockpitSummaryContainsFixtureText) {
      throw new Error('Design Cockpit showcase readback exposed fixture manuscript text');
    }
  }
  if (readback.kind === 'mobile_sidebar' && readback.leftNavState !== 'category') {
    throw new Error(`Mobile sidebar did not open through current route: ${JSON.stringify(readback)}`);
  }
}

async function captureAll(baseUrl, outDir) {
  const browser = await chromium.launch({ headless: true });
  const shots = [];
  const readbacks = [];
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
      await openSidebarCategory(page, catId);
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

    await returnLeftNavRoot(page);

    // 07: 現行設定入口（旧 settings-modal ではなく advanced sidebar）
    await openCurrentSettingsRoute(page);
    await page.waitForTimeout(300);
    const settingsReadback = await readShowcaseState(page, 'settings_route');
    assertShowcaseReadback(settingsReadback);
    readbacks.push(settingsReadback);
    await shot(page, '07-settings-advanced-route.png');
    await returnLeftNavRoot(page);

    // 08: Design Cockpit
    await openDesignCockpit(page);
    await page.waitForTimeout(200);
    const cockpitReadback = await readShowcaseState(page, 'design_cockpit');
    assertShowcaseReadback(cockpitReadback);
    readbacks.push(cockpitReadback);
    await shot(page, '08-design-cockpit.png');
    await page.evaluate(() => {
      if (window.ZWDesignCockpit && typeof window.ZWDesignCockpit.close === 'function') {
        window.ZWDesignCockpit.close();
      }
    });
    await page.waitForTimeout(200);

    // 09: ヘルプモーダル
    await safeEvalClick(page, () => {
      if (window.ZenWriterApp && typeof window.ZenWriterApp.openHelpModal === 'function') {
        window.ZenWriterApp.openHelpModal();
      }
    });
    await page.waitForSelector('#help-modal', { state: 'visible', timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(300);
    await shot(page, '09-help-modal.png');
    await safeEvalClick(page, () => {
      const btn = document.getElementById('close-help-modal');
      if (btn) btn.click();
    });
    await page.waitForTimeout(200);

    // 10: コマンドパレット
    await safeEvalClick(page, () => {
      if (window.commandPalette && typeof window.commandPalette.toggle === 'function') {
        window.commandPalette.toggle();
      }
    });
    await page.waitForSelector('#command-palette', { state: 'visible', timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(200);
    await shot(page, '10-command-palette.png');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // 11: Light テーマ
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      // CSS変数もlight用に更新
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    });
    await page.waitForTimeout(500);
    await shot(page, '11-theme-light.png');

    // 12: Sepia テーマ
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'sepia');
    });
    await page.waitForTimeout(500);
    await shot(page, '12-theme-sepia.png');

    // 13: Night テーマ
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'night');
    });
    await page.waitForTimeout(500);
    await shot(page, '13-theme-night.png');

    // Dark に戻す
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(300);

    // 14: Focus 互換状態
    await page.evaluate(() => {
      if (window.ZenWriterApp && typeof window.ZenWriterApp.setUIMode === 'function') {
        window.ZenWriterApp.setUIMode('focus');
      }
    });
    await page.waitForTimeout(500);
    await shot(page, '14-focus-compat.png');

    // 15: Normal shell に戻す
    await page.evaluate(() => {
      if (window.ZenWriterApp && typeof window.ZenWriterApp.setUIMode === 'function') {
        window.ZenWriterApp.setUIMode('normal');
      }
    });
    await page.waitForTimeout(500);
    await shot(page, '15-normal-shell.png');

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
    await openSidebarCategory(mp, 'structure');
    const mobileReadback = await readShowcaseState(mp, 'mobile_sidebar');
    assertShowcaseReadback(mobileReadback);
    readbacks.push(mobileReadback);
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

  return { shots, readbacks };
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

    const { shots: screenshots, readbacks } = await captureAll(baseUrl, outDir);

    const manifest = {
      createdAt: new Date().toISOString(),
      baseUrl,
      mode: 'project',
      screenshots,
      readbacks,
      description: 'Full feature showcase capture',
    };
    fs.writeFileSync(path.join(outDir, 'readback.json'), JSON.stringify(readbacks, null, 2), 'utf8');
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
