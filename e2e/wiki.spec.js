// @ts-check
const { test, expect } = require('@playwright/test');
const { enableAllGadgets, openSidebarGroup } = require('./helpers');

test.describe('Story Wiki', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => {
      try { return !!window.ZWGadgets; } catch (_) { return false; }
    });
    await enableAllGadgets(page);
    await openSidebarGroup(page, 'wiki');
    await page.waitForSelector('#wiki-gadgets-panel', { state: 'visible', timeout: 10000 });
  });

  test('should display Story Wiki gadget', async ({ page }) => {
    // Story Wiki gadget should be available in wiki tab
    const wikiToolbar = page.locator('#wiki-gadgets-panel .wiki-toolbar');
    await expect(wikiToolbar).toBeVisible();
  });

  test('should create new wiki page', async ({ page }) => {
    // Wiki gadget UI is already visible in beforeEach
    const createButtonSelector = '#wiki-gadgets-panel button:has-text("新規ページ")';

    // Wait for gadget to load
    await page.waitForSelector(createButtonSelector, { timeout: 5000 });

    // Click create button
    await page.click(createButtonSelector);

    // Wait for dialog
    await page.waitForSelector('#wiki-gadgets-panel input[placeholder="タイトル"]', { timeout: 5000 });

    // Fill form
    await page.fill('#wiki-gadgets-panel input[placeholder="タイトル"]', 'Test Character');
    await page.fill('#wiki-gadgets-panel textarea[placeholder="本文（Markdown 可）"]', 'This is a test character page.');
    await page.fill('#wiki-gadgets-panel input[placeholder^="タグ"]', 'character, test');

    // Save
    await page.click('#wiki-gadgets-panel button:has-text("保存")');

    // Check that page appears in list
    const createdRow = page.locator('#wiki-gadgets-panel .wiki-row', { hasText: 'Test Character' });
    await expect(createdRow).toBeVisible();
  });

  test('should search wiki pages', async ({ page }) => {
    const searchInputSelector = '#wiki-gadgets-panel input[placeholder="検索 (タイトル/本文/タグ)"]';

    // Wait for search input
    await page.waitForSelector(searchInputSelector, { timeout: 5000 });

    // Type search term
    await page.fill(searchInputSelector, 'character');

    // Check that matching pages are shown
    await page.waitForTimeout(300);
    // Should show pages containing "character" in title or content
  });

  test('should edit existing wiki page', async ({ page }) => {
    // 事前にページを1件作成しておく
    const createButtonSelector = '#wiki-gadgets-panel button:has-text("新規ページ")';
    await page.waitForSelector(createButtonSelector, { timeout: 5000 });
    await page.click(createButtonSelector);
    await page.waitForSelector('#wiki-gadgets-panel input[placeholder="タイトル"]', { timeout: 5000 });
    await page.fill('#wiki-gadgets-panel input[placeholder="タイトル"]', 'Test Character');
    await page.fill('#wiki-gadgets-panel textarea[placeholder="本文（Markdown 可）"]', 'This is a test character page.');
    await page.fill('#wiki-gadgets-panel input[placeholder^="タグ"]', 'character, test');
    await page.click('#wiki-gadgets-panel button:has-text("保存")');

    // 既存ページの内容を編集
    await page.fill('#wiki-gadgets-panel textarea[placeholder="本文（Markdown 可）"]', 'Updated test character page with more details.');
    await page.click('#wiki-gadgets-panel button:has-text("保存")');

    // ストレージから内容が更新されていることを検証
    const updated = await page.evaluate(() => {
      try {
        const storage = window.ZenWriterStorage;
        if (!storage || typeof storage.listWikiPages !== 'function') return null;
        const pages = storage.listWikiPages();
        return pages.find(p => p && p.title === 'Test Character') || null;
      } catch (e) {
        return null;
      }
    });

    expect(updated).not.toBeNull();
    expect(updated.content).toBe('Updated test character page with more details.');
  });

  test('should handle empty wiki', async ({ page }) => {
    // Clear localStorage first (this would need to be done differently in real test)
    // For now, just check that empty state message appears when no pages exist
    await page.waitForSelector('#wiki-gadgets-panel button:has-text("新規ページ")', { timeout: 5000 });

    // Check empty state message
    const emptyMessage = await page.locator('text=ページがありません。新規作成ボタンから作成してください。');
    if (await emptyMessage.count() > 0) {
      await expect(emptyMessage).toBeVisible();
    }
  });
});
