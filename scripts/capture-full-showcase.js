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

const SHOWCASE_MARKDOWN = [
  '# 全機能ショーケース',
  '',
  '## 基本テキスト',
  '',
  '普通の段落テキストです。**太字**と*斜体*、~~Markdown取り消し線~~と[strike]装飾取り消し線[/strike]を含みます。',
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
  '## テキストボックス preset 比較',
  '',
  ':::zw-textbox{preset:"dialogue"}',
  '「テキストボックス preset: 直立した会話枠。左線と余白で本文から分ける。」',
  ':::',
  '',
  ':::zw-textbox{preset:"monologue"}',
  '内面描写 preset: 斜体、淡い枠、直立した本文リズムで心の声として読む。',
  ':::',
  '',
  ':::zw-textbox{preset:"tilted-monologue"}',
  'Experimental tilted-monologue preset: explicit opt-in tilt for intentionally unstable inner voice evidence.',
  ':::',
  '',
  '## 長文テスト',
  '',
  '彼女は窓辺に立ち、雨の降りしきる街を見下ろしていた。灰色の空から落ちてくる雨粒は、アスファルトに小さな波紋を作っては消えていく。',
].join('\n');

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
  await page.evaluate((content) => {
    const textarea = document.querySelector('#editor');
    const wysiwyg = document.querySelector('#wysiwyg-editor');
    const isVisible = (el) => {
      if (!el) return false;
      const s = window.getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
    };
    if (textarea) {
      textarea.value = content;
    }
    if (isVisible(textarea)) {
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      textarea.scrollTop = 0;
    } else if (isVisible(wysiwyg)) {
      const settings = window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function'
        ? window.ZenWriterStorage.loadSettings()
        : {};
      const rte = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
      let html = '';
      if (rte && typeof rte.markdownToHtml === 'function') {
        html = rte.markdownToHtml(content);
      }
      if (!html && window.ZWMdItBody && typeof window.ZWMdItBody.renderToHtmlBeforePipeline === 'function') {
        html = window.ZWMdItBody.renderToHtmlBeforePipeline(content);
        if (window.ZWPostMarkdownHtmlPipeline && typeof window.ZWPostMarkdownHtmlPipeline.apply === 'function') {
          html = window.ZWPostMarkdownHtmlPipeline.apply(html, {
            settings,
            surface: 'preview'
          });
        }
      }
      wysiwyg.innerHTML = html || content;
      wysiwyg.dispatchEvent(new Event('input', { bubbles: true }));
      if (rte && typeof rte.syncToMarkdown === 'function') {
        rte.syncToMarkdown();
      }
    }
  }, SHOWCASE_MARKDOWN);
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

async function setCaptureStateLabel(page, title, detail, kind) {
  await page.evaluate((payload) => {
    let style = document.getElementById('codex-showcase-state-label-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'codex-showcase-state-label-style';
      style.textContent = `
        .codex-showcase-state-label {
          position: fixed;
          top: 14px;
          right: 16px;
          z-index: 2147483000;
          max-width: 360px;
          padding: 10px 12px;
          border: 1px solid rgba(80, 90, 105, 0.32);
          border-radius: 8px;
          background: rgba(250, 252, 255, 0.94);
          color: #17202a;
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
          font: 600 12px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          pointer-events: none;
          letter-spacing: 0;
        }
        .codex-showcase-state-label strong {
          display: block;
          margin-bottom: 3px;
          font-size: 13px;
        }
        .codex-showcase-state-label span {
          display: block;
          font-weight: 500;
          color: #425466;
        }
      `;
      document.head.appendChild(style);
    }
    let label = document.getElementById('codex-showcase-state-label');
    if (!label) {
      label = document.createElement('div');
      label.id = 'codex-showcase-state-label';
      label.className = 'codex-showcase-state-label';
      document.body.appendChild(label);
    }
    label.setAttribute('data-capture-kind', payload.kind || '');
    label.innerHTML = '<strong></strong><span></span>';
    label.querySelector('strong').textContent = payload.title || '';
    label.querySelector('span').textContent = payload.detail || '';
  }, { title, detail, kind });
}

