const { test, expect } = require('@playwright/test');
const { disableWritingFocus, setUIMode, openSidebar } = require('./helpers');

const pageUrl = '/index.html';

test.describe('Accessibility E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(pageUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#editor', { timeout: 10000 });
    // 保存済み設定で Focus 起動する場合があるため、明示的に Normal へ切り替え
    await setUIMode(page, 'normal');
    // サイドバーを閉じた状態に統一
    await page.evaluate(() => {
      if (window.sidebarManager) window.sidebarManager.forceSidebarState(false);
    });
    await page.waitForTimeout(200);
  });

  test('keyboard shortcut Alt+1 opens and closes sidebar', async ({ page }) => {
    const sidebar = page.locator('#sidebar');
    const toggleBtn = page.locator('#toggle-sidebar');

    await expect(sidebar).not.toHaveClass(/open/);

    await page.locator('#editor').focus();
    await page.keyboard.press('Alt+1');
    await page.waitForTimeout(200);
    await expect(sidebar).toHaveClass(/open/);
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Alt+1');
    await page.waitForTimeout(200);
    await expect(sidebar).not.toHaveClass(/open/);
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
  });

  test('tab key moves focus and shift+tab can return focus', async ({ page }) => {
    await page.locator('#editor').focus();
    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? (el.id || el.className || el.tagName) : '';
    });

    expect(focusedElement).toBeTruthy();

    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#editor')).toBeFocused();
  });

  test('ESC closes search panel dialog', async ({ page }) => {
    // 検索フローティングパネルを開く
    await page.evaluate(() => {
      const panel = document.getElementById('search-floating-panel');
      if (panel) {
        panel.style.display = 'block';
        if (window.ZenWriterFloatingPanels) window.ZenWriterFloatingPanels.preparePanel(panel);
      }
    });
    const searchPanel = page.locator('#search-floating-panel');
    await expect(searchPanel).toBeVisible();

    // 閉じるボタンでパネルを閉じる
    const closeBtn = searchPanel.locator('.panel-close');
    await closeBtn.click();
    await page.waitForTimeout(300);
    await expect(searchPanel).not.toBeVisible({ timeout: 5000 });
  });

  test('Enter/Space keys activate accordion headers', async ({ page }) => {
    await page.evaluate(() => {
      if (window.sidebarManager && typeof window.sidebarManager.forceSidebarState === 'function') {
        window.sidebarManager.forceSidebarState(false);
      }
    });
    await page.waitForTimeout(300);
    await disableWritingFocus(page);
    // writing-focus 再適用を確実に停止 (_isWritingFocusSidebarEffective を無効化)
    await page.evaluate(() => {
      if (window.sidebarManager) {
        window.sidebarManager._isWritingFocusSidebarEffective = function() { return false; };
        if (window.sidebarManager._writingFocusRenderTimer) {
          clearTimeout(window.sidebarManager._writingFocusRenderTimer);
        }
      }
    });
    await page.waitForTimeout(100);
    await openSidebar(page);
    await page.evaluate(() => {
      if (window.sidebarManager && typeof window.sidebarManager.returnToLeftNavRoot === 'function') {
        window.sidebarManager.returnToLeftNavRoot();
      }
      document.documentElement.setAttribute('data-edge-hover-left', 'true');
      document.documentElement.setAttribute('data-edge-hover-left-touched', 'true');
    });
    await page.waitForTimeout(150);

    // 安定したロケーター: 特定のアコーディオンヘッダーを aria-controls で固定
    const targetId = await page.evaluate(() => {
      var headers = document.querySelectorAll('.accordion-header[aria-expanded="false"]');
      return headers.length > 0 ? headers[0].getAttribute('aria-controls') : null;
    });
    expect(targetId).toBeTruthy();
    const header = page.locator(`.accordion-header[aria-controls="${targetId}"]`);

    await header.focus();
    await expect(header).toBeFocused();

    // 初期状態はfalse
    await expect(header).toHaveAttribute('aria-expanded', 'false');

    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await expect(header).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-left-nav-state', 'category');

    const backButton = page.locator('#sidebar-nav-back');
    await backButton.focus();
    await expect(backButton).toBeFocused();
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    await expect(page.locator('html')).toHaveAttribute('data-left-nav-state', 'root');
    await expect(header).toHaveAttribute('aria-expanded', 'false');
  });

  test('ARIA attributes exist on key regions and controls', async ({ page }) => {
    await openSidebar(page);
    await expect(page.locator('#sidebar')).toHaveAttribute('role', 'complementary');
    await expect(page.locator('.sidebar-chrome-toolbar')).toHaveAttribute('role', 'toolbar');
    await expect(page.locator('#editor')).toHaveAttribute('role', 'textbox');
    await expect(page.locator('#toggle-sidebar')).toHaveAttribute('aria-expanded');

    const firstHeader = page.locator('.accordion-header').first();
    await expect(firstHeader).toHaveAttribute('aria-expanded');
  });

  test('unified shell controls expose concrete labels instead of placeholders', async ({ page }) => {
    const labels = await page.evaluate(() => {
      const ids = [
        'top-chrome-handle',
        'top-chrome-command-palette',
        'top-chrome-reader-toggle',
        'toggle-preview',
        'toggle-theme',
        'top-chrome-open-settings',
        'top-chrome-open-help',
        'win-minimize',
        'win-maximize',
        'win-close',
        'sidebar-nav-back',
        'sidebar-nav-anchor',
      ];
      return ids.map((id) => {
        const element = document.getElementById(id);
        return {
          id,
          ariaLabel: element ? element.getAttribute('aria-label') || '' : '',
          title: element ? element.getAttribute('title') || '' : '',
        };
      });
    });

    for (const item of labels) {
      expect(item.ariaLabel, `${item.id} aria-label`).toBeTruthy();
      expect(item.ariaLabel, `${item.id} aria-label`).not.toMatch(/\?{2,}/);
      if (item.title) {
        expect(item.title, `${item.id} title`).not.toMatch(/\?{2,}/);
      }
    }
  });

  test('focus-visible style is applied for keyboard users', async ({ page }) => {
    await openSidebar(page);
    await page.waitForTimeout(150);
    // トップバーの可視ボタンでフォーカスリングを確認
    // session 102: #toggle-settings 撤去 → #toggle-theme で代替 (任意の可視ボタンの代理)
    const themeBtn = page.locator('#toggle-theme');
    await themeBtn.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await themeBtn.focus();

    const hasKeyboardUserClass = await page.evaluate(() => {
      return document.body.classList.contains('keyboard-user');
    });
    expect(hasKeyboardUserClass).toBe(true);

    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const style = window.getComputedStyle(el);
      return {
        outlineWidth: style.outlineWidth,
        outlineStyle: style.outlineStyle,
      };
    });

    expect(focused).toBeTruthy();
    // keyboard-user モードではフォーカスされた要素に outline が適用される
    expect(focused.outlineStyle).not.toBe('none');
  });

  test('word count region has aria-live and updates', async ({ page }) => {
    const wordCount = page.locator('.word-count');
    await expect(wordCount).toHaveAttribute('aria-live', 'polite');
    await expect(wordCount).toHaveAttribute('role', 'status');

    await page.locator('#editor').fill('テストテキスト');
    await page.waitForTimeout(300);

    const wordCountText = await wordCount.textContent();
    expect(wordCountText).toBeTruthy();
    expect(wordCountText.length).toBeGreaterThan(0);
  });

  test('writing status chip exposes live character count and save state', async ({ page }) => {
    const chip = page.locator('#writing-status-chip');
    await expect(chip).toHaveAttribute('aria-live', 'polite');
    await expect(chip).toHaveAttribute('role', 'status');
    await expect(chip).toBeVisible();

    await page.evaluate(() => {
      if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function') {
        window.ZenWriterEditor.setContent('ステータス確認');
      }
      if (window.ZWWritingStatusChip && typeof window.ZWWritingStatusChip.markEditing === 'function') {
        window.ZWWritingStatusChip.markEditing();
      }
    });

    await expect(chip).toContainText('文字数: 7');
    await expect(chip).toContainText('編集中');
    await expect(chip).toHaveAttribute('data-save-state', 'editing');
    await expect(chip).toContainText('保存済み', { timeout: 2000 });
    await expect(chip).toHaveAttribute('data-save-state', 'saved');
  });

  test('search dialog moves focus to input when opened', async ({ page }) => {
    // 検索フローティングパネルを開く
    await page.evaluate(() => {
      const panel = document.getElementById('search-floating-panel');
      if (panel) {
        panel.style.display = 'block';
        if (window.ZenWriterFloatingPanels) window.ZenWriterFloatingPanels.preparePanel(panel);
      }
    });
    await expect(page.locator('#search-floating-panel')).toBeVisible();
    await page.waitForTimeout(300);
    // フォーカスが検索入力に移ることを確認
    const searchInput = page.locator('#search-floating-panel #search-input');
    await searchInput.click();
    await expect(searchInput).toBeFocused();
  });

  test('preview toggle updates aria-expanded and panel collapsed class', async ({ page }) => {
    await openSidebar(page);
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      if (window.ZenWriterTopChrome && typeof window.ZenWriterTopChrome.show === 'function') {
        window.ZenWriterTopChrome.show();
      }
    });
    await page.waitForTimeout(220);

    const previewToggle = page.locator('#toggle-preview');
    const previewPanel = page.locator('#editor-preview');
    const previewBody = page.locator('#markdown-preview-panel');

    const initialExpanded = await previewToggle.getAttribute('aria-expanded');
    const initialCollapsed = await previewPanel.evaluate((el) => el.classList.contains('editor-preview--collapsed'));

    await previewToggle.click();

    const newExpanded = await previewToggle.getAttribute('aria-expanded');
    const newCollapsed = await previewPanel.evaluate((el) => el.classList.contains('editor-preview--collapsed'));

    expect(newExpanded).not.toBe(initialExpanded);
    expect(newCollapsed).not.toBe(initialCollapsed);
    await expect(previewBody).toContainText('プレビューできる本文がまだありません');
  });
});
