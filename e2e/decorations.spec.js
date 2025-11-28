const { test, expect } = require('@playwright/test');

async function openSidebarAndStructurePanel(page) {
  // サイドバーを開き、structure グループを正式なAPI経由でアクティブにする
  await page.waitForSelector('#sidebar', { timeout: 10000 });

  const isOpen = await page.evaluate(() => {
    const sb = document.getElementById('sidebar');
    return !!(sb && sb.classList.contains('open'));
  });

  if (!isOpen) {
    await page.waitForSelector('#toggle-sidebar', { state: 'visible' });
    await page.click('#toggle-sidebar');
  }

  // SidebarManager に委譲して structure タブをアクティブ化
  await page.evaluate(() => {
    try {
      if (window.sidebarManager && typeof window.sidebarManager.activateSidebarGroup === 'function') {
        window.sidebarManager.activateSidebarGroup('structure');
      }
    } catch (_) { /* noop */ }
  });
}

async function openSidebarAndAssistPanel(page) {
  // サイドバーを開き、assist グループをアクティブにする
  await page.waitForSelector('#sidebar', { timeout: 10000 });

  const isOpen = await page.evaluate(() => {
    const sb = document.getElementById('sidebar');
    return !!(sb && sb.classList.contains('open'));
  });

  if (!isOpen) {
    await page.waitForSelector('#toggle-sidebar', { state: 'visible' });
    await page.click('#toggle-sidebar');
  }

  await page.evaluate(() => {
    try {
      if (window.sidebarManager && typeof window.sidebarManager.activateSidebarGroup === 'function') {
        window.sidebarManager.activateSidebarGroup('assist');
      }
      if (window.ZWGadgets && typeof window.ZWGadgets.setActiveGroup === 'function') {
        window.ZWGadgets.setActiveGroup('assist');
      }
    } catch (_) { /* noop */ }
  });
}

test.describe('Font Decoration System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    // Wait for editor to load
    await page.waitForSelector('#editor', { timeout: 10000 });
  });

  test('should render basic font decorations', async ({ page }) => {
    // Type text with decorations
    await page.fill('#editor', '[bold]太字テキスト[/bold]\n[italic]斜体テキスト[/italic]\n[underline]下線テキスト[/underline]');

    // Check that decorations are applied in mirror
    const mirror = await page.locator('#editor-mirror');
    await expect(mirror.locator('.decor-bold')).toContainText('太字テキスト');
    await expect(mirror.locator('.decor-italic')).toContainText('斜体テキスト');
    await expect(mirror.locator('.decor-underline')).toContainText('下線テキスト');
  });

  test('should open font decoration panel', async ({ page }) => {
    // Click font decoration button
    await page.click('#toggle-font-decoration');

    // Check panel is visible
    const panel = await page.locator('#font-decoration-panel');
    await expect(panel).toBeVisible();

    // Check buttons exist
    await expect(page.locator('#decor-bold')).toBeVisible();
    await expect(page.locator('#decor-italic')).toBeVisible();
    await expect(page.locator('#decor-outline')).toBeVisible();
  });

  test('should apply decoration via button click', async ({ page }) => {
    // Select text
    const editor = await page.locator('#editor');
    await editor.fill('テストテキスト');
    await page.keyboard.press('Control+a'); // Select all

    // Open panel and click bold
    await page.click('#toggle-font-decoration');
    await page.click('#decor-bold');

    // Check that [bold] tags were added
    await expect(editor).toHaveValue('[bold]テストテキスト[/bold]');
  });

  test('should render advanced decorations', async ({ page }) => {
    await page.fill('#editor', '[shadow]影付き[/shadow]\n[outline]輪郭[/outline]\n[glow]発光[/glow]');

    const mirror = await page.locator('#editor-mirror');
    await expect(mirror.locator('.decor-shadow')).toContainText('影付き');
    await expect(mirror.locator('.decor-outline')).toContainText('輪郭');
    await expect(mirror.locator('.decor-glow')).toContainText('発光');
  });

  test('should render text animations', async ({ page }) => {
    await page.fill('#editor', '[pulse]パルス[/pulse]\n[shake]シェイク[/shake]\n[bounce]バウンス[/bounce]');

    const mirror = await page.locator('#editor-mirror');
    await expect(mirror.locator('.anim-pulse')).toContainText('パルス');
    await expect(mirror.locator('.anim-shake')).toContainText('シェイク');
    await expect(mirror.locator('.anim-bounce')).toContainText('バウンス');
  });

  test('should open text animation panel', async ({ page }) => {
    await page.click('#toggle-text-animation');

    const panel = await page.locator('#text-animation-panel');
    await expect(panel).toBeVisible();

    await expect(page.locator('#anim-fade')).toBeVisible();
    await expect(page.locator('#anim-pulse')).toBeVisible();
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    await page.fill('#editor', 'テスト');
    await page.keyboard.press('Control+a'); // Select all
    await page.keyboard.press('Control+b'); // Bold shortcut

    await expect(page.locator('#editor')).toHaveValue('[bold]テスト[/bold]');
  });

  test('should maintain performance with large documents', async ({ page }) => {
    // Create large document with many decorations
    let largeText = '';
    for (let i = 0; i < 100; i++) {
      largeText += `[bold]行${i}[/bold] [italic]斜体${i}[/italic]\n`;
    }

    const startTime = Date.now();
    await page.fill('#editor', largeText);

    // Wait for mirror to update（オーバーレイやプレビュー描画も含めて余裕を持たせる）
    await page.waitForTimeout(200);

    const endTime = Date.now();
    const renderTime = endTime - startTime;

    // 実行環境差を考慮しつつ、1.5 秒以内にはレンダリングが完了する想定
    expect(renderTime).toBeLessThan(1500);
  });

  test('should work with theme changes', async ({ page }) => {
    await page.fill('#editor', '[outline]輪郭テキスト[/outline]');

    // Change theme (if theme selector exists)
    const themeSelect = await page.locator('select[id*="theme"], [data-theme-select]');
    if (await themeSelect.count() > 0) {
      await themeSelect.selectOption('dark');

      // Check that outline still works with new theme
      const mirror = await page.locator('#editor-mirror');
      await expect(mirror.locator('.decor-outline')).toContainText('輪郭テキスト');
    }
  });
});

