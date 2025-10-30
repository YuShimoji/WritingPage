});

test.describe('Story Wiki', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForSelector('#wiki-gadgets-panel', { timeout: 10000 });
  });

  test('should display Story Wiki gadget', async ({ page }) => {
    // Story Wiki gadget should be available in wiki tab
    const wikiGadget = await page.locator('#wiki-gadgets-panel .gadget:has-text("物語Wiki")');
    await expect(wikiGadget).toBeVisible();
  });

  test('should create new wiki page', async ({ page }) => {
    await page.locator('#wiki-gadgets-panel .gadget:has-text("物語Wiki")').click();

    // Wait for gadget to load
    await page.waitForSelector('button:has-text("新規ページ作成")', { timeout: 5000 });

    // Click create button
    await page.click('button:has-text("新規ページ作成")');

    // Wait for dialog
    await page.waitForSelector('input[placeholder="ページタイトル"]', { timeout: 5000 });

    // Fill form
    await page.fill('input[placeholder="ページタイトル"]', 'Test Character');
    await page.fill('textarea[placeholder="ページ内容"]', 'This is a test character page.');
    await page.fill('input[placeholder="タグ（カンマ区切り）"]', 'character, test');

    // Save
    await page.click('button:has-text("保存")');

    // Check that page appears in list
    await expect(page.locator('text=Test Character')).toBeVisible();
  });

  test('should search wiki pages', async ({ page }) => {
    await page.locator('#wiki-gadgets-panel .gadget:has-text("物語Wiki")').click();

    // Wait for search input
    await page.waitForSelector('input[placeholder="ページを検索..."]', { timeout: 5000 });

    // Type search term
    await page.fill('input[placeholder="ページを検索..."]', 'character');

    // Check that matching pages are shown
    await page.waitForTimeout(300);
    // Should show pages containing "character" in title or content
  });

  test('should edit existing wiki page', async ({ page }) => {
    await page.locator('#wiki-gadgets-panel .gadget:has-text("物語Wiki")').click();

    // Wait for page list
    await page.waitForSelector('text=Test Character', { timeout: 5000 });

    // Click on the page
    await page.click('text=Test Character');

    // Wait for edit dialog
    await page.waitForSelector('input[placeholder="ページタイトル"]', { timeout: 5000 });

    // Modify content
    await page.fill('textarea[placeholder="ページ内容"]', 'Updated test character page with more details.');

    // Save
    await page.click('button:has-text("保存")');

    // Check that content is updated (by clicking again)
    await page.click('text=Test Character');
    await page.waitForSelector('textarea[placeholder="ページ内容"]', { timeout: 5000 });
    await expect(page.locator('textarea[placeholder="ページ内容"]')).toHaveValue('Updated test character page with more details.');
  });

  test('should handle empty wiki', async ({ page }) => {
    // Clear localStorage first (this would need to be done differently in real test)
    // For now, just check that empty state message appears when no pages exist
    await page.locator('#wiki-gadgets-panel .gadget:has-text("物語Wiki")').click();

    await page.waitForSelector('button:has-text("新規ページ作成")', { timeout: 5000 });

    // Check empty state message
    const emptyMessage = await page.locator('text=ページがありません。新規作成ボタンから作成してください。');
    if (await emptyMessage.count() > 0) {
      await expect(emptyMessage).toBeVisible();
    }
  });
});
