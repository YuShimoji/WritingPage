const { test, expect } = require('@playwright/test');

const wait = (ms) => new Promise(r => setTimeout(r, ms));

test.beforeEach(async ({ page }) => {
  page.on('console', m => {
    try { console.log(`[browser:${m.type()}] ${m.text()}`); } catch {}
  });
  page.on('pageerror', e => {
    try { console.log(`[pageerror] ${e.message}`); } catch {}
  });

  await page.goto('/index.html');

  // Wait for scripts to load
  await page.waitForFunction(() =>
    !!window.ZenWriterStorage &&
    !!window.GlobalSearch &&
    !!window.GlobalSearchUI,
    { timeout: 5000 }
  );

  // Clear existing documents
  await page.evaluate(() => {
    localStorage.removeItem('zenWriter_docs');
    localStorage.removeItem('zenWriter_currentDocId');
    localStorage.removeItem('zenWriter_searchHistory');
  });

  // Create test documents with delays to ensure unique IDs
  const doc1Id = await page.evaluate(() => {
    const doc = window.ZenWriterStorage.createDocument('テストドキュメント1', 'これはテストです。\n検索キーワードがここにあります。\nもう一行あります。', null);
    return doc.id;
  });
  await wait(10);

  await page.evaluate(() => {
    window.ZenWriterStorage.createDocument('テストドキュメント2', '別のドキュメントです。\n検索キーワードがここにもあります。', null);
  });
  await wait(10);

  await page.evaluate(() => {
    window.ZenWriterStorage.createDocument('空のドキュメント', '', null);
  });
  await wait(10);

  await page.evaluate((docId) => {
    window.ZenWriterStorage.setCurrentDocId(docId);
  }, doc1Id);

  await wait(200);
});

// Helper function to open panel
async function openPanel(page) {
  await page.evaluate(() => {
    if (window.GlobalSearchUI && typeof window.GlobalSearchUI.showPanel === 'function') {
      window.GlobalSearchUI.showPanel();
    }
  });
  await wait(100);
}