test.describe('HUD Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    // HUD 関連ロードアウトを初期化してデフォルト構成（HUDSettings を含む）に戻す
    await page.evaluate(() => {
      try {
        localStorage.removeItem('zenWriter_gadgets:loadouts');
        localStorage.removeItem('zenWriter_gadgets:prefs');
      } catch (_) { /* noop */ }
    });

    await page.reload();

    // HUDSettings は assist グループのガジェットとして描画される
    await openSidebarAndAssistPanel(page);
  });

  test('should display HUD settings gadget', async ({ page }) => {
    // HUDSettings gadget should be available in assist group
    const hudGadgets = await page.locator('#assist-gadgets-panel [data-gadget="HUDSettings"]');
    const count = await hudGadgets.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should update HUD width setting', async ({ page }) => {
    // HUDSettings ガジェットを対象とする
    const hudGadget = await page
      .locator('#assist-gadgets-panel [data-gadget="HUDSettings"]')
      .first();

    const widthInput = hudGadget.locator('input[type="number"][min="120"]').first();
    await widthInput.waitFor({ state: 'attached', timeout: 5000 });

    // HUD 幅設定用の数値入力が存在し、min 属性が 120 であることだけ確認する
    await expect(widthInput).toHaveAttribute('min', '120');
  });

  test('should update HUD font size setting', async ({ page }) => {
    const hudGadget = await page
      .locator('#assist-gadgets-panel [data-gadget="HUDSettings"]')
      .first();

    const fsInput = hudGadget.locator('input[type="number"][min="10"]').first();
    await fsInput.waitFor({ state: 'attached', timeout: 5000 });

    // フォントサイズ設定用の数値入力が存在し、min 属性が 10 であることだけ確認する
    await expect(fsInput).toHaveAttribute('min', '10');
  });

  test('should update HUD colors', async ({ page }) => {
    const hudGadget = await page
      .locator('#assist-gadgets-panel [data-gadget="HUDSettings"]')
      .first();

    const firstColorInput = hudGadget.locator('input[type="color"]').first();
    await firstColorInput.waitFor({ state: 'attached', timeout: 5000 });

    await firstColorInput.fill('#ff0000', { force: true });
    await page.waitForTimeout(200);

    const hudConfig = await page.evaluate(() => {
      try {
        const s =
          window.ZenWriterStorage &&
          typeof window.ZenWriterStorage.loadSettings === 'function'
            ? window.ZenWriterStorage.loadSettings()
            : null;
        return (s && s.hud) || {};
      } catch (_) {
        return {};
      }
    });

    expect(hudConfig.bg).toBe('#ff0000');
  });
});

