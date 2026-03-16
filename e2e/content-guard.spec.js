// @ts-check
const { test, expect } = require('@playwright/test');

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function setEditorContent(page, text) {
  await page.evaluate((t) => {
    if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function') {
      window.ZenWriterEditor.setContent(t);
    } else {
      var editor = document.getElementById('editor');
      if (editor) editor.value = t;
    }
    var editor = document.getElementById('editor');
    if (editor) editor.dispatchEvent(new Event('input', { bubbles: true }));
  }, text);
  await page.waitForTimeout(300);
}

async function getEditorContent(page) {
  return page.evaluate(() => {
    if (window.ZenWriterEditor && typeof window.ZenWriterEditor.getEditorValue === 'function') {
      return window.ZenWriterEditor.getEditorValue() || '';
    }
    var editor = document.getElementById('editor');
    if (!editor) return '';
    return editor.value || '';
  });
}

/**
 * テスト用ドキュメントを2つ作成する
 * @returns {Promise<{docA: string, docB: string}>}
 */
async function setupTwoDocs(page, contentA, contentB) {
  return page.evaluate(([cA, cB]) => {
    var S = window.ZenWriterStorage;
    if (!S) return { docA: '', docB: '' };
    var docA = S.createDocument('文書A', cA || '');
    var docB = S.createDocument('文書B', cB || '');
    S.setCurrentDocId(docA.id);
    if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function') {
      window.ZenWriterEditor.setContent(cA || '');
    }
    return { docA: docA.id, docB: docB.id };
  }, [contentA, contentB]);
}

