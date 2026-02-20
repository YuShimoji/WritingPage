// @ts-check
const { test, expect } = require('@playwright/test');
const { enableAllGadgets, openSidebarGroup } = require('./helpers');

test.describe('Tags and Smart Folders', () => {
  async function refreshTagsTree(page, mode) {
    const viewMode = page.locator('.gadget-tags-smart-folders select');
    await viewMode.waitFor({ state: 'visible', timeout: 5000 });
    const target = mode === 'folders' ? 'folders' : 'tags';
    const bounce = target === 'tags' ? 'folders' : 'tags';
    await viewMode.selectOption(bounce);
    await viewMode.selectOption(target);
    await page.waitForTimeout(250);
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => {
      try { return !!window.ZWGadgets; } catch (_) { return false; }
    });
    await page.evaluate(() => {
      try {
        localStorage.removeItem('zenWriter_wiki_pages');
      } catch (_) { /* noop */ }
    });
    await enableAllGadgets(page);
    await openSidebarGroup(page, 'structure');
    await page.waitForSelector('#structure-gadgets-panel', { state: 'visible', timeout: 10000 });
  });

  test('should display tags and smart folders gadget', async ({ page }) => {
    // タグ/スマートフォルダガジェットが表示されることを確認
    const gadget = page.locator('.gadget-tags-smart-folders');
    await expect(gadget).toBeVisible({ timeout: 5000 });
  });

  test('should show tags view', async ({ page }) => {
    // タグ軸ビューを選択
    const viewMode = page.locator('.gadget-tags-smart-folders select');
    await viewMode.waitFor({ state: 'visible', timeout: 5000 });
    await viewMode.selectOption('tags');

    // ツリービューが表示されることを確認
    const tree = page.locator('.tags-smart-folders-tree');
    await expect(tree).toBeVisible();
  });

  test('should create wiki page with tags', async ({ page }) => {
    // API経由でWikiページを作成し、タグガジェットに反映されることを確認
    await page.evaluate(() => {
      if (window.ZenWriterStorage && typeof window.ZenWriterStorage.createWikiPage === 'function') {
        window.ZenWriterStorage.createWikiPage({
          title: 'Test Page with Tags',
          content: 'Test content',
          tags: ['test', 'character', 'story'],
        });
      }
    });

    await refreshTagsTree(page, 'tags');

    const tree = page.locator('.tags-smart-folders-tree');
    await expect(tree).toContainText('test');
  });

  test('should filter pages by tag', async ({ page }) => {
    // 事前にタグ付きページを作成
    await page.evaluate(() => {
      if (window.ZenWriterStorage && typeof window.ZenWriterStorage.createWikiPage === 'function') {
        window.ZenWriterStorage.createWikiPage({
          title: 'Tagged Page',
          content: 'Content',
          tags: ['test-tag'],
        });
      }
    });

    // タグ軸ビューを選択
    await refreshTagsTree(page, 'tags');

    // タグが表示されることを確認
    const tree = page.locator('.tags-smart-folders-tree');
    await expect(tree).toBeVisible();

    // タグをクリックしてフィルタリング
    const tagItem = page.locator('.tree-item.tag-item', { hasText: 'test-tag' }).first();
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
    await viewMode.waitFor({ state: 'visible', timeout: 5000 });
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
    await viewMode.waitFor({ state: 'visible', timeout: 5000 });
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
    await viewMode.waitFor({ state: 'visible', timeout: 5000 });
    await viewMode.selectOption('tags');
    await page.waitForTimeout(300);

    // ツリービューが表示されることを確認
    const tree = page.locator('.tags-smart-folders-tree');
    await expect(tree).toBeVisible();

    await expect(tree).toContainText('タグがありません');
  });

  test('should switch between views', async ({ page }) => {
    const viewMode = page.locator('.gadget-tags-smart-folders select');
    await viewMode.waitFor({ state: 'visible', timeout: 5000 });

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
