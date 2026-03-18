// @ts-check
const { test, expect } = require('@playwright/test');
const { enableAllGadgets, openSidebarGroup } = require('./helpers');

test.describe('Story Wiki グラフビュー統合', () => {
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

  test('should generate graph data from Story Wiki entries', async ({ page }) => {
    // Story Wiki エントリを作成
    await page.evaluate(() => {
      var s = window.ZenWriterStorage;
      if (!s || !s.createStoryWikiEntry) return;
      s.createStoryWikiEntry({ title: 'Hero', category: 'character', content: '[[Kingdom]] の勇者。', source: 'manual' });
      s.createStoryWikiEntry({ title: 'Kingdom', category: 'location', content: '王国。[[Hero]] が住む。', source: 'manual' });
    });

    const graphData = await page.evaluate(() => {
      if (!window.LinkGraph) return null;
      return window.LinkGraph.generateGraphData();
    });

    expect(graphData).not.toBeNull();
    expect(graphData.nodes.length).toBeGreaterThanOrEqual(2);
    expect(graphData.edges.length).toBeGreaterThanOrEqual(2);

    // カテゴリ情報が含まれる
    const heroNode = graphData.nodes.find(n => n.label === 'Hero');
    expect(heroNode).toBeDefined();
    expect(heroNode.category).toBe('character');

    const kingdomNode = graphData.nodes.find(n => n.label === 'Kingdom');
    expect(kingdomNode).toBeDefined();
    expect(kingdomNode.category).toBe('location');
  });

  test('should find backlinks from Story Wiki entries', async ({ page }) => {
    await page.evaluate(() => {
      var s = window.ZenWriterStorage;
      if (!s || !s.createStoryWikiEntry) return;
      s.createStoryWikiEntry({ title: 'Magic', category: 'concept', content: '古代の力。', source: 'manual' });
      s.createStoryWikiEntry({ title: 'Wizard', category: 'character', content: '[[Magic]] を使う者。', source: 'manual' });
      s.createStoryWikiEntry({ title: 'Scroll', category: 'item', content: '[[Magic]] の巻物。', source: 'manual' });
    });

    const backlinks = await page.evaluate(() => {
      if (!window.LinkGraph) return [];
      return window.LinkGraph.findBacklinks('Magic');
    });

    expect(backlinks.length).toBeGreaterThanOrEqual(2);
    const wizardBl = backlinks.find(bl => bl.sourceTitle === 'Wizard');
    expect(wizardBl).toBeDefined();
    expect(wizardBl.sourceType).toBe('story-wiki');
    expect(wizardBl.sourceCategory).toBe('character');
  });

  test('should expose CATEGORY_COLORS and renderLegend', async ({ page }) => {
    const hasNewAPIs = await page.evaluate(() => {
      return !!(window.LinkGraph &&
        window.LinkGraph.CATEGORY_COLORS &&
        typeof window.LinkGraph.renderLegend === 'function');
    });
    expect(hasNewAPIs).toBe(true);

    const colors = await page.evaluate(() => window.LinkGraph.CATEGORY_COLORS);
    expect(colors.character).toBeDefined();
    expect(colors.location).toBeDefined();
    expect(colors.item).toBeDefined();
  });

  test('should open graph overlay with legend from Story Wiki', async ({ page }) => {
    // テストデータ作成
    await page.evaluate(() => {
      var s = window.ZenWriterStorage;
      if (!s || !s.createStoryWikiEntry) return;
      s.createStoryWikiEntry({ title: 'Alice', category: 'character', content: '[[Wonderland]] の住人。', source: 'manual' });
      s.createStoryWikiEntry({ title: 'Wonderland', category: 'location', content: '不思議の国。', source: 'manual' });
    });

    // グラフボタンをクリック
    const graphBtn = page.locator('.swiki-btn-graph').first();
    await graphBtn.click();
    await page.waitForTimeout(500);

    // オーバーレイが表示される
    const overlay = page.locator('.swiki-graph-overlay');
    await expect(overlay).toBeVisible();

    // 凡例が表示される
    const legend = overlay.locator('.swiki-graph-legend, .link-graph-legend');
    await expect(legend).toBeVisible();

    // グラフノードが表示される
    const nodes = overlay.locator('.link-graph-node');
    expect(await nodes.count()).toBeGreaterThanOrEqual(2);

    // オーバーレイを閉じる
    await page.keyboard.press('Escape');
    await expect(overlay).not.toBeVisible();
  });

  test('should display backlinks in entry detail pane', async ({ page }) => {
    // テストデータ作成
    await page.evaluate(() => {
      var s = window.ZenWriterStorage;
      if (!s || !s.createStoryWikiEntry) return;
      s.createStoryWikiEntry({ title: 'Dragon', category: 'character', content: '強大な生物。', source: 'manual' });
      s.createStoryWikiEntry({ title: 'Knight', category: 'character', content: '[[Dragon]] を倒す者。', source: 'manual' });
    });

    // 展開ボタンで全画面モードに切り替え
    const expandBtn = page.locator('.swiki-btn-expand').first();
    await expandBtn.click();
    await page.waitForTimeout(300);

    // Dragon を選択
    const dragonItem = page.locator('.swiki-tree-item', { hasText: 'Dragon' });
    await dragonItem.click();
    await page.waitForTimeout(300);

    // バックリンクセクションが表示される
    const blSection = page.locator('.swiki-detail-backlinks');
    await expect(blSection).toBeVisible();

    // Knight からのバックリンクが存在
    const blItem = blSection.locator('.swiki-backlink-link', { hasText: 'Knight' });
    await expect(blItem).toBeVisible();
  });

  test('should generate graph with relatedIds edges', async ({ page }) => {
    // relatedIds で接続されたエントリを作成
    const ids = await page.evaluate(() => {
      var s = window.ZenWriterStorage;
      if (!s || !s.createStoryWikiEntry) return {};
      var a = s.createStoryWikiEntry({ title: 'Sun', category: 'concept', content: '太陽。', source: 'manual' });
      var b = s.createStoryWikiEntry({ title: 'Moon', category: 'concept', content: '月。', source: 'manual' });
      if (a && b && s.updateStoryWikiEntry) {
        s.updateStoryWikiEntry(a.id, { relatedIds: [b.id] });
      }
      return { a: a && a.id, b: b && b.id };
    });

    const graphData = await page.evaluate(() => {
      if (!window.LinkGraph) return null;
      return window.LinkGraph.generateGraphData();
    });

    expect(graphData).not.toBeNull();
    // relatedIds によるエッジが存在
    const relatedEdge = graphData.edges.find(e => e.type === 'related');
    expect(relatedEdge).toBeDefined();
  });
});