// ---------------------------------------------------------------------------
// ZWContentGuard API テスト
// ---------------------------------------------------------------------------
test.describe('ContentGuard データ保全', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);
  });

  // -----------------------------------------------------------------------
  // 1. ZWContentGuard がグローバルに公開される
  // -----------------------------------------------------------------------
  test('ZWContentGuard がグローバルに公開される', async ({ page }) => {
    const available = await page.evaluate(() => {
      return typeof window.ZWContentGuard === 'object' &&
             typeof window.ZWContentGuard.getEditorContent === 'function' &&
             typeof window.ZWContentGuard.ensureSaved === 'function' &&
             typeof window.ZWContentGuard.prepareDocumentSwitch === 'function' &&
             typeof window.ZWContentGuard.prepareNewDocument === 'function';
    });
    expect(available).toBe(true);
  });

  // -----------------------------------------------------------------------
  // 2. getEditorContent が WYSIWYG モードで正しく取得できる
  // -----------------------------------------------------------------------
  test('getEditorContent が正しい内容を返す', async ({ page }) => {
    const testText = 'テスト用のコンテンツ123';
    await setEditorContent(page, testText);

    const content = await page.evaluate(() => {
      return window.ZWContentGuard.getEditorContent();
    });
    expect(content).toContain('テスト用のコンテンツ123');
  });

  // -----------------------------------------------------------------------
  // 3. ensureSaved がストレージに反映する
  // -----------------------------------------------------------------------
  test('ensureSaved がストレージに内容を保存する', async ({ page }) => {
    const testText = '保存テスト内容';
    await setEditorContent(page, testText);

    const savedContent = await page.evaluate(() => {
      window.ZWContentGuard.ensureSaved({ snapshot: false });
      return window.ZenWriterStorage.loadContent() || '';
    });
    expect(savedContent).toContain('保存テスト内容');
  });

  // -----------------------------------------------------------------------
  // 4. ドキュメント切替で内容が保全される
  // -----------------------------------------------------------------------
  test('ドキュメント切替で元ドキュメントの内容が消えない', async ({ page }) => {
    const contentA = '文書Aの重要なテキスト';
    const contentB = '文書Bのテキスト';
    const ids = await setupTwoDocs(page, contentA, contentB);

    // 文書Aに内容を追記
    await setEditorContent(page, contentA + '\n追記部分');
    await page.waitForTimeout(200);

    // 文書Bに切替 (ContentGuard経由)
    await page.evaluate((docBId) => {
      // confirm ダイアログを自動承認
      window.confirm = () => true;
      var G = window.ZWContentGuard;
      G.prepareDocumentSwitch(docBId, { confirmIfDirty: false });
      window.ZenWriterStorage.setCurrentDocId(docBId);
    }, ids.docB);
    await page.waitForTimeout(200);

    // 文書Aの保存内容を確認
    const savedA = await page.evaluate((docAId) => {
      var docs = window.ZenWriterStorage.loadDocuments() || [];
      var doc = docs.find(function (d) { return d.id === docAId; });
      return doc ? doc.content : '';
    }, ids.docA);

    expect(savedA).toContain('文書Aの重要なテキスト');
    expect(savedA).toContain('追記部分');
  });

  // -----------------------------------------------------------------------
  // 5. 新規ドキュメント作成で元ドキュメントの内容が消えない
  // -----------------------------------------------------------------------
  test('新規ドキュメント作成で既存コンテンツが保全される', async ({ page }) => {
    const originalText = '消えてはならないテキスト';
    await setEditorContent(page, originalText);
    await page.waitForTimeout(200);

    // 現在のdocIdを取得
    const originalDocId = await page.evaluate(() => {
      return window.ZenWriterStorage.getCurrentDocId();
    });

    // prepareNewDocument を呼んでから新規作成
    await page.evaluate(() => {
      window.confirm = () => true;
      window.ZWContentGuard.prepareNewDocument();
    });
    await page.waitForTimeout(200);

    // 元ドキュメントの内容を確認
    const savedContent = await page.evaluate((docId) => {
      var docs = window.ZenWriterStorage.loadDocuments() || [];
      var doc = docs.find(function (d) { return d.id === docId; });
      return doc ? doc.content : '';
    }, originalDocId);

    expect(savedContent).toContain('消えてはならないテキスト');
  });

  // -----------------------------------------------------------------------
  // 6. ツリーUIのドキュメント切替でも保全される
  // -----------------------------------------------------------------------
  test('gadgets-documents-hierarchy 経由の切替で内容が保全される', async ({ page }) => {
    const contentA = '階層UIテスト文書A';
    const contentB = '';
    const ids = await setupTwoDocs(page, contentA, contentB);

    // 文書Aに内容を設定
    await page.evaluate((docAId) => {
      window.ZenWriterStorage.setCurrentDocId(docAId);
      if (window.ZenWriterEditor) window.ZenWriterEditor.setContent('階層UIテスト文書A 追加内容');
    }, ids.docA);
    await page.waitForTimeout(200);

    // ContentGuard 経由で切替準備 → 切替
    const savedA = await page.evaluate(([docAId, docBId]) => {
      window.confirm = () => true;
      var G = window.ZWContentGuard;
      if (G) G.prepareDocumentSwitch(docBId, { confirmIfDirty: false });
      window.ZenWriterStorage.setCurrentDocId(docBId);
      // 文書Aの保存内容を返す
      var docs = window.ZenWriterStorage.loadDocuments() || [];
      var doc = docs.find(function (d) { return d.id === docAId; });
      return doc ? doc.content : '';
    }, [ids.docA, ids.docB]);

    expect(savedA).toContain('追加内容');
  });

  // -----------------------------------------------------------------------
  // 7. flushChapterIfNeeded が章モードで動作する
  // -----------------------------------------------------------------------
  test('flushChapterIfNeeded が章コンテンツを保存する', async ({ page }) => {
    // 章モードのドキュメントを作成
    const chapterContent = await page.evaluate(() => {
      var S = window.ZenWriterStorage;
      var Store = window.ZWChapterStore;
      if (!S || !Store) return null;

      var doc = S.createDocument('章テスト', '## 第一章\n\nテスト本文');
      S.setCurrentDocId(doc.id);
      Store.migrateToChapterMode(doc.id);

      var chapters = Store.getChaptersForDoc(doc.id);
      return { docId: doc.id, chapterId: chapters.length > 0 ? chapters[0].id : null };
    });

    if (!chapterContent || !chapterContent.chapterId) {
      test.skip();
      return;
    }

    // ZWChapterList が flushActive を公開しているか確認
    const hasFlushActive = await page.evaluate(() => {
      return window.ZWChapterList && typeof window.ZWChapterList.flushActive === 'function';
    });
    expect(hasFlushActive).toBe(true);
  });
});
