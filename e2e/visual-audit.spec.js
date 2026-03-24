// @ts-check
const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost:8080';
const SHOTS = 'e2e/visual-audit-screenshots';

// Helper: wait for app init
async function waitForApp(page) {
  await page.goto(BASE);
  await page.waitForFunction(() => window.ZWGadgets && window.ZWGadgets._list && window.ZWGadgets._list.length > 5, { timeout: 15000 });
  await page.waitForTimeout(1000);
}

// Helper: load sample document content into editor
async function loadSample(page, samplePath) {
  const fs = require('fs');
  const path = require('path');
  const content = fs.readFileSync(path.resolve(__dirname, '..', samplePath), 'utf-8');

  // Disable chapterMode to use legacy path (simpler for visual audit)
  await page.evaluate(() => {
    var S = window.ZenWriterStorage;
    if (!S) return;
    var docId = S.getCurrentDocId();
    if (!docId) return;
    var docs = S.loadDocuments();
    for (var i = 0; i < docs.length; i++) {
      if (docs[i] && docs[i].id === docId) {
        docs[i].chapterMode = false;
        break;
      }
    }
    S.saveDocuments(docs);
  });

  // Convert markdown to simple HTML and set in WYSIWYG editor
  await page.evaluate((md) => {
    var editor = document.getElementById('wysiwyg-editor');
    if (editor) {
      // Simple markdown to HTML conversion for visual purposes
      var html = md
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(?!<[h|p])/gm, '');
      editor.innerHTML = '<p>' + html + '</p>';
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, content);
  await page.waitForTimeout(500);
}

// Helper: show full toolbar
async function showFullToolbar(page) {
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-toolbar-mode', 'full');
    document.documentElement.removeAttribute('data-toolbar-hidden');
  });
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
    // Open sidebar if not visible
    await page.evaluate(() => {
      // Open sidebar properly
      var sb = document.querySelector('.sidebar');
      if (sb) { sb.classList.add('open'); sb.setAttribute('aria-hidden', 'false'); }
      document.documentElement.setAttribute('data-sidebar-open', 'true');
    });
    await page.waitForTimeout(300);

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
    await page.evaluate(() => {
      // Open sidebar properly
      var sb = document.querySelector('.sidebar');
      if (sb) { sb.classList.add('open'); sb.setAttribute('aria-hidden', 'false'); }
      document.documentElement.setAttribute('data-sidebar-open', 'true');
    });
    // Click structure accordion
    const structureHeader = page.locator('.accordion-header[aria-controls="accordion-structure"]');
    if (await structureHeader.isVisible()) {
      await structureHeader.click();
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: `${SHOTS}/04-structure-gadgets.png`, fullPage: false });
  });

  test('05 - Edit gadgets', async ({ page }) => {
    await waitForApp(page);
    await page.evaluate(() => {
      // Open sidebar properly
      var sb = document.querySelector('.sidebar');
      if (sb) { sb.classList.add('open'); sb.setAttribute('aria-hidden', 'false'); }
      document.documentElement.setAttribute('data-sidebar-open', 'true');
    });
    const editHeader = page.locator('.accordion-header[aria-controls="accordion-edit"]');
    if (await editHeader.isVisible()) {
      await editHeader.click();
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: `${SHOTS}/05-edit-gadgets.png`, fullPage: false });
  });

  test('06 - Theme gadgets', async ({ page }) => {
    await waitForApp(page);
    await page.evaluate(() => {
      // Open sidebar properly
      var sb = document.querySelector('.sidebar');
      if (sb) { sb.classList.add('open'); sb.setAttribute('aria-hidden', 'false'); }
      document.documentElement.setAttribute('data-sidebar-open', 'true');
    });
    const themeHeader = page.locator('.accordion-header[aria-controls="accordion-theme"]');
    if (await themeHeader.isVisible()) {
      await themeHeader.click();
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: `${SHOTS}/06-theme-gadgets.png`, fullPage: false });
  });

  test('07 - Assist gadgets', async ({ page }) => {
    await waitForApp(page);
    await page.evaluate(() => {
      // Open sidebar properly
      var sb = document.querySelector('.sidebar');
      if (sb) { sb.classList.add('open'); sb.setAttribute('aria-hidden', 'false'); }
      document.documentElement.setAttribute('data-sidebar-open', 'true');
    });
    const assistHeader = page.locator('.accordion-header[aria-controls="accordion-assist"]');
    if (await assistHeader.isVisible()) {
      await assistHeader.click();
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: `${SHOTS}/07-assist-gadgets.png`, fullPage: false });
  });

  test('08 - Advanced gadgets', async ({ page }) => {
    await waitForApp(page);
    await page.evaluate(() => {
      // Open sidebar properly
      var sb = document.querySelector('.sidebar');
      if (sb) { sb.classList.add('open'); sb.setAttribute('aria-hidden', 'false'); }
      document.documentElement.setAttribute('data-sidebar-open', 'true');
    });
    const advancedHeader = page.locator('.accordion-header[aria-controls="accordion-advanced"]');
    if (await advancedHeader.isVisible()) {
      await advancedHeader.click();
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: `${SHOTS}/08-advanced-gadgets.png`, fullPage: false });
  });

  test('09 - Sample document: full-feature-showcase', async ({ page }) => {
    await waitForApp(page);
    await loadSample(page, 'samples/full-feature-showcase.md');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/09-sample-full-feature.png`, fullPage: false });
  });

  test('10 - Sample document: wiki-and-chapters-demo', async ({ page }) => {
    await waitForApp(page);
    await loadSample(page, 'samples/wiki-and-chapters-demo.md');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/10-sample-wiki-chapters.png`, fullPage: false });
  });

  test('11 - Sample document: web-novel-effects-demo', async ({ page }) => {
    await waitForApp(page);
    await loadSample(page, 'samples/web-novel-effects-demo.md');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/11-sample-web-novel.png`, fullPage: false });
  });

  test('12 - Focus mode', async ({ page }) => {
    await waitForApp(page);
    await loadSample(page, 'samples/wiki-and-chapters-demo.md');
    await page.keyboard.press('Control+Shift+F');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/12-focus-mode.png`, fullPage: false });
  });

  test('13 - Blank mode', async ({ page }) => {
    await waitForApp(page);
    await page.keyboard.press('Control+Shift+B');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/13-blank-mode.png`, fullPage: false });
  });

  test('14 - Reader mode', async ({ page }) => {
    await waitForApp(page);
    await loadSample(page, 'samples/full-feature-showcase.md');
    await page.waitForTimeout(300);
    // Switch to reader mode
    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.enter();
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SHOTS}/14-reader-mode.png`, fullPage: false });
  });

  test('15 - Help modal', async ({ page }) => {
    await waitForApp(page);
    // Open help modal
    await page.evaluate(() => {
      if (window.ZenWriterHelpModal && typeof window.ZenWriterHelpModal.render === 'function') {
        window.ZenWriterHelpModal.render();
      }
    });
    await page.waitForTimeout(500);
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
    await page.evaluate(() => {
      // Open sidebar properly
      var sb = document.querySelector('.sidebar');
      if (sb) { sb.classList.add('open'); sb.setAttribute('aria-hidden', 'false'); }
      document.documentElement.setAttribute('data-sidebar-open', 'true');
    });
    // Open advanced accordion, find loadout manager
    const advancedHeader = page.locator('.accordion-header[aria-controls="accordion-advanced"]');
    if (await advancedHeader.isVisible()) {
      await advancedHeader.click();
      await page.waitForTimeout(300);
    }
    // Scroll to loadout manager
    const loadoutSelect = page.locator('#loadout-select');
    if (await loadoutSelect.isVisible()) {
      await loadoutSelect.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
    }
    await page.screenshot({ path: `${SHOTS}/17-loadout-manager.png`, fullPage: false });
  });

  test('18 - Sections navigator', async ({ page }) => {
    await waitForApp(page);
    await loadSample(page, 'samples/wiki-and-chapters-demo.md');
    await page.evaluate(() => {
      // Open sidebar properly
      var sb = document.querySelector('.sidebar');
      if (sb) { sb.classList.add('open'); sb.setAttribute('aria-hidden', 'false'); }
      document.documentElement.setAttribute('data-sidebar-open', 'true');
      // Programmatically open sections accordion
      var header = document.querySelector('.accordion-header[aria-controls="accordion-sections"]');
      var content = document.getElementById('accordion-sections');
      if (header) {
        header.setAttribute('aria-expanded', 'true');
      }
      if (content) {
        content.setAttribute('aria-hidden', 'false');
        content.style.display = '';
      }
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/18-sections-navigator.png`, fullPage: false });
  });

  test('19 - Left dock panel', async ({ page }) => {
    await waitForApp(page);
    // Toggle left panel
    await page.evaluate(() => {
      if (window.ZenDockManager && window.ZenDockManager.toggleLeftPanel) {
        window.ZenDockManager.setLeftPanelVisible(true);
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
});
