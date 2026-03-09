// @ts-check
const { test, expect } = require('@playwright/test');
const { enableAllGadgets, openSidebarGroup } = require('./helpers');

test.describe('Story Wiki', () => {
  test.setTimeout(60000);
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => {
      try { return !!window.ZWGadgets; } catch (_) { return false; }
    }, { timeout: 20000 });
    await enableAllGadgets(page);
    await openSidebarGroup(page, 'edit');
    await page.waitForSelector('#edit-gadgets-panel .gadget-wrapper', { state: 'attached', timeout: 10000 });
  });

  test('should display Story Wiki gadget in sidebar', async ({ page }) => {
    const wikiRoot = page.locator('#edit-gadgets-panel .swiki-root');
    await expect(wikiRoot).toBeAttached({ timeout: 5000 });
  });

  test('should show category list with counts', async ({ page }) => {
    const categoryList = page.locator('#edit-gadgets-panel .swiki-category-list');
    await expect(categoryList).toBeAttached({ timeout: 5000 });

    // プリセットカテゴリが表示される
    const categoryRows = page.locator('#edit-gadgets-panel .swiki-category-row');
    const count = await categoryRows.count();
    expect(count).toBeGreaterThanOrEqual(7); // 7種のプリセットカテゴリ
  });

  test('should create new wiki entry via dialog', async ({ page }) => {
    // 新規作成ボタンをクリック
    const createBtn = page.locator('#edit-gadgets-panel .swiki-btn-new');
    await createBtn.waitFor({ timeout: 5000 });
    await createBtn.click();

    // ダイアログが表示される
    const dialog = page.locator('.swiki-dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // フォーム入力
    await dialog.locator('input[placeholder="用語名"]').fill('テストキャラ');
    await dialog.locator('select').selectOption('character');

    // 作成
    await dialog.locator('button:text-is("作成")').click();

    // ダイアログが閉じて全画面ペインに遷移
    await expect(dialog).not.toBeVisible({ timeout: 3000 });

    // ストレージにエントリが作成されている
    const entry = await page.evaluate(() => {
      var s = window.ZenWriterStorage;
      if (!s || !s.searchStoryWiki) return null;
      var results = s.searchStoryWiki('テストキャラ');
      return results.length > 0 ? results[0] : null;
    });
    expect(entry).not.toBeNull();
    expect(entry.title).toBe('テストキャラ');
    expect(entry.category).toBe('character');
  });

  test('should search entries', async ({ page }) => {
    // 事前にエントリを作成
    await page.evaluate(() => {
      var s = window.ZenWriterStorage;
      if (!s || !s.createStoryWikiEntry) return;
      s.createStoryWikiEntry({ title: '検索テスト用語', category: 'term' });
    });

    // 検索入力
    const searchInput = page.locator('#edit-gadgets-panel .swiki-search-input').first();
    await searchInput.waitFor({ timeout: 5000 });
    await searchInput.fill('検索テスト');

    // 検索結果が表示される
    await page.waitForTimeout(300);
    const results = page.locator('#edit-gadgets-panel .swiki-search-results .swiki-entry-item');
    const count = await results.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should open full pane and display tree', async ({ page }) => {
    // 事前にエントリを作成
    await page.evaluate(() => {
      var s = window.ZenWriterStorage;
      if (!s || !s.createStoryWikiEntry) return;
      s.createStoryWikiEntry({ title: '王都', category: 'location' });
      s.createStoryWikiEntry({ title: '魔王', category: 'character' });
    });

    // 展開ボタン
    const expandBtn = page.locator('#edit-gadgets-panel .swiki-btn-expand');
    await expandBtn.waitFor({ timeout: 5000 });
    await expandBtn.click();

    // 全画面ペインが表示される
    const fullPane = page.locator('.swiki-full');
    await expect(fullPane).toBeVisible({ timeout: 3000 });

    // ツリーペインにカテゴリが表示される
    const treeCats = page.locator('.swiki-tree-cat');
    const count = await treeCats.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display entry detail in full pane', async ({ page }) => {
    // 事前にエントリを作成
    await page.evaluate(() => {
      var s = window.ZenWriterStorage;
      if (!s || !s.createStoryWikiEntry) return;
      s.createStoryWikiEntry({
        title: '勇者太郎',
        category: 'character',
        content: '## 概要\n本作の主人公。',
        tags: ['主人公', '勇者']
      });
    });

    // 展開→ツリーのアイテムをクリック
    const expandBtn = page.locator('#edit-gadgets-panel .swiki-btn-expand');
    await expandBtn.waitFor({ timeout: 5000 });
    await expandBtn.click();

    await page.waitForSelector('.swiki-full', { timeout: 3000 });
    const treeItem = page.locator('.swiki-tree-item', { hasText: '勇者太郎' });
    await treeItem.waitFor({ timeout: 3000 });
    await treeItem.click();

    // 詳細ペインにタイトルとカテゴリが表示される
    const detailTitle = page.locator('.swiki-detail-title');
    await expect(detailTitle).toHaveText('勇者太郎');

    const catBadge = page.locator('.swiki-detail-cat-badge');
    await expect(catBadge).toHaveText('キャラクター');
  });

  test('should handle storage CRUD operations', async ({ page }) => {
    // Storage API のCRUD操作を検証
    const result = await page.evaluate(() => {
      var s = window.ZenWriterStorage;
      if (!s || !s.createStoryWikiEntry) return { error: 'API not available' };

      // Create
      var entry = s.createStoryWikiEntry({
        title: 'CRUD Test',
        category: 'item',
        aliases: ['テストアイテム'],
        content: 'テスト用'
      });
      if (!entry || !entry.id) return { error: 'create failed' };

      // Read
      var read = s.getStoryWikiEntry(entry.id);
      if (!read || read.title !== 'CRUD Test') return { error: 'read failed' };

      // Update
      var updated = s.updateStoryWikiEntry(entry.id, { title: 'Updated CRUD' });
      if (!updated || updated.title !== 'Updated CRUD') return { error: 'update failed' };

      // Search
      var found = s.searchStoryWiki('Updated CRUD');
      if (!found || found.length === 0) return { error: 'search failed' };

      // Delete
      var deleted = s.deleteStoryWikiEntry(entry.id);
      if (!deleted) return { error: 'delete failed' };

      var afterDelete = s.getStoryWikiEntry(entry.id);
      if (afterDelete !== null) return { error: 'entry still exists after delete' };

      return { success: true };
    });

    expect(result.success).toBe(true);
  });

  test('should have scan button in sidebar', async ({ page }) => {
    const scanBtn = page.locator('#edit-gadgets-panel .swiki-btn-scan');
    await expect(scanBtn).toBeAttached({ timeout: 5000 });
    await expect(scanBtn).toHaveText('スキャン');
  });

  test('should expose auto-detect API', async ({ page }) => {
    const hasApi = await page.evaluate(() => {
      return typeof window.StoryWikiAutoDetect !== 'undefined' &&
        typeof window.StoryWikiAutoDetect.scan === 'function' &&
        typeof window.StoryWikiAutoDetect.extractCandidates === 'function';
    });
    expect(hasApi).toBe(true);
  });

  test('should extract candidate terms from text', async ({ page }) => {
    const candidates = await page.evaluate(() => {
      if (!window.StoryWikiAutoDetect) return [];
      return window.StoryWikiAutoDetect.extractCandidates(
        'アルファガルド王国のセリーヌ姫はアルファガルド城でセリーヌの日記を読んだ。'
      );
    });
    // カタカナ連続が2回以上出現する用語が検出される
    expect(candidates.length).toBeGreaterThan(0);
    var terms = candidates.map(function (c) { return c.term; });
    expect(terms).toContain('アルファガルド');
    expect(terms).toContain('セリーヌ');
  });

  test('should fire zen-content-saved event on save', async ({ page }) => {
    // イベントリスナーを設置
    await page.evaluate(() => {
      window._testSaveEventFired = false;
      document.addEventListener('zen-content-saved', function () {
        window._testSaveEventFired = true;
      });
    });

    // エディタに入力して保存をトリガー
    const editor = page.locator('#editor');
    await editor.waitFor({ timeout: 5000 });
    await editor.click();
    await page.keyboard.type('テスト保存');
    // Ctrl+S で保存
    await page.keyboard.press('Control+s');
    await page.waitForTimeout(500);

    const fired = await page.evaluate(() => window._testSaveEventFired);
    expect(fired).toBe(true);
  });

  test('should toggle auto-detect setting', async ({ page }) => {
    const result = await page.evaluate(() => {
      var s = window.ZenWriterStorage;
      if (!s || !s.loadStoryWikiSettings || !s.saveStoryWikiSettings) return null;

      // デフォルトはオン
      var settings = s.loadStoryWikiSettings();
      var defaultState = settings.autoDetect;

      // オフに変更
      s.saveStoryWikiSettings({ autoDetect: false, ignoredTerms: [] });
      var offSettings = s.loadStoryWikiSettings();

      // オンに戻す
      s.saveStoryWikiSettings({ autoDetect: true, ignoredTerms: [] });
      var onSettings = s.loadStoryWikiSettings();

      return {
        defaultOn: defaultState,
        turnedOff: !offSettings.autoDetect,
        turnedOn: onSettings.autoDetect
      };
    });

    expect(result).not.toBeNull();
    expect(result.defaultOn).toBe(true);
    expect(result.turnedOff).toBe(true);
    expect(result.turnedOn).toBe(true);
  });

  test('should have editor highlight API', async ({ page }) => {
    const hasApi = await page.evaluate(() => {
      return typeof window.StoryWikiEditor !== 'undefined' &&
        typeof window.StoryWikiEditor.highlight === 'function' &&
        typeof window.StoryWikiEditor.clearHighlights === 'function';
    });
    expect(hasApi).toBe(true);
  });
});
