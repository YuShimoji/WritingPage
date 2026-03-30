// @ts-check
const { test, expect } = require('@playwright/test');
const crypto = require('crypto');
const fs = require('fs');

const BASE = '/index.html';
const SHOTS = 'e2e/visual-audit-screenshots';

// Helper: wait for app init
async function waitForApp(page) {
  await page.goto(BASE);
  await page.waitForFunction(() => window.ZWGadgets && window.ZWGadgets._list && window.ZWGadgets._list.length > 5, { timeout: 15000 });
  await page.waitForTimeout(1000);
}

test.describe.configure({ mode: 'serial' });

function hashFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Helper: load sample document content into the real editor/storage path
async function loadSample(page, samplePath) {
  const path = require('path');
  const content = fs.readFileSync(path.resolve(__dirname, '..', samplePath), 'utf-8');

  await page.evaluate((md) => {
    var S = window.ZenWriterStorage;
    var G = window.ZWContentGuard;
    var Store = window.ZWChapterStore;
    var docId = S && typeof S.getCurrentDocId === 'function' ? S.getCurrentDocId() : null;

    if (G && typeof G.safeSetContent === 'function') {
      G.safeSetContent(md, { backup: false });
    } else {
      var editor = document.getElementById('editor');
      if (editor) {
        editor.value = md;
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    if (G && typeof G.ensureSaved === 'function') {
      G.ensureSaved({ snapshot: false });
    }

    if (docId && Store && typeof Store.splitIntoChapters === 'function') {
      Store.splitIntoChapters(docId, md);
    }
  }, content);
  await page.waitForTimeout(500);
  return content;
}

// Helper: show full toolbar
async function showFullToolbar(page) {
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-toolbar-mode', 'full');
    document.documentElement.removeAttribute('data-toolbar-hidden');
  });
}

async function openSidebar(page) {
  await page.evaluate(() => {
    if (window.ZenWriterApp && typeof window.ZenWriterApp.setUIMode === 'function') {
      window.ZenWriterApp.setUIMode('normal');
    }
    var sb = document.querySelector('.sidebar');
    if (sb) {
      sb.classList.add('open');
      sb.setAttribute('aria-hidden', 'false');
    }
    document.documentElement.setAttribute('data-sidebar-open', 'true');
  });
  await page.waitForTimeout(300);
}

async function expandOnlyAccordion(page, accordionId) {
  await page.evaluate((targetId) => {
    var headers = document.querySelectorAll('.accordion-header[aria-controls]');
    for (var i = 0; i < headers.length; i++) {
      var header = headers[i];
      var controls = header.getAttribute('aria-controls');
      var isTarget = controls === targetId;
      header.setAttribute('aria-expanded', isTarget ? 'true' : 'false');
      var content = controls ? document.getElementById(controls) : null;
      if (content) {
        content.setAttribute('aria-hidden', isTarget ? 'false' : 'true');
        content.style.display = isTarget ? 'block' : 'none';
      }
    }
  }, accordionId);
  await page.waitForTimeout(300);
}