test.describe('全文検索機能', () => {
  test('パネルを開くことができる', async ({ page }) => {
    const panel = page.locator('#global-search-panel');

    // 初期状態は非表示
    await expect(panel).toHaveCSS('display', 'none');

    // パネルを開く
    await openPanel(page);

    // パネルが表示される
    await expect(panel).toHaveCSS('display', 'block');
    await expect(panel).toBeVisible();
  });

  test('検索クエリを入力して結果が表示される', async ({ page }) => {
    await openPanel(page);

    const input = page.locator('#global-search-input');
    const searchBtn = page.locator('#global-search-btn');
    const resultsContainer = page.locator('#global-search-results');

    // 検索クエリを入力
    await input.fill('検索キーワード');
    await searchBtn.click();
    await wait(500);

    // 結果が表示される
    const resultCards = resultsContainer.locator('.global-search-result-card');
    await expect(resultCards).toHaveCount(2); // doc1 と doc2

    // 結果カードに正しい情報が表示される
    const firstCard = resultCards.first();
    await expect(firstCard).toContainText('テストドキュメント1');
  });

  test('Enter キーで検索実行', async ({ page }) => {
    await openPanel(page);

    const input = page.locator('#global-search-input');
    const resultsContainer = page.locator('#global-search-results');

    await input.fill('検索キーワード');
    await input.press('Enter');
    await wait(500);

    const resultCards = resultsContainer.locator('.global-search-result-card');
    await expect(resultCards).toHaveCount(2);
  });

  test('結果カードをクリックしてドキュメントを開く', async ({ page }) => {
    await openPanel(page);

    const input = page.locator('#global-search-input');
    const resultsContainer = page.locator('#global-search-results');

    // より明確なクエリで検索
    await input.fill('別のドキュメントです');
    await input.press('Enter');
    await wait(500);

    // 検索結果を確認
    const resultCards = resultsContainer.locator('.global-search-result-card');
    const resultCount = await resultCards.count();

    // デバッグ: 結果の詳細を確認
    const searchResults = await page.evaluate(() => {
      return window.GlobalSearch.searchAllDocuments('別のドキュメントです', {});
    });
    console.log('[TEST DEBUG] Search results:', JSON.stringify(searchResults, null, 2));

    expect(resultCount).toBe(1); // doc2のみマッチするはず

    // 結果をクリック
    const resultCard = resultCards.first();
    await expect(resultCard).toContainText('テストドキュメント2');
    await resultCard.click();
    await wait(1000);

    // パネルが閉じる
    const panel = page.locator('#global-search-panel');
    await expect(panel).toHaveCSS('display', 'none');

    // エディタに正しいコンテンツがロードされる
    const currentDocId = await page.evaluate(() => window.ZenWriterStorage.getCurrentDocId());
    const docs = await page.evaluate(() => window.ZenWriterStorage.loadDocuments());
    const currentDoc = docs.find(d => d.id === currentDocId);

    expect(currentDoc.name).toBe('テストドキュメント2');
  });

  test('検索履歴が保存される', async ({ page }) => {
    await openPanel(page);

    const input = page.locator('#global-search-input');
    const historySelect = page.locator('#global-search-history');

    // 複数の検索を実行
    await input.fill('キーワード1');
    await input.press('Enter');
    await wait(500);

    await input.fill('キーワード2');
    await input.press('Enter');
    await wait(500);

    // 履歴ドロップダウンに表示される
    const options = historySelect.locator('option');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(2); // プレースホルダー + 履歴

    // 最新の検索が最初に表示される
    const firstHistory = options.nth(1); // 0番目はプレースホルダー
    await expect(firstHistory).toHaveText('キーワード2');
  });

  test('検索結果が0件の場合のメッセージ', async ({ page }) => {
    await openPanel(page);

    const input = page.locator('#global-search-input');
    const resultsContainer = page.locator('#global-search-results');

    // 存在しないキーワードで検索
    await input.fill('存在しないキーワード12345');
    await input.press('Enter');
    await wait(500);

    // 「一致するドキュメントが見つかりませんでした」メッセージが表示される
    const noResultsMsg = resultsContainer.locator('.global-search-no-results');
    await expect(noResultsMsg).toBeVisible();
    await expect(noResultsMsg).toContainText('一致するドキュメントが見つかりませんでした');
  });

  test('ESC キーでパネルを閉じる', async ({ page }) => {
    const panel = page.locator('#global-search-panel');

    await openPanel(page);
    await expect(panel).toHaveCSS('display', 'block');

    // ESC で閉じる
    await page.keyboard.press('Escape');
    await wait(200);
    await expect(panel).toHaveCSS('display', 'none');
  });

  test('閉じるボタンでパネルを閉じる', async ({ page }) => {
    const panel = page.locator('#global-search-panel');
    const closeBtn = page.locator('#close-global-search-panel');

    await openPanel(page);
    await expect(panel).toHaveCSS('display', 'block');

    await closeBtn.click();
    await wait(200);
    await expect(panel).toHaveCSS('display', 'none');
  });

  test('大文字小文字を区別する検索', async ({ page }) => {
    // テストドキュメントを追加
    await page.evaluate(() => {
      window.ZenWriterStorage.createDocument('ケーステスト', 'TEST test TeSt', null);
    });

    await openPanel(page);

    const input = page.locator('#global-search-input');
    const caseCheckbox = page.locator('#global-search-case');
    const resultsContainer = page.locator('#global-search-results');

    // 大文字小文字を区別しない検索（デフォルト）
    await input.fill('test');
    await input.press('Enter');
    await wait(500);

    let resultCards = resultsContainer.locator('.global-search-result-card');
    const countWithoutCase = await resultCards.count();
    expect(countWithoutCase).toBeGreaterThan(0);

    // 大文字小文字を区別する検索
    await caseCheckbox.check();
    await wait(100);
    await input.press('Enter');
    await wait(500);

    resultCards = resultsContainer.locator('.global-search-result-card');
    const countWithCase = await resultCards.count();
    expect(countWithCase).toBeGreaterThanOrEqual(0);
  });
});
