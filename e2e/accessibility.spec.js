// E2E: アクセシビリティ機能の検証（キーボード操作、ARIA属性、スクリーンリーダー対応）
const { test, expect } = require('@playwright/test');

const pageUrl = '/index.html';

test.describe('Accessibility E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(pageUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#editor', { timeout: 10000 });
  });

  test('キーボード操作でサイドバーを開閉できる', async ({ page }) => {
    const sidebar = page.locator('#sidebar');
    const toggleBtn = page.locator('#toggle-sidebar');
    
    // 初期状態を確認
    await expect(sidebar).not.toHaveClass(/open/);
    
    // Tabキーでサイドバーボタンにフォーカス
    await page.keyboard.press('Tab');
    await expect(toggleBtn).toBeFocused();
    
    // Enterキーでサイドバーを開く
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await expect(sidebar).toHaveClass(/open/);
    
    // aria-expanded属性が更新されていることを確認
    const ariaExpanded = await toggleBtn.getAttribute('aria-expanded');
    expect(ariaExpanded).toBe('true');
    
    // Spaceキーでサイドバーを閉じる
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    await expect(sidebar).not.toHaveClass(/open/);
    
    const ariaExpanded2 = await toggleBtn.getAttribute('aria-expanded');
    expect(ariaExpanded2).toBe('false');
  });

  test('Tabキーでフォーカスが順序通りに移動する', async ({ page }) => {
    // サイドバーを開く
    await page.locator('#toggle-sidebar').click();
    await page.waitForTimeout(300);
    
    // エディタにフォーカス
    await page.locator('#editor').focus();
    
    // Tabキーで次の要素に移動
    await page.keyboard.press('Tab');
    
    // フォーカスが移動したことを確認（具体的な要素は実装に依存）
    const focusedElement = await page.evaluate(() => document.activeElement.id || document.activeElement.className);
    expect(focusedElement).toBeTruthy();
    
    // Shift+Tabで逆方向に移動
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#editor')).toBeFocused();
  });

  test('Enter/Spaceキーでボタンを実行できる', async ({ page }) => {
    const toggleBtn = page.locator('#toggle-sidebar');
    
    // ボタンにフォーカス
    await toggleBtn.focus();
    
    // Enterキーで実行
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await expect(page.locator('#sidebar')).toHaveClass(/open/);
    
    // Spaceキーで再度実行
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    await expect(page.locator('#sidebar')).not.toHaveClass(/open/);
  });

  test('ESCキーでモーダルダイアログを閉じられる', async ({ page }) => {
    // 検索パネルを開く
    await page.evaluate(() => { if (window.ZenWriterEditor && typeof window.ZenWriterEditor.toggleSearchPanel === 'function') window.ZenWriterEditor.toggleSearchPanel(); });
    await page.waitForTimeout(300);
    
    const searchPanel = page.locator('#search-panel');
    await expect(searchPanel).toBeVisible();
    
    // ESCキーで閉じる
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await expect(searchPanel).not.toBeVisible();
  });

  test('サイドバータブを矢印キーで切り替えられる', async ({ page }) => {
    // サイドバーを開く
    await page.locator('#toggle-sidebar').click();
    await page.waitForTimeout(300);
    
    // 最初のタブにフォーカス
    const firstTab = page.locator('.sidebar-tab').first();
    await firstTab.focus();
    
    // 右矢印キーで次のタブに移動
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    
    // タブが切り替わっていることを確認
    const secondTab = page.locator('.sidebar-tab').nth(1);
    await expect(secondTab).toBeFocused();
    
    // 左矢印キーで前のタブに戻る
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(100);
    await expect(firstTab).toBeFocused();
  });

  test('ARIA属性が適切に設定されている', async ({ page }) => {
    // サイドバー
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toHaveAttribute('role', 'complementary');
    await expect(sidebar).toHaveAttribute('aria-label');
    
    // ツールバー
    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toHaveAttribute('role', 'toolbar');
    
    // エディタ
    const editor = page.locator('#editor');
    await expect(editor).toHaveAttribute('role', 'textbox');
    await expect(editor).toHaveAttribute('aria-label');
    
    // ボタンのaria-expanded属性
    const toggleSidebarBtn = page.locator('#toggle-sidebar');
    await expect(toggleSidebarBtn).toHaveAttribute('aria-expanded');
    
    // タブのaria-selected属性
    const firstTab = page.locator('.sidebar-tab').first();
    await expect(firstTab).toHaveAttribute('aria-selected');
    await expect(firstTab).toHaveAttribute('role', 'tab');
  });

  test('フォーカス表示が視認可能である', async ({ page }) => {
    // キーボード操作を検出
    await page.keyboard.press('Tab');
    
    // keyboard-userクラスが追加されていることを確認
    const hasKeyboardUserClass = await page.evaluate(() => {
      return document.body.classList.contains('keyboard-user');
    });
    expect(hasKeyboardUserClass).toBe(true);
    
    // フォーカスされた要素にoutlineが適用されていることを確認
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const style = window.getComputedStyle(el);
      return {
        outlineWidth: style.outlineWidth,
        outlineStyle: style.outlineStyle,
        outlineColor: style.outlineColor
      };
    });
    
    expect(focusedElement).toBeTruthy();
    // フォーカス表示が適用されている（outlineWidthが0以外）
    expect(parseInt(focusedElement.outlineWidth) || 0).toBeGreaterThan(0);
  });

  test('スクリーンリーダー用のaria-liveリージョンが機能する', async ({ page }) => {
    // 文字数表示のaria-live属性を確認
    const wordCount = page.locator('.word-count');
    await expect(wordCount).toHaveAttribute('aria-live', 'polite');
    await expect(wordCount).toHaveAttribute('role', 'status');
    
    // エディタにテキストを入力
    await page.locator('#editor').fill('テストテキスト');
    await page.waitForTimeout(500);
    
    // 文字数が更新されていることを確認
    const wordCountText = await wordCount.textContent();
    expect(wordCountText).toContain('文字');
  });

  test('モーダルダイアログが開いた時にフォーカスが移動する', async ({ page }) => {
    // 検索パネルを開く
    await page.evaluate(() => { if (window.ZenWriterEditor && typeof window.ZenWriterEditor.toggleSearchPanel === 'function') window.ZenWriterEditor.toggleSearchPanel(); });
    await page.waitForTimeout(300);
    
    const searchPanel = page.locator('#search-panel');
    await expect(searchPanel).toBeVisible();
    
    // 検索入力欄にフォーカスが移動していることを確認
    const searchInput = page.locator('#search-input');
    await expect(searchInput).toBeFocused();
    
    // aria-modal属性を確認
    await expect(searchPanel).toHaveAttribute('aria-modal', 'true');
  });

  test('プレビューパネルのaria-expanded属性が更新される', async ({ page }) => {
    const previewToggle = page.locator('#toggle-preview');
    const previewPanel = page.locator('#editor-preview');
    
    // 初期状態を確認
    const initialExpanded = await previewToggle.getAttribute('aria-expanded');
    const initialCollapsed = await previewPanel.evaluate(el => el.classList.contains('editor-preview--collapsed'));
    
    // トグルボタンをクリック
    await previewToggle.click();
    await page.waitForTimeout(300);
    
    // aria-expanded属性が更新されていることを確認
    const newExpanded = await previewToggle.getAttribute('aria-expanded');
    const newCollapsed = await previewPanel.evaluate(el => el.classList.contains('editor-preview--collapsed'));
    
    expect(newExpanded).not.toBe(initialExpanded);
    expect(newCollapsed).not.toBe(initialCollapsed);
  });
});