async function clearCaptureStateLabel(page) {
  await page.evaluate(() => {
    const label = document.getElementById('codex-showcase-state-label');
    if (label) label.remove();
  });
}

async function readPresetParityState(page, kind) {
  return page.evaluate((readKind) => {
    const visible = (el) => {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    };
    const root = readKind === 'reader_parity'
      ? document.querySelector('#reader-preview .reader-preview__content')
      : document.getElementById('wysiwyg-editor');
    const sidebar = document.getElementById('sidebar');
    const label = document.getElementById('codex-showcase-state-label');
    const summarizeBox = (box) => {
      if (!box) {
        return {
          present: false,
          className: '',
          dataPreset: '',
          dataRole: '',
          dataAnim: '',
          styleAttr: '',
          computedTransform: '',
          computedFontStyle: '',
          hasContentWrapper: false,
        };
      }
      const style = window.getComputedStyle(box);
      return {
        present: true,
        className: box.className || '',
        dataPreset: box.getAttribute('data-preset') || '',
        dataRole: box.getAttribute('data-role') || '',
        dataAnim: box.getAttribute('data-anim') || '',
        styleAttr: box.getAttribute('style') || '',
        computedTransform: style.transform || '',
        computedFontStyle: style.fontStyle || '',
        hasContentWrapper: !!box.querySelector('.zw-textbox__content'),
      };
    };
    const nativeStrikeNodes = root ? Array.from(root.querySelectorAll('s, del, strike')) : [];
    const decorStrikeNodes = root ? Array.from(root.querySelectorAll('.decor-strikethrough')) : [];
    const allStrikeNodes = nativeStrikeNodes.concat(decorStrikeNodes);
    return {
      kind: readKind,
      uiMode: document.documentElement.getAttribute('data-ui-mode') || '',
      readerOpen: document.documentElement.getAttribute('data-reader-overlay-open') === 'true',
      leftNavState: document.documentElement.getAttribute('data-left-nav-state') || '',
      leftNavActive: document.documentElement.getAttribute('data-left-nav-active') || '',
      sidebarOpen: !!(sidebar && sidebar.classList.contains('open')),
      captureLabelKind: label ? (label.getAttribute('data-capture-kind') || '') : '',
      rootExists: !!root,
      rootVisible: visible(root),
      nativeStrikeCount: nativeStrikeNodes.length,
      decorStrikeCount: decorStrikeNodes.length,
      strikeComputedLineThrough: allStrikeNodes.some((node) => {
        const style = window.getComputedStyle(node);
        return /line-through/i.test(style.textDecorationLine || style.textDecoration || '');
      }),
      dialogue: summarizeBox(root ? root.querySelector('.zw-textbox[data-preset="dialogue"], .zw-textbox--dialogue') : null),
      monologue: summarizeBox(root ? root.querySelector('.zw-textbox[data-preset="monologue"], .zw-textbox--monologue') : null),
      tiltedMonologue: summarizeBox(root ? root.querySelector('.zw-textbox[data-preset="tilted-monologue"], .zw-textbox--tilted-monologue') : null),
    };
  }, kind);
}