test.describe('Visual Audit - Session 21', () => {

  test('01 - Initial load (default state)', async ({ page }) => {
    await waitForApp(page);
    await page.screenshot({ path: `${SHOTS}/01-initial-load.png`, fullPage: false });
  });

  test('02 - Full toolbar visible', async ({ page }) => {
    await waitForApp(page);
    await showFullToolbar(page);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SHOTS}/02-full-toolbar.png`, fullPage: false });
  });

  test('03 - Sidebar accordion categories', async ({ page }) => {
    await waitForApp(page);
    await openSidebar(page);

    // Screenshot sidebar area
    const sidebar = page.locator('.sidebar');
    if (await sidebar.isVisible()) {
      await sidebar.screenshot({ path: `${SHOTS}/03-sidebar-accordion.png` });
    } else {
      await page.screenshot({ path: `${SHOTS}/03-sidebar-accordion.png`, fullPage: false });
    }
  });

  test('04 - Structure gadgets (Documents, Outline)', async ({ page }) => {
    await waitForApp(page);
    await openSidebar(page);
    await expandOnlyAccordion(page, 'accordion-structure');
    await page.locator('.accordion-header[aria-controls="accordion-structure"]').locator('xpath=..')
      .screenshot({ path: `${SHOTS}/04-structure-gadgets.png` });
  });

  test('05 - Edit gadgets', async ({ page }) => {
    await waitForApp(page);
    await openSidebar(page);
    await expandOnlyAccordion(page, 'accordion-edit');
    await page.locator('.accordion-header[aria-controls="accordion-edit"]').locator('xpath=..')
      .screenshot({ path: `${SHOTS}/05-edit-gadgets.png` });
  });

  test('06 - Theme gadgets', async ({ page }) => {
    await waitForApp(page);
    await openSidebar(page);
    await expandOnlyAccordion(page, 'accordion-theme');
    await page.locator('.accordion-header[aria-controls="accordion-theme"]').locator('xpath=..')
      .screenshot({ path: `${SHOTS}/06-theme-gadgets.png` });
  });

  test('07 - Assist gadgets', async ({ page }) => {
    await waitForApp(page);
    await openSidebar(page);
    await expandOnlyAccordion(page, 'accordion-assist');
    await page.locator('.accordion-header[aria-controls="accordion-assist"]').locator('xpath=..')
      .screenshot({ path: `${SHOTS}/07-assist-gadgets.png` });
  });

  test('08 - Advanced gadgets', async ({ page }) => {
    await waitForApp(page);
    await openSidebar(page);
    await expandOnlyAccordion(page, 'accordion-advanced');
    await page.locator('.accordion-header[aria-controls="accordion-advanced"]').locator('xpath=..')
      .screenshot({ path: `${SHOTS}/08-advanced-gadgets.png` });
  });

  test('09 - Sample document: full-feature-showcase', async ({ page }) => {
    await waitForApp(page);
    const content = await loadSample(page, 'samples/full-feature-showcase.md');
    await page.waitForTimeout(500);
    const expectedHeading = (content.match(/^#\s+(.+)$/m) || [])[1];
    if (expectedHeading) {
      const editorText = await page.evaluate(() => {
        if (window.ZWContentGuard && typeof window.ZWContentGuard.getEditorContent === 'function') {
          return window.ZWContentGuard.getEditorContent();
        }
        return '';
      });
      expect(editorText).toContain(expectedHeading);
    }
    await page.screenshot({ path: `${SHOTS}/09-sample-full-feature.png`, fullPage: false });
  });

  test('10 - Sample document: wiki-and-chapters-demo', async ({ page }) => {
    await waitForApp(page);
    const content = await loadSample(page, 'samples/wiki-and-chapters-demo.md');
    await page.waitForTimeout(500);
    const expectedHeading = (content.match(/^#\s+(.+)$/m) || [])[1];
    if (expectedHeading) {
      const editorText = await page.evaluate(() => {
        if (window.ZWContentGuard && typeof window.ZWContentGuard.getEditorContent === 'function') {
          return window.ZWContentGuard.getEditorContent();
        }
        return '';
      });
      expect(editorText).toContain(expectedHeading);
    }
    await page.screenshot({ path: `${SHOTS}/10-sample-wiki-chapters.png`, fullPage: false });
  });

  test('11 - Sample document: web-novel-effects-demo', async ({ page }) => {
    await waitForApp(page);
    const content = await loadSample(page, 'samples/web-novel-effects-demo.md');
    await page.waitForTimeout(500);
    const expectedHeading = (content.match(/^#\s+(.+)$/m) || [])[1];
    if (expectedHeading) {
      const editorText = await page.evaluate(() => {
        if (window.ZWContentGuard && typeof window.ZWContentGuard.getEditorContent === 'function') {
          return window.ZWContentGuard.getEditorContent();
        }
        return '';
      });
      expect(editorText).toContain(expectedHeading);
    }
    await page.screenshot({ path: `${SHOTS}/11-sample-web-novel.png`, fullPage: false });
  });

  test('12 - Focus mode', async ({ page }) => {
    await waitForApp(page);
    await loadSample(page, 'samples/wiki-and-chapters-demo.md');
    await page.evaluate(() => {
      if (window.ZenWriterApp && typeof window.ZenWriterApp.setUIMode === 'function') {
        window.ZenWriterApp.setUIMode('normal');
        window.ZenWriterApp.setUIMode('focus');
      }
    });
    await page.waitForTimeout(500);
    const layout = await page.evaluate(() => {
      const visibleEditor = [...document.querySelectorAll('#editor, #wysiwyg-editor')]
        .find((el) => window.getComputedStyle(el).display !== 'none');
      const editorContainer = document.querySelector('.editor-container');
      return visibleEditor && editorContainer
        ? {
            mode: document.documentElement.getAttribute('data-ui-mode'),
            top: Math.round(editorContainer.getBoundingClientRect().top),
            editorTop: Math.round(visibleEditor.getBoundingClientRect().top)
          }
        : null;
    });
    expect(layout.mode).toBe('focus');
    expect(layout.top).toBe(0);
    expect(layout.editorTop).toBe(0);
    await page.screenshot({ path: `${SHOTS}/12-focus-mode.png`, fullPage: false });
  });

  test('13 - Focus mode (via Ctrl+Shift+B fallback)', async ({ page }) => {
    await waitForApp(page);
    await page.evaluate(() => {
      if (window.ZWContentGuard && typeof window.ZWContentGuard.safeSetContent === 'function') {
        window.ZWContentGuard.safeSetContent('', { backup: false });
      }
      if (window.ZWContentGuard && typeof window.ZWContentGuard.ensureSaved === 'function') {
        window.ZWContentGuard.ensureSaved({ snapshot: false });
      }
      if (window.ZenWriterApp && typeof window.ZenWriterApp.setUIMode === 'function') {
        window.ZenWriterApp.setUIMode('normal');
      }
    });
    await page.waitForTimeout(300);
    await page.keyboard.press('F2');
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-edge-hover-top', 'true');
    });
    await page.waitForTimeout(300);
    const mode = await page.evaluate(() => document.documentElement.getAttribute('data-ui-mode'));
    expect(mode).toBe('focus');
    await page.screenshot({ path: `${SHOTS}/13-focus-via-blank-fallback.png`, fullPage: false });
  });

  test('14 - Reader mode', async ({ page }) => {
    await waitForApp(page);
    const content = await loadSample(page, 'samples/full-feature-showcase.md');
    await page.waitForTimeout(300);
    // Switch to reader mode
    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.enter();
    });
    await page.waitForTimeout(1000);
    const heading = (content.match(/^#\s+(.+)$/m) || [])[1];
    const readerText = await page.locator('#reader-preview-inner').innerText();
    expect(readerText).not.toContain('コンテンツがありません');
    if (heading) {
      expect(readerText).toContain(heading);
    }
    await page.screenshot({ path: `${SHOTS}/14-reader-mode.png`, fullPage: false });
  });

  test('15 - Help modal', async ({ page }) => {
    await waitForApp(page);
    await showFullToolbar(page);
    await page.evaluate(() => {
      var button = document.getElementById('toggle-help-modal');
      if (button) button.click();
    });
    await page.waitForSelector('#help-modal', { state: 'visible' });
    await page.screenshot({ path: `${SHOTS}/15-help-modal.png`, fullPage: false });
  });

  test('16 - Command palette', async ({ page }) => {
    await waitForApp(page);
    await page.evaluate(() => {
      if (window.commandPalette && typeof window.commandPalette.show === 'function') {
        window.commandPalette.show();
      }
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SHOTS}/16-command-palette.png`, fullPage: false });
  });

  test('17 - Loadout manager', async ({ page }) => {
    await waitForApp(page);
    await openSidebar(page);
    await expandOnlyAccordion(page, 'accordion-advanced');
    const loadoutSelect = page.locator('#loadout-select');
    if (await loadoutSelect.isVisible()) {
      await loadoutSelect.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await loadoutSelect.screenshot({ path: `${SHOTS}/17-loadout-manager.png` });
      return;
    }
    await page.locator('#accordion-advanced').screenshot({ path: `${SHOTS}/17-loadout-manager.png` });
  });

  test('18 - Sections navigator', async ({ page }) => {
    await waitForApp(page);
    await loadSample(page, 'samples/wiki-and-chapters-demo.md');
    await openSidebar(page);
    await expandOnlyAccordion(page, 'accordion-sections');
    await page.locator('#accordion-sections').screenshot({ path: `${SHOTS}/18-sections-navigator.png` });
  });

  test('19 - Left dock panel', async ({ page }) => {
    await waitForApp(page);
    await page.evaluate(() => {
      if (window.ZenWriterApp && typeof window.ZenWriterApp.setUIMode === 'function') {
        window.ZenWriterApp.setUIMode('normal');
      }
      var dock = window.dockManager;
      if (dock && typeof dock.addTab === 'function') {
        dock.addTab('visual-audit-left', 'Visual Audit', function (panel) {
          panel.innerHTML = '<div class="visual-audit-dock"><h3>Dock Preview</h3><p>left panel visible</p></div>';
        });
        if (typeof dock.setActiveTab === 'function') {
          dock.setActiveTab('visual-audit-left');
        }
        if (typeof dock.setLeftPanelVisible === 'function') {
          dock.setLeftPanelVisible(true);
        }
      }
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/19-left-dock-panel.png`, fullPage: false });
  });

  test('20 - Editor with WYSIWYG content', async ({ page }) => {
    await waitForApp(page);
    // Set content via innerHTML
    await page.evaluate(() => {
      var editor = document.getElementById('wysiwyg-editor');
      if (editor) {
        editor.innerHTML = '<h1>テスト見出し</h1><p>これはビジュアル監査のテストテキストです。<strong>太字</strong>や<em>斜体</em>の装飾が正しく表示されているか確認します。</p><h2>第二章</h2><p>段落の間隔、フォント、行間の表示を確認。</p>';
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/20-editor-wysiwyg.png`, fullPage: false });
  });

  test('20b - Refresh WYSIWYG screenshot via real toggle flow', async ({ page }) => {
    await waitForApp(page);
    await loadSample(page, 'samples/full-feature-showcase.md');
    await showFullToolbar(page);
    await page.locator('#toggle-wysiwyg').dispatchEvent('mousedown');
    await page.waitForTimeout(500);
    await expect(page.locator('#wysiwyg-editor')).toBeVisible();
    await page.locator('.editor-container').screenshot({ path: `${SHOTS}/20-editor-wysiwyg.png` });
  });

  test('21 - Generated screenshots do not collapse into duplicate images', async () => {
    const distinctPrimary = [
      '01-initial-load.png',
      '09-sample-full-feature.png',
      '10-sample-wiki-chapters.png',
      '11-sample-web-novel.png',
      '12-focus-mode.png',
      '13-focus-via-blank-fallback.png',
      '14-reader-mode.png',
      '19-left-dock-panel.png',
      '20-editor-wysiwyg.png'
    ].map((name) => hashFile(`${SHOTS}/${name}`));

    const distinctSidebar = [
      '04-structure-gadgets.png',
      '05-edit-gadgets.png',
      '06-theme-gadgets.png',
      '07-assist-gadgets.png',
      '08-advanced-gadgets.png',
      '17-loadout-manager.png',
      '18-sections-navigator.png'
    ].map((name) => hashFile(`${SHOTS}/${name}`));

    expect(new Set(distinctPrimary).size).toBeGreaterThanOrEqual(7);
    expect(new Set(distinctSidebar).size).toBeGreaterThanOrEqual(5);
  });
});
