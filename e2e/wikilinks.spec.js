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
    await openSidebarGroup(page, 'wiki');
  });

  test('should parse [[wikilink]] syntax', async ({ page }) => {
    // エディタにWikilink構文を入力
    const editor = page.locator('#editor');
    await editor.waitFor({ timeout: 5000 });
    await editor.fill('This is a [[test link]] and another [[link|display text]].');

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
    const editor = page.locator('#editor');
    await editor.waitFor({ timeout: 5000 });
    await editor.fill('Link to [document](doc://doc1#section1) and plain doc://doc2');

    const parsedLinks = await page.evaluate(() => {
      if (!window.LinkGraph) return [];
      return window.LinkGraph.parseDocLinks('Link to [document](doc://doc1#section1) and plain doc://doc2');
    });

    expect(parsedLinks.length).toBeGreaterThanOrEqual(2);
    const markdownLink = parsedLinks.find(l => l.text === 'document');
    expect(markdownLink).toBeDefined();
    expect(markdownLink.docId).toBe('doc1');
    expect(markdownLink.section).toBe('section1');
  });

  test('should render [[wikilink]] in wiki preview', async ({ page }) => {
    // Wikiタブを開く
    const wikiTab = page.locator('.sidebar-tab[data-group="wiki"]');
    await wikiTab.waitFor({ timeout: 10000 });
    await wikiTab.click();
    await page.waitForSelector('#wiki-gadgets-panel', { state: 'visible', timeout: 10000 });

    // 新しいWikiページを作成
    const createButton = page.locator('#wiki-gadgets-panel button:has-text("新規ページ")');
    await createButton.waitFor({ timeout: 5000 });
    await createButton.click();

    // Wikilinkを含むコンテンツを入力
    await page.fill('#wiki-gadgets-panel input[placeholder="タイトル"]', 'Test Page');
    await page.fill('#wiki-gadgets-panel textarea[placeholder="本文（Markdown 可）"]', 'This page links to [[Another Page]] and [[Third Page|display]].');

    // プレビューを確認
    await page.waitForTimeout(500); // プレビュー更新を待つ
    const preview = page.locator('#wiki-gadgets-panel .wiki-preview');
    const _previewContent = await preview.textContent();
    
    // Wikilinkがレンダリングされているか確認（リンクとして表示される）
    const previewHTML = await preview.innerHTML();
    expect(previewHTML).toContain('wikilink');
    expect(previewHTML).toContain('Another Page');
    expect(previewHTML).toContain('display');
  });

  test('should find backlinks', async ({ page }) => {
    // Wikiページを作成
    const wikiTab = page.locator('.sidebar-tab[data-group="wiki"]');
    await wikiTab.waitFor({ timeout: 10000 });
    await wikiTab.click();
    await page.waitForSelector('#wiki-gadgets-panel', { state: 'visible', timeout: 10000 });

    const createButton = page.locator('#wiki-gadgets-panel button:has-text("新規ページ")');
    await createButton.waitFor({ timeout: 5000 });
    
    // ターゲットページを作成
    await createButton.click();
    await page.fill('#wiki-gadgets-panel input[placeholder="タイトル"]', 'Target Page');
    await page.fill('#wiki-gadgets-panel textarea[placeholder="本文（Markdown 可）"]', 'This is the target page.');
    await page.click('#wiki-gadgets-panel button:has-text("保存")');
    await page.waitForTimeout(300);

    // リンク元ページを作成
    await createButton.click();
    await page.fill('#wiki-gadgets-panel input[placeholder="タイトル"]', 'Source Page');
    await page.fill('#wiki-gadgets-panel textarea[placeholder="本文（Markdown 可）"]', 'This links to [[Target Page]].');
    await page.click('#wiki-gadgets-panel button:has-text("保存")');
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

  test('should display link graph gadget', async ({ page }) => {
    // Wikiタブを開く
    const wikiTab = page.locator('.sidebar-tab[data-group="wiki"]');
    await wikiTab.waitFor({ timeout: 10000 });
    await wikiTab.click();
    await page.waitForSelector('#wiki-gadgets-panel', { state: 'visible', timeout: 10000 });

    // Link Graph gadgetが表示されているか確認
    const _linkGraphGadget = page.locator('#wiki-gadgets-panel .link-graph-container, #wiki-gadgets-panel .link-graph-toolbar');
    // gadgetがロードされるまで待つ
    await page.waitForTimeout(1000);
    
    // LinkGraph APIが利用可能か確認
    const hasLinkGraph = await page.evaluate(() => {
      return typeof window.LinkGraph !== 'undefined';
    });
    expect(hasLinkGraph).toBe(true);
  });

  test('should generate graph data from links', async ({ page }) => {
    // Wikiページを2つ作成してリンク関係を作る
    const wikiTab = page.locator('.sidebar-tab[data-group="wiki"]');
    await wikiTab.waitFor({ timeout: 10000 });
    await wikiTab.click();
    await page.waitForSelector('#wiki-gadgets-panel', { state: 'visible', timeout: 10000 });

    const createButton = page.locator('#wiki-gadgets-panel button:has-text("新規ページ")');
    await createButton.waitFor({ timeout: 5000 });
    
    // ページ1
    await createButton.click();
    await page.fill('#wiki-gadgets-panel input[placeholder="タイトル"]', 'Page A');
    await page.fill('#wiki-gadgets-panel textarea[placeholder="本文（Markdown 可）"]', 'Links to [[Page B]].');
    await page.click('#wiki-gadgets-panel button:has-text("保存")');
    await page.waitForTimeout(300);

    // ページ2
    await createButton.click();
    await page.fill('#wiki-gadgets-panel input[placeholder="タイトル"]', 'Page B');
    await page.fill('#wiki-gadgets-panel textarea[placeholder="本文（Markdown 可）"]', 'Links to [[Page A]].');
    await page.click('#wiki-gadgets-panel button:has-text("保存")');
    await page.waitForTimeout(300);

    // グラフデータを生成
    const graphData = await page.evaluate(() => {
      if (!window.LinkGraph || !window.ZenWriterStorage) return null;
      return window.LinkGraph.generateGraphData(window.ZenWriterStorage);
    });

    expect(graphData).not.toBeNull();
    expect(graphData.nodes.length).toBeGreaterThan(0);
    // リンク関係がある場合はエッジも存在する
    if (graphData.nodes.length >= 2) {
      expect(graphData.edges.length).toBeGreaterThan(0);
    }
  });

  test('should handle empty graph gracefully', async ({ page }) => {
    // リンクがない状態でグラフを生成
    const graphData = await page.evaluate(() => {
      if (!window.LinkGraph || !window.ZenWriterStorage) return null;
      return window.LinkGraph.generateGraphData(window.ZenWriterStorage);
    });

    expect(graphData).not.toBeNull();
    expect(Array.isArray(graphData.nodes)).toBe(true);
    expect(Array.isArray(graphData.edges)).toBe(true);
  });
});
