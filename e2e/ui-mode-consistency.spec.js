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
  test('Normal mode: sidebar chrome toolbar exists', async ({ page }) => {
    const chrome = page.locator('.sidebar-chrome-toolbar');
    await expect(chrome).toHaveCount(1);
  });

  // ===== Focus モード =====
  test('Focus mode: UI mode toggle preserves sidebar open/closed', async ({ page }) => {
    await setUIMode(page, 'normal');
    await page.evaluate(() => {
      if (window.sidebarManager) window.sidebarManager.forceSidebarState(false);
    });
    await page.waitForTimeout(350);
    await setUIMode(page, 'focus');
    await page.waitForTimeout(350);
    let closed = await page.evaluate(() => {
      const s = document.getElementById('sidebar');
      return !!(s && !s.classList.contains('open'));
    });
    expect(closed).toBe(true);

    await page.evaluate(() => {
      if (window.sidebarManager) window.sidebarManager.forceSidebarState(true);
    });
    await page.waitForTimeout(350);
    await setUIMode(page, 'normal');
    await page.waitForTimeout(150);
    await setUIMode(page, 'focus');
    await page.waitForTimeout(350);
    const stillOpen = await page.evaluate(() => {
      const s = document.getElementById('sidebar');
      return !!(s && s.classList.contains('open'));
    });
    expect(stillOpen).toBe(true);
  });

  test('Focus mode: focus chapter panel appears if present', async ({ page }) => {
    await setUIMode(page, 'focus');
    await page.waitForTimeout(100);
    const panel = page.locator('.focus-chapter-panel');
    if (await panel.count() > 0) {
      await expect(panel).toBeVisible();
    }
  });

  test('F2 shortcut exits focus to normal (session 107)', async ({ page }) => {
    await setUIMode(page, 'focus');
    await page.waitForTimeout(150);
    await page.keyboard.press('F2');
    await page.waitForTimeout(200);
    await expect(page.locator('html')).toHaveAttribute('data-ui-mode', 'normal');
  });

  test('session 108: view-menu の現モード表示は setUIMode で更新される', async ({ page }) => {
    // 回帰テスト — session 107 で setUIMode が ZenWriterUIModeChanged を発火していなかったため
    // view-menu summary 内の現モード表示が初期値「ミニマル」のまま固定されていた問題を固定化
    await setUIMode(page, 'focus');
    await page.waitForTimeout(150);
    const initial = (await page.locator('#view-menu [data-current-mode]').textContent()) || '';
    expect(initial.trim()).toBe('ミニマル');

    await setUIMode(page, 'normal');
    await page.waitForTimeout(150);
    const afterNormal = (await page.locator('#view-menu [data-current-mode]').textContent()) || '';
    expect(afterNormal.trim()).toBe('フルChrome');

    await setUIMode(page, 'focus');
    await page.waitForTimeout(150);
    const backToFocus = (await page.locator('#view-menu [data-current-mode]').textContent()) || '';
    expect(backToFocus.trim()).toBe('ミニマル');
  });

  test('Focus mode: editor layout has no main toolbar strip', async ({ page }) => {
    await setUIMode(page, 'focus');
    await page.waitForTimeout(200);
    const layout = await page.evaluate(() => {
      const visibleEditor = [...document.querySelectorAll('#editor, #wysiwyg-editor')]
        .find((el) => window.getComputedStyle(el).display !== 'none');
      const editorContainer = document.querySelector('.editor-container');
      if (!visibleEditor || !editorContainer) return null;
      return {
        toolbarHidden: document.documentElement.getAttribute('data-toolbar-hidden'),
        containerTop: Math.round(editorContainer.getBoundingClientRect().top),
        editorTop: Math.round(visibleEditor.getBoundingClientRect().top),
        noMainToolbar: !document.getElementById('toolbar')
      };
    });
    expect(layout).not.toBeNull();
    expect(layout.toolbarHidden).toBeNull();
    expect(layout.noMainToolbar).toBe(true);
    // ミニ HUD 等の薄い Chrome で数 px〜数十 px のオフセットがあり得る
    expect(layout.containerTop).toBeLessThanOrEqual(48);
    expect(layout.editorTop).toBeGreaterThanOrEqual(0);
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
  test('Focus->Normal round-trip: sidebar chrome remains in DOM', async ({ page }) => {
    await setUIMode(page, 'focus');
    await page.waitForTimeout(100);
    await setUIMode(page, 'normal');
    await page.waitForTimeout(100);
    const chrome = page.locator('.sidebar-chrome-toolbar');
    await expect(chrome).toHaveCount(1);
  });

  test('Normal→Focus: persisted 詳細(sidebarSettingsOpen) is collapsed for minimal rail', async ({ page }) => {
    await page.evaluate(() => {
      const s = window.ZenWriterStorage.loadSettings();
      s.ui = s.ui || {};
      s.ui.sidebarSettingsOpen = true;
      window.ZenWriterStorage.saveSettings(s);
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await showFullToolbar(page);
    await setUIMode(page, 'normal');
    await page.waitForTimeout(150);
    await setUIMode(page, 'focus');
    await page.waitForTimeout(250);
    const wso = await page.evaluate(() => document.documentElement.getAttribute('data-writing-settings-open'));
    expect(wso).toBe('false');
  });

  // Blank->Normal テスト削除 (SP-081 Phase 3: Blank 廃止)
  // MainHubPanel テスト削除 (session 94: パネル廃止)

  // ===== 再生オーバーレイ (SP-078+) =====
  test('再生オーバーレイ: sidebar and floating chrome controls are hidden', async ({ page }) => {
    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.enter();
    });
    await page.waitForTimeout(300);
    const open = await page.evaluate(() => document.documentElement.getAttribute('data-reader-overlay-open'));
    expect(open).toBe('true');
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeHidden();
  });

  test('再生オーバーレイ: reader-preview is visible', async ({ page }) => {
    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.enter();
    });
    await page.waitForTimeout(300);
    const preview = page.locator('#reader-preview');
    if (await preview.count() > 0) {
      await expect(preview).toBeVisible();
    }
  });

  test('再生オーバーレイ: current editor content is rendered instead of empty state', async ({ page }) => {
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

  test('再生オーバーレイ: exit closes overlay and preserves ui mode', async ({ page }) => {
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
    const open = await page.evaluate(() => document.documentElement.hasAttribute('data-reader-overlay-open'));
    expect(mode).toBe(prevMode);
    expect(open).toBe(false);
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
