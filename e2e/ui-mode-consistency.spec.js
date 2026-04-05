// @ts-check
const { test, expect } = require('@playwright/test');
const { showFullToolbar, setUIMode } = require('./helpers');

/** UIモード (Normal/Focus/Blank) の表示整合性テスト */
test.describe('UI Mode Consistency', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await showFullToolbar(page);
  });

  // ===== Normal モード (デフォルト) =====
  test('Normal mode: toolbar is visible', async ({ page }) => {
    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toBeVisible();
  });

  // ===== Focus モード =====
  test('Focus mode: sidebar stays closed and aria-hidden', async ({ page }) => {
    await setUIMode(page, 'focus');
    // forceSidebarState は transition 完了後に aria-hidden を設定するため十分待つ
    await page.waitForFunction(() => {
      const sidebar = document.getElementById('sidebar');
      return sidebar && sidebar.getAttribute('aria-hidden') === 'true';
    }, { timeout: 5000 });
    const sidebarState = await page.evaluate(() => {
      const sidebar = document.getElementById('sidebar');
      if (!sidebar) return null;
      return {
        open: sidebar.classList.contains('open'),
        ariaHidden: sidebar.getAttribute('aria-hidden'),
      };
    });
    expect(sidebarState).not.toBeNull();
    expect(sidebarState.open).toBe(false);
    expect(sidebarState.ariaHidden).toBe('true');
  });

  test('Focus mode: focus chapter panel appears if present', async ({ page }) => {
    await setUIMode(page, 'focus');
    await page.waitForTimeout(100);
    const panel = page.locator('.focus-chapter-panel');
    if (await panel.count() > 0) {
      await expect(panel).toBeVisible();
    }
  });

  test('Focus mode: toolbar does not leave a top gap in the editor layout', async ({ page }) => {
    await setUIMode(page, 'focus');
    await page.waitForTimeout(200);
    const layout = await page.evaluate(() => {
      const visibleEditor = [...document.querySelectorAll('#editor, #wysiwyg-editor')]
        .find((el) => window.getComputedStyle(el).display !== 'none');
      const editorContainer = document.querySelector('.editor-container');
      const toolbar = document.getElementById('toolbar');
      if (!visibleEditor || !editorContainer || !toolbar) return null;
      return {
        toolbarHidden: document.documentElement.getAttribute('data-toolbar-hidden'),
        containerTop: Math.round(editorContainer.getBoundingClientRect().top),
        editorTop: Math.round(visibleEditor.getBoundingClientRect().top),
        toolbarBottom: Math.round(toolbar.getBoundingClientRect().bottom)
      };
    });
    expect(layout).not.toBeNull();
    expect(layout.toolbarHidden).toBe('true');
    expect(layout.containerTop).toBe(0);
    expect(layout.editorTop).toBe(0);
    expect(layout.toolbarBottom).toBe(0);
  });

  test('Focus mode: left edge panel does not overlap the writing surface', async ({ page }) => {
    await setUIMode(page, 'focus');
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-edge-hover-left', 'true');
    });
    await page.waitForTimeout(350);
    const overlap = await page.evaluate(() => {
      const panel = document.getElementById('focus-chapter-panel');
      const visibleEditor = [...document.querySelectorAll('#editor, #wysiwyg-editor')]
        .find((el) => window.getComputedStyle(el).display !== 'none');
      if (!panel || !visibleEditor) return null;
      const panelRect = panel.getBoundingClientRect();
      const editorRect = visibleEditor.getBoundingClientRect();
      return Math.max(0, Math.round(panelRect.right - editorRect.left));
    });
    expect(overlap).toBe(0);
  });

  // ===== Blank モード廃止 (SP-081 Phase 3) =====

  // ===== モード遷移 =====
  test('Focus->Normal round-trip: toolbar reappears', async ({ page }) => {
    await setUIMode(page, 'focus');
    await page.waitForTimeout(100);
    await setUIMode(page, 'normal');
    await page.waitForTimeout(100);
    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toBeVisible();
  });

  // Blank->Normal テスト削除 (SP-081 Phase 3: Blank 廃止)

  // ===== MainHubPanel のモード連携 =====
  test('MainHubPanel can open in Focus mode', async ({ page }) => {
    await setUIMode(page, 'focus');
    await page.waitForTimeout(100);
    await page.evaluate(() => {
      if (window.MainHubPanel) window.MainHubPanel.show('search');
    });
    await page.waitForTimeout(200);
    const panel = page.locator('#main-hub-panel');
    if (await panel.count() > 0) {
      await expect(panel).toBeVisible();
    }
  });

  // MainHubPanel Blank テスト削除 (SP-081 Phase 3: Blank 廃止)

  // ===== Reader モード (SP-078) =====
  test('Reader mode: sidebar and toolbar are hidden', async ({ page }) => {
    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.enter();
    });
    await page.waitForTimeout(300);
    const mode = await page.evaluate(() => document.documentElement.getAttribute('data-ui-mode'));
    expect(mode).toBe('reader');
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeHidden();
  });

  test('Reader mode: reader-preview is visible', async ({ page }) => {
    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.enter();
    });
    await page.waitForTimeout(300);
    const preview = page.locator('#reader-preview');
    if (await preview.count() > 0) {
      await expect(preview).toBeVisible();
    }
  });

  test('Reader mode: current editor content is rendered instead of empty state', async ({ page }) => {
    await page.evaluate(() => {
      const content = '## 第一章\n本文です\n\n### シーン1\nReader確認';
      if (window.ZWContentGuard && typeof window.ZWContentGuard.safeSetContent === 'function') {
        window.ZWContentGuard.safeSetContent(content, { backup: false });
      } else {
        const editor = document.getElementById('editor');
        if (editor) {
          editor.value = content;
          editor.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
      if (window.ZWContentGuard && typeof window.ZWContentGuard.ensureSaved === 'function') {
        window.ZWContentGuard.ensureSaved({ snapshot: false });
      }
      if (window.ZWReaderPreview) window.ZWReaderPreview.enter();
    });
    await page.waitForTimeout(300);
    const text = await page.locator('#reader-preview-inner').innerText();
    expect(text).toContain('第一章');
    expect(text).toContain('Reader確認');
    expect(text).not.toContain('コンテンツがありません');
  });

  test('Reader mode: exit returns to previous mode', async ({ page }) => {
    // 遷移前のモードを記録
    const prevMode = await page.evaluate(() => document.documentElement.getAttribute('data-ui-mode'));
    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.enter();
    });
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.exit();
    });
    await page.waitForTimeout(200);
    const mode = await page.evaluate(() => document.documentElement.getAttribute('data-ui-mode'));
    expect(mode).toBe(prevMode);
  });

  // 旧 sp081-detailed-audit から移動: Blank モードは Focus にフォールバック
  test('Blank mode fallback: redirected to Focus', async ({ page }) => {
    await page.evaluate(() => {
      if (window.ZenWriterApp) window.ZenWriterApp.setUIMode('blank');
    });
    await page.waitForTimeout(200);
    const mode = await page.evaluate(() => document.documentElement.getAttribute('data-ui-mode'));
    expect(mode).toBe('focus');
  });
});
