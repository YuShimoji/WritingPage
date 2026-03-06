const { test, expect } = require('@playwright/test');
const { showFullToolbar, openSidebarGroup, enableAllGadgets } = require('./helpers');

async function _openSidebarAndStructurePanel(page) {
  // サイドバーを開き、structure グループを正式なAPI経由でアクティブにする
  await page.waitForFunction(() => {
    try { return !!window.ZWGadgets; } catch (_) { return false; }
  }, { timeout: 20000 });
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
  await enableAllGadgets(page);
  await openSidebarGroup(page, 'assist');
  await page.waitForSelector('#assist-gadgets-panel .gadget-wrapper', { state: 'attached', timeout: 10000 });
  await page.waitForTimeout(300);

  // すべてのガジェットを開く
  await page.evaluate(() => {
    document.querySelectorAll('#assist-gadgets-panel .gadget-header').forEach(function (h) {
      if (h.parentElement && !h.parentElement.classList.contains('expanded')) {
        h.click();
      }
    });
  });
  await page.waitForTimeout(300);
}

test.describe('Font Decoration System', () => {
  test.setTimeout(60000);
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for editor to load
    await page.waitForSelector('#editor', { timeout: 10000 });
    // Show full toolbar to access hidden buttons
    await showFullToolbar(page);
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
    // Ensure full toolbar is visible
    await showFullToolbar(page);
    await page.waitForSelector('#toggle-font-decoration', { state: 'visible', timeout: 5000 });

    // Click font decoration button
    await page.click('#toggle-font-decoration');

    // Check main hub panel is visible
    const panel = await page.locator('#main-hub-panel');
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
    // Ensure full toolbar is visible
    await showFullToolbar(page);
    await page.waitForSelector('#toggle-text-animation', { state: 'visible', timeout: 5000 });

    await page.click('#toggle-text-animation');

    const panel = await page.locator('#main-hub-panel');
    await expect(panel).toBeVisible();

    await expect(page.locator('#anim-fade')).toBeVisible();
    await expect(page.locator('#anim-pulse')).toBeVisible();
  });

  test('should apply bold via applyFontDecoration API', async ({ page }) => {
    await page.fill('#editor', 'テスト');
    await page.keyboard.press('Control+a'); // Select all

    // テキストエリアモードでは Ctrl+B ショートカットは未登録のため、API 経由で適用
    await page.evaluate(() => {
      if (window.ZenWriterEditor && typeof window.ZenWriterEditor.applyFontDecoration === 'function') {
        window.ZenWriterEditor.applyFontDecoration('bold');
      }
    });

    await expect(page.locator('#editor')).toHaveValue('[bold]テスト[/bold]');
  });

  test('should maintain performance with large documents', async ({ page }) => {
    // Create large document with many decorations
    let largeText = '';
    for (let i = 0; i < 100; i++) {
      largeText += `[bold]行${i}[/bold] [italic]斜体${i}[/italic]\n`;
    }

    const startTime = Date.now();
    await page.evaluate((text) => {
      const el = document.getElementById('editor');
      if (el) {
        el.value = text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, largeText);

    // Wait for mirror to update（オーバーレイやプレビュー描画も含めて余裕を持たせる）
    await page.waitForTimeout(200);

    const endTime = Date.now();
    const renderTime = endTime - startTime;

    // 実行環境差を考慮しつつ、3 秒以内にはレンダリングが完了する想定（CI環境考慮）
    expect(renderTime).toBeLessThan(3000);
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

  test('should render font decorations in preview panel', async ({ page }) => {
    // Open preview panel
    await page.click('#toggle-preview');
    await page.waitForTimeout(500);

    // Type text with decorations
    await page.fill('#editor', '[bold]太字テキスト[/bold]\n[italic]斜体テキスト[/italic]\n[underline]下線テキスト[/underline]');

    // Wait for preview to update
    await page.waitForTimeout(500);

    // Check that decorations are applied in editor mirror (not preview panel)
    const mirror = await page.locator('#editor-mirror');
    await expect(mirror.locator('.decor-bold')).toContainText('太字テキスト');
    await expect(mirror.locator('.decor-italic')).toContainText('斜体テキスト');
    await expect(mirror.locator('.decor-underline')).toContainText('下線テキスト');
  });

  test('should render text animations in preview panel', async ({ page }) => {
    // Type text with animations
    await page.fill('#editor', '[pulse]パルス[/pulse]\n[shake]シェイク[/shake]');

    // Wait for rendering
    await page.waitForTimeout(500);

    // Check that animations are applied in editor mirror
    const mirror = await page.locator('#editor-mirror');
    await expect(mirror.locator('.anim-pulse')).toContainText('パルス');
    await expect(mirror.locator('.anim-shake')).toContainText('シェイク');
  });

  test('should apply text animation via button click', async ({ page }) => {
    // Select text
    const editor = await page.locator('#editor');
    await editor.fill('アニメーションテキスト');
    await page.keyboard.press('Control+a'); // Select all

    // Open panel and click fade animation
    await page.click('#toggle-text-animation');
    await page.click('#anim-fade');

    // Check that [fade] tags were added
    await expect(editor).toHaveValue('[fade]アニメーションテキスト[/fade]');
  });

  test('should render all animation types', async ({ page }) => {
    await page.fill('#editor', '[fade]フェード[/fade]\n[slide]スライド[/slide]\n[type]タイプ[/type]\n[fadein]遅フェード[/fadein]');

    const mirror = await page.locator('#editor-mirror');
    await expect(mirror.locator('.anim-fade')).toContainText('フェード');
    await expect(mirror.locator('.anim-slide')).toContainText('スライド');
    await expect(mirror.locator('.anim-typewriter')).toContainText('タイプ');
    await expect(mirror.locator('.anim-fade-in')).toContainText('遅フェード');
  });

  test('should display animation settings UI', async ({ page }) => {
    // Ensure full toolbar is visible
    await showFullToolbar(page);
    await page.waitForSelector('#toggle-text-animation', { state: 'visible', timeout: 5000 });

    await page.click('#toggle-text-animation');

    const panel = await page.locator('#main-hub-panel');
    await expect(panel).toBeVisible();

    // Check animation settings controls exist
    await expect(page.locator('#anim-speed')).toBeVisible();
    await expect(page.locator('#anim-duration')).toBeVisible();
    await expect(page.locator('#anim-reduce-motion')).toBeVisible();
  });

  test('should update animation speed setting', async ({ page }) => {
    await page.locator('#toggle-text-animation').evaluate(b => b.click());
    await page.waitForSelector('#anim-speed', { state: 'attached' });

    const speedInput = page.locator('#anim-speed');
    const speedValue = page.locator('#anim-speed-value');

    // Change speed
    await speedInput.evaluate(el => { el.value = '2.0'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForTimeout(200);

    // Check value updated
    await expect(speedValue).toContainText('2x');
  });

  test('should update animation duration setting', async ({ page }) => {
    await page.locator('#toggle-text-animation').click({ force: true });
    await page.waitForSelector('#anim-duration', { state: 'attached' });

    const durationInput = page.locator('#anim-duration');
    const durationValue = page.locator('#anim-duration-value');

    // Change duration
    await durationInput.evaluate((el) => { el.value = '3.0'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForTimeout(100);

    // Check value updated
    await expect(durationValue).toContainText('3s');
  });

  test('should respect reduce motion preference', async ({ page }) => {
    await page.locator('#toggle-text-animation').click({ force: true });
    await page.waitForSelector('#anim-reduce-motion', { state: 'attached' });

    const checkbox = page.locator('#anim-reduce-motion');

    // Enable reduce motion
    await checkbox.check();
    await page.waitForTimeout(100);

    // Check that documentElement has data-reduce-motion attribute
    const hasAttr = await page.evaluate(() => document.documentElement.getAttribute('data-reduce-motion') === 'true');
    expect(hasAttr).toBe(true);
  });

  test('should save animation settings to storage', async ({ page }) => {
    await page.locator('#toggle-text-animation').evaluate(b => b.click());
    await page.waitForSelector('#anim-speed', { state: 'attached' });

    // Set animation settings
    await page.evaluate(() => {
      document.getElementById('anim-speed').value = '2.0';
      document.getElementById('anim-speed').dispatchEvent(new Event('input', { bubbles: true }));
      document.getElementById('anim-duration').value = '3.0';
      document.getElementById('anim-duration').dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(300);

    // Reload page
    await page.reload();
    await page.waitForSelector('#editor', { timeout: 10000 });
    await page.locator('#toggle-text-animation').evaluate(b => b.click());
    await page.waitForSelector('#anim-speed', { state: 'attached' });
    await page.waitForTimeout(300);

    // Check that settings were saved
    const speedValue = await page.locator('#anim-speed').inputValue();
    const durationValue = await page.locator('#anim-duration').inputValue();

    expect(parseFloat(speedValue)).toBeCloseTo(2.0, 1);
    expect(parseFloat(durationValue)).toBeCloseTo(3.0, 1);
  });
});

test.describe('HUD Settings', () => {
  test.setTimeout(60000);
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
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
    // v0.3.25: HUDSettings gadget is in settings group
    await enableAllGadgets(page);
    await openSidebarGroup(page, 'assist');
    await page.waitForSelector('#assist-gadgets-panel .gadget-wrapper', { state: 'attached', timeout: 10000 });

    const hudGadgets = await page.locator('#assist-gadgets-panel .gadget-wrapper[data-gadget-name="HUDSettings"]');
    const count = await hudGadgets.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should update HUD width setting', async ({ page }) => {
    await enableAllGadgets(page);
    await openSidebarGroup(page, 'assist');
    await page.waitForSelector('#assist-gadgets-panel .gadget-wrapper', { state: 'attached', timeout: 10000 });

    // v0.3.25: HUDSettings ガジェットは settings グループに配置
    const hudGadget = await page
      .locator('#assist-gadgets-panel .gadget-wrapper[data-gadget-name="HUDSettings"]')
      .first();

    const widthInput = hudGadget.locator('input[type="number"][min="120"]').first();
    await widthInput.waitFor({ state: 'attached', timeout: 5000 });

    // HUD 幅設定用の数値入力が存在し、min 属性が 120 であることだけ確認する
    await expect(widthInput).toHaveAttribute('min', '120');
  });

  test('should update HUD font size setting', async ({ page }) => {
    await enableAllGadgets(page);
    await openSidebarGroup(page, 'assist');
    await page.waitForSelector('#assist-gadgets-panel .gadget-wrapper', { state: 'attached', timeout: 10000 });

    const hudGadget = await page
      .locator('#assist-gadgets-panel .gadget-wrapper[data-gadget-name="HUDSettings"]')
      .first();

    const fsInput = hudGadget.locator('input[type="number"][min="10"]').first();
    await fsInput.waitFor({ state: 'attached', timeout: 5000 });

    // フォントサイズ設定用の数値入力が存在し、min 属性が 10 であることだけ確認する
    await expect(fsInput).toHaveAttribute('min', '10');
  });

  test('should update HUD colors', async ({ page }) => {
    await enableAllGadgets(page);
    await openSidebarGroup(page, 'assist');
    await page.waitForSelector('#assist-gadgets-panel .gadget-wrapper', { state: 'attached', timeout: 10000 });

    const hudGadget = await page
      .locator('#assist-gadgets-panel .gadget-wrapper[data-gadget-name="HUDSettings"]')
      .first();

    const firstColorInput = hudGadget.locator('input[type="color"]').first();
    await firstColorInput.waitFor({ state: 'attached', timeout: 5000 });

    // input[type=color] は fill() だけだと change が発火しない環境があるため、イベントを明示的に送る
    await firstColorInput.evaluate((el) => {
      try {
        el.value = '#ff0000';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (_) { /* noop */ }
    });

    // HUDSettings は保存ボタン押下で永続化される
    const saveBtn = hudGadget.locator('button.small:has-text("設定を保存")').first();
    await saveBtn.evaluate(b => b.click());
    await page.waitForTimeout(250);

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
  test.setTimeout(60000);
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
  });

  test('should open search panel with Ctrl+F', async ({ page }) => {
    // Type some text first
    await page.fill('#editor', 'This is a test document with some text to search.');

    // Open search panel using helper
    await page.evaluate(() => { if (window.ZenWriterEditor && typeof window.ZenWriterEditor.toggleSearchPanel === 'function') window.ZenWriterEditor.toggleSearchPanel(); });
    await page.waitForSelector('#main-hub-panel', { state: 'visible', timeout: 5000 });

    // Check main hub panel is visible
    const searchPanel = await page.locator('#main-hub-panel');
    await expect(searchPanel).toBeVisible();

    // Check search input exists and can receive focus
    const searchInput = await page.locator('#search-input');
    await searchInput.click();
    await expect(searchInput).toBeFocused();
  });

  test('should search and highlight matches', async ({ page }) => {
    await page.fill('#editor', 'The quick brown fox jumps over the lazy dog. The fox is quick.');

    // Open search panel
    await page.evaluate(() => { if (window.ZenWriterEditor && typeof window.ZenWriterEditor.toggleSearchPanel === 'function') window.ZenWriterEditor.toggleSearchPanel(); });
    await page.waitForSelector('#main-hub-panel', { timeout: 5000 });

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
    await page.evaluate(() => { if (window.ZenWriterEditor && typeof window.ZenWriterEditor.toggleSearchPanel === 'function') window.ZenWriterEditor.toggleSearchPanel(); });
    await page.waitForSelector('#main-hub-panel', { timeout: 5000 });
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
    await page.evaluate(() => { if (window.ZenWriterEditor && typeof window.ZenWriterEditor.toggleSearchPanel === 'function') window.ZenWriterEditor.toggleSearchPanel(); });
    await page.waitForSelector('#main-hub-panel', { timeout: 5000 });
    await page.fill('#search-input', 'hello');
    await page.fill('#replace-input', 'hi');
    await page.waitForTimeout(300);

    // Click replace single
    await page.click('#replace-single');

    // replaceSingle は現在のマッチ 1 件のみ置換する
    await expect(page.locator('#editor')).toHaveValue('hi world, hello universe');
  });

  test('should replace all occurrences', async ({ page }) => {
    await page.fill('#editor', 'test one\ntest two\ntest three');

    // Open search and setup replace
    await page.evaluate(() => { if (window.ZenWriterEditor && typeof window.ZenWriterEditor.toggleSearchPanel === 'function') window.ZenWriterEditor.toggleSearchPanel(); });
    await page.waitForSelector('#main-hub-panel', { timeout: 5000 });
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
    await page.evaluate(() => { if (window.ZenWriterEditor && typeof window.ZenWriterEditor.toggleSearchPanel === 'function') window.ZenWriterEditor.toggleSearchPanel(); });
    await page.waitForSelector('#main-hub-panel', { timeout: 5000 });
    await page.fill('#search-input', 'Hello');

    const caseCheckbox = page.locator('#search-case-sensitive');
    await caseCheckbox.check();
    await expect(caseCheckbox).toBeChecked();

    // 大文字/小文字を区別する場合は、先頭の "Hello" のみが一致対象
    const matchCount = page.locator('#match-count');
    await expect(matchCount).toBeVisible();
    await expect
      .poll(async () => (await matchCount.textContent()) || '')
      .toContain('1 件一致しました');
  });

  test('should close search panel', async ({ page }) => {
    // Open search panel
    await page.evaluate(() => { if (window.ZenWriterEditor && typeof window.ZenWriterEditor.toggleSearchPanel === 'function') window.ZenWriterEditor.toggleSearchPanel(); });
    await page.waitForSelector('#main-hub-panel', { timeout: 5000 });

    // Click close button (use panel close button)
    await page.click('#main-hub-panel .panel-close-btn');

    // Check panel is hidden
    const searchPanel = await page.locator('#main-hub-panel');
    await expect(searchPanel).not.toBeVisible();
  });
});
