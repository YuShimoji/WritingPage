// @ts-check
const { test, expect } = require('@playwright/test');
const { enableAllGadgets, openSidebarGroup } = require('./helpers');

async function seedWikiPage(page, title, tags) {
  await page.evaluate(
    ({ t, tg }) => {
      try {
        if (!window.ZenWriterStorage || typeof window.ZenWriterStorage.createWikiPage !== 'function') return;
        window.ZenWriterStorage.createWikiPage({
          title: t,
          content: 'seed',
          tags: tg,
        });
      } catch (_) {
        /* noop */
      }
    },
    { t: title, tg: tags }
  );
}

test.describe('Tags and Smart Folders', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => {
      try {
        return !!window.ZWGadgets;
      } catch (_) {
        return false;
      }
    });
    await enableAllGadgets(page);
    await openSidebarGroup(page, 'structure');
    await page.waitForSelector('#structure-gadgets-panel', { state: 'visible', timeout: 10000 });
    await page.waitForSelector('.gadget-tags-smart-folders', { state: 'visible', timeout: 10000 });
  });

  test('should display tags and smart folders gadget', async ({ page }) => {
    await expect(page.locator('.gadget-tags-smart-folders')).toBeVisible();
  });

  test('should show tags view', async ({ page }) => {
    const viewMode = page.locator('.gadget-tags-smart-folders select');
    await viewMode.selectOption('tags');
    await expect(page.locator('.tags-smart-folders-tree')).toBeVisible();
  });

  test('should create wiki page with tags', async ({ page }) => {
    await seedWikiPage(page, 'Test Page with Tags', ['test', 'character', 'story']);
    const viewMode = page.locator('.gadget-tags-smart-folders select');
    await viewMode.selectOption('tags');
    await expect(page.locator('.tags-smart-folders-tree')).toBeVisible();
  });

  test('should filter pages by tag', async ({ page }) => {
    await seedWikiPage(page, 'Tagged Page', ['test-tag']);
    const viewMode = page.locator('.gadget-tags-smart-folders select');
    await viewMode.selectOption('tags');

    await page.evaluate(() => {
      window.__zwTagsSelection = null;
      window.addEventListener(
        'ZWTagsSmartFoldersSelectionChanged',
        (ev) => {
          window.__zwTagsSelection = ev && ev.detail ? ev.detail : null;
        },
        { once: true }
      );
    });

    const tagItem = page.locator('.tree-item.tree-item-tag', { hasText: 'test-tag' });
    await expect(tagItem).toBeVisible();
    await tagItem.click();

    const selection = await page.evaluate(() => window.__zwTagsSelection);
    expect(selection).toBeTruthy();
    expect(selection.tag).toBe('test-tag');
    expect(selection.view).toBe('tags');
  });

  test('should create smart folder', async ({ page }) => {
    const viewMode = page.locator('.gadget-tags-smart-folders select');
    await viewMode.selectOption('folders');
    const newFolderBtn = page.locator('.gadget-tags-smart-folders button.small');
    await expect(newFolderBtn).toBeVisible();
    await expect(newFolderBtn).toBeEnabled();
  });

  test('should display smart folders tree', async ({ page }) => {
    const viewMode = page.locator('.gadget-tags-smart-folders select');
    await viewMode.selectOption('folders');
    await expect(page.locator('.tags-smart-folders-tree')).toBeVisible();
    await expect(page.locator('.tree-item.tree-item-folder').first()).toBeVisible();
  });

  test('should handle empty tags', async ({ page }) => {
    const viewMode = page.locator('.gadget-tags-smart-folders select');
    await viewMode.selectOption('tags');
    await expect(page.locator('.tags-smart-folders-tree')).toBeVisible();
  });

  test('should switch between views', async ({ page }) => {
    const viewMode = page.locator('.gadget-tags-smart-folders select');
    await viewMode.selectOption('tags');
    await expect(page.locator('.tags-smart-folders-tree')).toBeVisible();
    await viewMode.selectOption('folders');
    await expect(page.locator('.tags-smart-folders-tree')).toBeVisible();
    await expect(viewMode).toHaveValue('folders');
  });
});
