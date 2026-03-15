// @ts-check
const { test, expect } = require('@playwright/test');
const { enableAllGadgets, openSidebarGroup } = require('./helpers');

test.describe('Wikilinks/バックリンク/グラフ機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => {
      try { return !!window.ZWGadgets; } catch (_) { return false; }
    });
    await enableAllGadgets(page);
    await openSidebarGroup(page, 'edit');
    await page.waitForSelector('#edit-gadgets-panel .gadget-wrapper', { state: 'attached', timeout: 10000 });
  });

  test('should parse [[wikilink]] syntax', async ({ page }) => {
    // LinkGraph APIが利用可能か確認
    const hasLinkGraph = await page.evaluate(() => {
      return typeof window.LinkGraph !== 'undefined' &&
        typeof window.LinkGraph.parseWikilinks === 'function';
    });
    expect(hasLinkGraph).toBe(true);

    // Wikilinkが正しくパースされるか確認
    const parsedLinks = await page.evaluate(() => {
      if (!window.LinkGraph) return [];
      return window.LinkGraph.parseWikilinks('This is a [[test link]] and another [[link|display text]].');
    });

    expect(parsedLinks.length).toBe(2);
    expect(parsedLinks[0].link).toBe('test link');
    expect(parsedLinks[0].text).toBe('test link');
    expect(parsedLinks[1].link).toBe('link');
    expect(parsedLinks[1].text).toBe('display text');
  });

  test('should parse doc:// links', async ({ page }) => {
    const parsedLinks = await page.evaluate(() => {
      if (!window.LinkGraph) return [];
      return window.LinkGraph.parseDocLinks('Link to [document](doc://doc1#section1) and plain doc://doc2');
    });

    // Markdownリンクとプレーンテキストリンクが各1件ずつ検出される
    expect(parsedLinks.length).toBe(2);

    // Markdownリンク [document](doc://doc1#section1) を確認
    const markdownLink = parsedLinks.find(l => l.text === 'document');
    expect(markdownLink).toBeDefined();
    expect(markdownLink.link).toBe('doc://doc1#section1');
    expect(markdownLink.docId).toBe('doc1');
    expect(markdownLink.section).toBe('section1');

    // プレーンテキストリンク doc://doc2 を確認
    const plainLink = parsedLinks.find(l => l.text === 'doc2');
    expect(plainLink).toBeDefined();
    expect(plainLink.link).toBe('doc://doc2');
    expect(plainLink.docId).toBe('doc2');
  });

  test('should find backlinks', async ({ page }) => {
    // Storage API経由でWikiページを作成（新StoryWiki API使用）
    await page.evaluate(() => {
      var s = window.ZenWriterStorage;
      if (!s) return;
      // 旧API（link-graph.js互換のため）
      if (typeof s.createWikiPage === 'function') {
        s.createWikiPage({
          title: 'Target Page',
          content: 'This is the target page.',
          tags: [],
        });
        s.createWikiPage({
          title: 'Source Page',
          content: 'This links to [[Target Page]].',
          tags: [],
        });
      }
    });
    await page.waitForTimeout(300);

    // バックリンクを検索
    const backlinks = await page.evaluate((target) => {
      if (!window.LinkGraph || !window.ZenWriterStorage) return [];
      return window.LinkGraph.findBacklinks(target, window.ZenWriterStorage);
    }, 'Target Page');

    expect(backlinks.length).toBeGreaterThan(0);
    const sourceBacklink = backlinks.find(bl => bl.sourceTitle === 'Source Page');
    expect(sourceBacklink).toBeDefined();
  });

  test('should display link graph API', async ({ page }) => {
    // LinkGraph APIが利用可能か確認
    const hasLinkGraph = await page.evaluate(() => {
      return typeof window.LinkGraph !== 'undefined';
    });
    expect(hasLinkGraph).toBe(true);
  });

  test('should generate graph data from links', async ({ page }) => {
    // Storage API経由でページを作成
    await page.evaluate(() => {
      var s = window.ZenWriterStorage;
      if (!s || typeof s.createWikiPage !== 'function') return;
      s.createWikiPage({
        title: 'Page A',
        content: 'Links to [[Page B]].',
        tags: [],
      });
      s.createWikiPage({
        title: 'Page B',
        content: 'Links to [[Page A]].',
        tags: [],
      });
    });
    await page.waitForTimeout(300);

    // グラフデータを生成
    const graphData = await page.evaluate(() => {
      if (!window.LinkGraph || !window.ZenWriterStorage) return null;
      return window.LinkGraph.generateGraphData(window.ZenWriterStorage);
    });

    expect(graphData).not.toBeNull();
    expect(graphData.nodes.length).toBeGreaterThan(0);
    if (graphData.nodes.length >= 2) {
      expect(graphData.edges.length).toBeGreaterThan(0);
    }
  });

  test('should handle empty graph gracefully', async ({ page }) => {
    const graphData = await page.evaluate(() => {
      if (!window.LinkGraph || !window.ZenWriterStorage) return null;
      return window.LinkGraph.generateGraphData(window.ZenWriterStorage);
    });

    expect(graphData).not.toBeNull();
    expect(Array.isArray(graphData.nodes)).toBe(true);
    expect(Array.isArray(graphData.edges)).toBe(true);
  });
});