async function scrollPresetFixtureIntoView(page, kind) {
  await page.evaluate((readKind) => {
    const root = readKind === 'reader_parity'
      ? document.querySelector('#reader-preview .reader-preview__content')
      : document.getElementById('wysiwyg-editor');
    const firstPreset = root
      ? root.querySelector('.zw-textbox[data-preset="dialogue"], .zw-textbox--dialogue')
      : null;
    if (firstPreset && typeof firstPreset.scrollIntoView === 'function') {
      firstPreset.scrollIntoView({ block: 'center', inline: 'nearest' });
    }
  }, kind);
  await page.waitForTimeout(250);
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
  if (readback.kind === 'focus_compat' &&
      (readback.uiMode !== 'focus' || readback.readerOpen || readback.captureLabelKind !== 'focus_compat')) {
    throw new Error(`Focus showcase state is not readable: ${JSON.stringify(readback)}`);
  }
  if (readback.kind === 'normal_shell' &&
      (readback.uiMode !== 'normal' || readback.leftNavState !== 'category' || readback.captureLabelKind !== 'normal_shell')) {
    throw new Error(`Normal shell showcase state is not readable: ${JSON.stringify(readback)}`);
  }
  if (readback.kind === 'editor_parity' || readback.kind === 'reader_parity') {
    const target = readback.kind === 'reader_parity' ? 'Reader' : 'Editor';
    if (!readback.rootExists || (readback.nativeStrikeCount + readback.decorStrikeCount) < 2 || !readback.strikeComputedLineThrough) {
      throw new Error(`${target} strike parity readback failed: ${JSON.stringify(readback)}`);
    }
    if (!readback.dialogue.present || !readback.monologue.present || !readback.tiltedMonologue.present) {
      throw new Error(`${target} textbox preset readback missing boxes: ${JSON.stringify(readback)}`);
    }
    if (!/zw-textbox--dialogue/.test(readback.dialogue.className) ||
        !/zw-textbox--monologue/.test(readback.monologue.className) ||
        !/zw-textbox--tilted-monologue/.test(readback.tiltedMonologue.className)) {
      throw new Error(`${target} textbox preset classes are not projected: ${JSON.stringify(readback)}`);
    }
    if (!/rotate\(0deg\)/.test(readback.monologue.styleAttr) ||
        !/rotate\(-2deg\)/.test(readback.tiltedMonologue.styleAttr) ||
        !/rotate\(0deg\)/.test(readback.dialogue.styleAttr)) {
      throw new Error(`${target} textbox preset tilt semantics are not readable: ${JSON.stringify(readback)}`);
    }
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
    await setCaptureStateLabel(
      page,
      '14 Focus compatibility',
      'data-ui-mode=focus / reader overlay closed / writing canvas only',
      'focus_compat'
    );
    const focusReadback = await readPresetParityState(page, 'focus_compat');
    assertShowcaseReadback(focusReadback);
    readbacks.push(focusReadback);
    await shot(page, '14-focus-compat.png');

    // 15: Normal shell に戻す
    await page.evaluate(() => {
      if (window.ZenWriterApp && typeof window.ZenWriterApp.setUIMode === 'function') {
        window.ZenWriterApp.setUIMode('normal');
      }
    });
    await openSidebarCategory(page, 'structure');
    await setCaptureStateLabel(
      page,
      '15 Normal shell',
      'data-ui-mode=normal / structure sidebar category open',
      'normal_shell'
    );
    await page.waitForTimeout(300);
    const normalShellReadback = await readPresetParityState(page, 'normal_shell');
    assertShowcaseReadback(normalShellReadback);
    readbacks.push(normalShellReadback);
    await shot(page, '15-normal-shell.png');

    // 16: エディタ Normal
    await returnLeftNavRoot(page);
    await setCaptureStateLabel(
      page,
      '16 Editor normal parity',
      'clean editor canvas / strike + dialogue vs monologue vs explicit tilt fixture',
      'editor_parity'
    );
    await page.waitForTimeout(300);
    await scrollPresetFixtureIntoView(page, 'editor_parity');
    const editorParityReadback = await readPresetParityState(page, 'editor_parity');
    assertShowcaseReadback(editorParityReadback);
    readbacks.push(editorParityReadback);
    await shot(page, '16-editor-normal.png');
    await clearCaptureStateLabel(page);

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
    await scrollPresetFixtureIntoView(rp, 'reader_parity');
    await setCaptureStateLabel(
      rp,
      '19 Reader parity',
      'Reader overlay / strike + dialogue vs monologue vs explicit tilt fixture',
      'reader_parity'
    );
    const readerParityReadback = await readPresetParityState(rp, 'reader_parity');
    assertShowcaseReadback(readerParityReadback);
    readbacks.push(readerParityReadback);

    // 19: Reader Preview
    await shot(rp, '19-reader-preview.png');
    await clearCaptureStateLabel(rp);

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
