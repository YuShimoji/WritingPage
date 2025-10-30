const { test, expect } = require('@playwright/test');

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

    // Wait for mirror to update
    await page.waitForTimeout(100);

    const endTime = Date.now();
    const renderTime = endTime - startTime;

    // Should render within reasonable time (< 500ms)
    expect(renderTime).toBeLessThan(500);
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
    await page.waitForSelector('#gadgets-panel', { timeout: 10000 });
  });

  test('should display HUD settings gadget', async ({ page }) => {
    // HUDSettings gadget should be available in assist group
    const hudGadget = await page.locator('#gadgets-panel .gadget:has-text("HUD設定")');
    await expect(hudGadget).toBeVisible();
  });

  test('should update HUD width setting', async ({ page }) => {
    // Click on HUD Settings in gadget panel
    await page.locator('#gadgets-panel .gadget:has-text("HUD設定")').click();

    // Wait for settings to load
    await page.waitForSelector('input[type="number"][min="120"]', { timeout: 5000 });

    // Change width
    const widthInput = await page.locator('input[type="number"][min="120"]');
    await widthInput.fill('300');

    // Save settings
    await page.locator('button:has-text("設定を保存")').click();

    // Check that alert appears
    await page.waitForEvent('dialog');
    await page.on('dialog', dialog => dialog.accept());
  });

  test('should update HUD font size setting', async ({ page }) => {
    await page.locator('#gadgets-panel .gadget:has-text("HUD設定")').click();

    await page.waitForSelector('input[type="number"][min="10"]', { timeout: 5000 });

    // Change font size
    const fontSizeInputs = await page.locator('input[type="number"][min="10"]');
    const fsInput = fontSizeInputs.nth(1); // Second font size input (the one with min=10)
    await fsInput.fill('16');

    await page.locator('button:has-text("設定を保存")').click();
    await page.waitForEvent('dialog');
    await page.on('dialog', dialog => dialog.accept());
  });

  test('should update HUD colors', async ({ page }) => {
    await page.locator('#gadgets-panel .gadget:has-text("HUD設定")').click();

    await page.waitForSelector('input[type="color"]', { timeout: 5000 });

    // Change background color
    const colorInputs = await page.locator('input[type="color"]');
    await colorInputs.nth(0).fill('#ff0000'); // Red background

    await page.locator('button:has-text("設定を保存")').click();
    await page.waitForEvent('dialog');
    await page.on('dialog', dialog => dialog.accept());
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

    // Click next button
    await page.click('#search-next');
    await page.waitForTimeout(100);

    // Editor should have selection at second match
    const editor = await page.locator('#editor');
    const selectionStart = await editor.evaluate(el => el.selectionStart);
    const selectionEnd = await editor.evaluate(el => el.selectionEnd);

    // Should be at "Second match" (around position 12-17)
    expect(selectionStart).toBeGreaterThanOrEqual(12);
    expect(selectionEnd).toBeLessThanOrEqual(18);
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

    // Check that first "hello" is replaced
    await expect(page.locator('#editor')).toHaveValue('Hello world, hi universe');
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

    // Check that dialog appears
    await page.waitForEvent('dialog');
    await page.on('dialog', dialog => dialog.accept());

    // Check all occurrences are replaced
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

    // Should find only 2 matches (not "HELLO")
    const matchCount = await page.locator('#match-count');
    await expect(matchCount).toContainText('2 件一致しました');
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