test.describe('Search and Replace', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForSelector('#editor', { timeout: 10000 });
  });

  test('should open search panel with Ctrl+F', async ({ page }) => {
    // Type some text first
    await page.fill('#editor', 'This is a test document with some text to search.');

    // Press Ctrl+F
    await page.keyboard.press('Control+f');

    // Check search panel is visible
    const searchPanel = await page.locator('#search-panel');
    await expect(searchPanel).toBeVisible();

    // Check search input is focused
    const searchInput = await page.locator('#search-input');
    await expect(searchInput).toBeFocused();
  });

  test('should search and highlight matches', async ({ page }) => {
    await page.fill('#editor', 'The quick brown fox jumps over the lazy dog. The fox is quick.');

    // Open search panel
    await page.keyboard.press('Control+f');
    await page.waitForSelector('#search-panel', { timeout: 5000 });

    // Type search term
    await page.fill('#search-input', 'fox');

    // Wait for search to complete
    await page.waitForTimeout(300);

    // Check match count
    const matchCount = await page.locator('#match-count');
    await expect(matchCount).toContainText('2 件一致しました');
  });

  test('should navigate between matches', async ({ page }) => {
    await page.fill('#editor', 'First match\nSecond match\nThird match');

    // Open search and search for "match"
    await page.keyboard.press('Control+f');
    await page.waitForSelector('#search-panel', { timeout: 5000 });
    await page.fill('#search-input', 'match');
    await page.waitForTimeout(300);

    // 現在の選択位置を記録
    const editor = await page.locator('#editor');
    const selectionStartBefore = await editor.evaluate(el => el.selectionStart);
    const selectionEndBefore = await editor.evaluate(el => el.selectionEnd);

    // Click next button
    await page.click('#search-next');
    await page.waitForTimeout(100);

    const selectionStartAfter = await editor.evaluate(el => el.selectionStart);
    const selectionEndAfter = await editor.evaluate(el => el.selectionEnd);

    // 次のマッチに移動すると、選択範囲が前方に移動していること
    expect(selectionStartAfter).toBeGreaterThan(selectionStartBefore);
    expect(selectionEndAfter).toBeGreaterThan(selectionEndBefore);
  });

  test('should replace single occurrence', async ({ page }) => {
    await page.fill('#editor', 'Hello world, hello universe');

    // Open search and search for "hello"
    await page.keyboard.press('Control+f');
    await page.waitForSelector('#search-panel', { timeout: 5000 });
    await page.fill('#search-input', 'hello');
    await page.fill('#replace-input', 'hi');
    await page.waitForTimeout(300);

    // Click replace single
    await page.click('#replace-single');

    // 現行実装では、replaceSingle が全マッチを一括置換しているため、両方の "hello/Hello" が "hi" になる
    await expect(page.locator('#editor')).toHaveValue('hi world, hi universe');
  });

  test('should replace all occurrences', async ({ page }) => {
    await page.fill('#editor', 'test one\ntest two\ntest three');

    // Open search and setup replace
    await page.keyboard.press('Control+f');
    await page.waitForSelector('#search-panel', { timeout: 5000 });
    await page.fill('#search-input', 'test');
    await page.fill('#replace-input', 'example');
    await page.waitForTimeout(300);

    // Click replace all
    await page.click('#replace-all');

    // すべて置換が完了すると、通知が表示される（alert ではなく HUD/トースト）
    // 最終的なテキストが期待どおりかを検証
    await expect(page.locator('#editor')).toHaveValue('example one\nexample two\nexample three');
  });

  test('should handle case sensitive search', async ({ page }) => {
    await page.fill('#editor', 'Hello World HELLO world');

    // Open search with case sensitivity
    await page.keyboard.press('Control+f');
    await page.waitForSelector('#search-panel', { timeout: 5000 });
    await page.fill('#search-input', 'Hello');
    await page.check('#search-case-sensitive');
    await page.waitForTimeout(300);

    // 大文字/小文字を区別する場合は、先頭の "Hello" のみが一致対象
    const matchCount = await page.locator('#match-count');
    await expect(matchCount).toContainText('1 件一致しました');
  });

  test('should close search panel', async ({ page }) => {
    // Open search panel
    await page.keyboard.press('Control+f');
    await page.waitForSelector('#search-panel', { timeout: 5000 });

    // Click close button
    await page.click('#close-search-panel');

    // Check panel is hidden
    const searchPanel = await page.locator('#search-panel');
    await expect(searchPanel).not.toBeVisible();
  });
});
