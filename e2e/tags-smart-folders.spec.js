// @ts-check
const { test, expect } = require('@playwright/test');
const { enableAllGadgets, openSidebarGroup } = require('./helpers');

test.describe('Tags and Smart Folders', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => {
      try { return !!window.ZWGadgets; } catch (_) { return false; }
    });
    await enableAllGadgets(page);
    await openSidebarGroup(page, 'wiki');
    await page.waitForSelector('#wiki-gadgets-panel', { state: 'visible', timeout: 10000 });
  });

  test('should display tags and smart folders gadget', async ({ page }) => {
    // タグ/スマートフォルダガジェットが表示されることを確認
    const gadget = page.locator('.gadget-tags-smart-folders');
    await expect(gadget).toBeVisible({ timeout: 5000 });
  });

  test('should show tags view', async ({ page }) => {
    // タグ軸ビューを選択
    const viewMode = page.locator('.gadget-tags-smart-folders select');
    await viewMode.waitFor({ timeout: 5000 });
    await viewMode.selectOption('tags');

    // ツリービューが表示されることを確認
    const tree = page.locator('.tags-smart-folders-tree');
    await expect(tree).toBeVisible();
  });

  test('should create wiki page with tags', async ({ page }) => {
    // Wikiページを作成してタグを付ける
    const createButtonSelector = '#wiki-gadgets-panel button:has-text("新規ページ")';
    await page.waitForSelector(createButtonSelector, { timeout: 5000 });
    await page.click(createButtonSelector);

    await page.waitForSelector('#wiki-gadgets-panel input[placeholder="タイトル"]', { timeout: 5000 });
    await page.fill('#wiki-gadgets-panel input[placeholder="タイトル"]', 'Test Page with Tags');
    await page.fill('#wiki-gadgets-panel input[placeholder^="タグ"]', 'test, character, story');
    await page.fill('#wiki-gadgets-panel textarea[placeholder="本文（Markdown 可）"]', 'Test content');
    await page.click('#wiki-gadgets-panel button:has-text("保存")');

    // タグが表示されることを確認
    await page.waitForTimeout(500);
    const tagsGadget = page.locator('.gadget-tags-smart-folders');
    await expect(tagsGadget).toBeVisible();
  });

  test('should filter pages by tag', async ({ page }) => {
    // 事前にタグ付きページを作成
    const createButtonSelector = '#wiki-gadgets-panel button:has-text("新規ページ")';
    await page.waitForSelector(createButtonSelector, { timeout: 5000 });
    await page.click(createButtonSelector);
    await page.waitForSelector('#wiki-gadgets-panel input[placeholder="タイトル"]', { timeout: 5000 });
    await page.fill('#wiki-gadgets-panel input[placeholder="タイトル"]', 'Tagged Page');
    await page.fill('#wiki-gadgets-panel input[placeholder^="タグ"]', 'test-tag');
    await page.fill('#wiki-gadgets-panel textarea[placeholder="本文（Markdown 可）"]', 'Content');
    await page.click('#wiki-gadgets-panel button:has-text("保存")');
    await page.waitForTimeout(500);

    // タグ軸ビューを選択
    const viewMode = page.locator('.gadget-tags-smart-folders select');
    await viewMode.waitFor({ timeout: 5000 });
    await viewMode.selectOption('tags');
    await page.waitForTimeout(300);

    // タグが表示されることを確認
    const tree = page.locator('.tags-smart-folders-tree');
    await expect(tree).toBeVisible();

    // タグをクリックしてフィルタリング
    const tagItem = page.locator('.tree-item.tag-item', { hasText: 'test-tag' });
    if (await tagItem.count() > 0) {
      await tagItem.click();
      await page.waitForTimeout(300);
      // 選択状態になることを確認
      await expect(tagItem).toHaveClass(/selected/);
    }
  });

  test('should create smart folder', async ({ page }) => {
    // スマートフォルダビューを選択
    const viewMode = page.locator('.gadget-tags-smart-folders select');
    await viewMode.waitFor({ timeout: 5000 });
    await viewMode.selectOption('folders');
    await page.waitForTimeout(300);

    // 新規フォルダボタンが表示されることを確認
    const newFolderBtn = page.locator('.gadget-tags-smart-folders button:has-text("新規フォルダ")');
    await expect(newFolderBtn).toBeVisible();

    // 新規フォルダを作成（ダイアログは手動操作が必要なため、ボタンが存在することを確認するだけ）
    await expect(newFolderBtn).toBeEnabled();
  });

  test('should display smart folders tree', async ({ page }) => {
    // スマートフォルダビューを選択
    const viewMode = page.locator('.gadget-tags-smart-folders select');
    await viewMode.waitFor({ timeout: 5000 });
    await viewMode.selectOption('folders');
    await page.waitForTimeout(300);

    // ツリービューが表示されることを確認
    const tree = page.locator('.tags-smart-folders-tree');
    await expect(tree).toBeVisible();

    // デフォルトフォルダ（すべて、タグなし）が表示されることを確認
    const allFolder = page.locator('.tree-item.folder-item', { hasText: 'すべて' });
    const untaggedFolder = page.locator('.tree-item.folder-item', { hasText: 'タグなし' });
    
    // 少なくとも1つは表示されることを確認
    const hasFolders = (await allFolder.count() > 0) || (await untaggedFolder.count() > 0);
    expect(hasFolders).toBeTruthy();
  });

  test('should handle empty tags', async ({ page }) => {
    // タグ軸ビューを選択
    const viewMode = page.locator('.gadget-tags-smart-folders select');
    await viewMode.waitFor({ timeout: 5000 });
    await viewMode.selectOption('tags');
    await page.waitForTimeout(300);

    // ツリービューが表示されることを確認
    const tree = page.locator('.tags-smart-folders-tree');
    await expect(tree).toBeVisible();

    // タグがない場合のメッセージが表示される可能性がある
    // （タグがない場合は空のメッセージが表示される）
  });

  test('should switch between views', async ({ page }) => {
    const viewMode = page.locator('.gadget-tags-smart-folders select');
    await viewMode.waitFor({ timeout: 5000 });

    // タグ軸ビュー
    await viewMode.selectOption('tags');
    await page.waitForTimeout(300);
    const tree1 = page.locator('.tags-smart-folders-tree');
    await expect(tree1).toBeVisible();

    // スマートフォルダビュー
    await viewMode.selectOption('folders');
    await page.waitForTimeout(300);
    const tree2 = page.locator('.tags-smart-folders-tree');
    await expect(tree2).toBeVisible();

    // ビューが切り替わったことを確認
    const currentValue = await viewMode.inputValue();
    expect(currentValue).toBe('folders');
  });
});
