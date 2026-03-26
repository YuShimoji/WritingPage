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
    var editor = document.getElementById('editor');
    if (!editor) return '';
    return editor.value || editor.textContent || '';
  });
}

async function enterFocusMode(page) {
  await page.evaluate(() => {
    var html = document.documentElement;
    var current = html.getAttribute('data-ui-mode');
    if (current === 'focus') {
      if (window.ZWChapterList && typeof window.ZWChapterList.refresh === 'function') {
        window.ZWChapterList.refresh();
      }
    } else {
      html.setAttribute('data-ui-mode', 'focus');
    }
  });
  await page.waitForTimeout(300);
}

async function enterNormalMode(page) {
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-ui-mode', 'normal');
  });
  await page.waitForTimeout(300);
}

/**
 * テスト用ドキュメントを作成して currentDocId をセットする
 */
async function setupTestDoc(page, content) {
  await page.evaluate((c) => {
    var S = window.ZenWriterStorage;
    if (!S) return;
    var doc = S.createDocument('テスト文書', c || '');
    S.setCurrentDocId(doc.id);
  }, content || '');
  await page.waitForTimeout(200);
}

/**
 * 現在のドキュメントを Legacy モード (chapterMode: false) に強制する
 */
async function forceLegacyMode(page) {
  await page.evaluate(() => {
    var S = window.ZenWriterStorage;
    if (!S) return;
    var docId = S.getCurrentDocId();
    if (!docId) return;
    var docs = S.loadDocuments();
    var cleaned = [];
    for (var i = 0; i < docs.length; i++) {
      if (docs[i] && docs[i].id === docId) {
        docs[i].chapterMode = false;
        cleaned.push(docs[i]);
      } else if (docs[i] && docs[i].type === 'chapter' && docs[i].parentId === docId) {
        // skip chapter records
      } else {
        cleaned.push(docs[i]);
      }
    }
    S.saveDocuments(cleaned);
  });
  await page.waitForTimeout(100);
}

// ---------------------------------------------------------------------------
// SP-071 Phase 2: Chapter Store
// ---------------------------------------------------------------------------
test.describe('SP-071 Phase 2 ChapterStore', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);
  });

  // -----------------------------------------------------------------------
  // 1. ZWChapterStore が利用可能
  // -----------------------------------------------------------------------
  test('ZWChapterStore がグローバルに公開される', async ({ page }) => {
    const available = await page.evaluate(() => {
      return typeof window.ZWChapterStore === 'object' &&
             typeof window.ZWChapterStore.createChapter === 'function' &&
             typeof window.ZWChapterStore.getChaptersForDoc === 'function' &&
             typeof window.ZWChapterStore.assembleFullText === 'function' &&
             typeof window.ZWChapterStore.migrateToChapterMode === 'function';
    });
    expect(available).toBe(true);
  });

  // -----------------------------------------------------------------------
  // 2. 章の CRUD
  // -----------------------------------------------------------------------
  test('章の作成・取得・更新・削除ができる', async ({ page }) => {
    await setupTestDoc(page, '');

    const result = await page.evaluate(() => {
      var S = window.ZenWriterStorage;
      var CS = window.ZWChapterStore;
      var docId = S.getCurrentDocId();
      if (!docId) return { error: 'no docId' };

      // 作成
      var ch1 = CS.createChapter(docId, '第一章', '本文A');
      var ch2 = CS.createChapter(docId, '第二章', '本文B');

      // 取得
      var chapters = CS.getChaptersForDoc(docId);
      var count = chapters.length;

      // 更新
      CS.updateChapterContent(ch1.id, '更新後の本文');
      var updated = CS.getChapter(ch1.id);

      // 削除
      CS.deleteChapter(ch2.id);
      var afterDelete = CS.getChaptersForDoc(docId);

      return {
        count: count,
        ch1Title: ch1.name,
        ch2Title: ch2.name,
        updatedContent: updated ? updated.content : null,
        afterDeleteCount: afterDelete.length
      };
    });

    expect(result.count).toBe(2);
    expect(result.ch1Title).toBe('第一章');
    expect(result.ch2Title).toBe('第二章');
    expect(result.updatedContent).toBe('更新後の本文');
    expect(result.afterDeleteCount).toBe(1);
  });

  // -----------------------------------------------------------------------
  // 3. 章の並び替え
  // -----------------------------------------------------------------------
  test('reorderChapters で章の順序が変わる', async ({ page }) => {
    await setupTestDoc(page, '');

    const titles = await page.evaluate(() => {
      var S = window.ZenWriterStorage;
      var CS = window.ZWChapterStore;
      var docId = S.getCurrentDocId();

      CS.createChapter(docId, 'A', '');
      CS.createChapter(docId, 'B', '');
      CS.createChapter(docId, 'C', '');

      var chapters = CS.getChaptersForDoc(docId);
      // C, A, B の順に並び替え
      CS.reorderChapters(docId, [chapters[2].id, chapters[0].id, chapters[1].id]);

      var reordered = CS.getChaptersForDoc(docId);
      return reordered.map(function (c) { return c.name; });
    });

    expect(titles).toEqual(['C', 'A', 'B']);
  });

  // -----------------------------------------------------------------------
  // 4. 全文組み立て
  // -----------------------------------------------------------------------
  test('assembleFullText が全章を結合する', async ({ page }) => {
    await setupTestDoc(page, '');

    const fullText = await page.evaluate(() => {
      var S = window.ZenWriterStorage;
      var CS = window.ZWChapterStore;
      var docId = S.getCurrentDocId();

      CS.createChapter(docId, '第一章', '本文A', null, 2);
      CS.createChapter(docId, '第二章', '本文B', null, 2);

      return CS.assembleFullText(docId);
    });

    expect(fullText).toContain('## 第一章');
    expect(fullText).toContain('本文A');
    expect(fullText).toContain('## 第二章');
    expect(fullText).toContain('本文B');
  });

  // -----------------------------------------------------------------------
  // 5. migrateToChapterMode
  // -----------------------------------------------------------------------
  test('見出しベースの文書を chapterMode に変換できる', async ({ page }) => {
    const testContent = '## 第一章\n\n本文A\n\n## 第二章\n\n本文B';
    await setupTestDoc(page, testContent);
    await forceLegacyMode(page);

    // エディタにもコンテンツを設定
    await setEditorContent(page, testContent);

    const result = await page.evaluate(() => {
      var S = window.ZenWriterStorage;
      var CS = window.ZWChapterStore;
      var docId = S.getCurrentDocId();

      // 移行前
      var beforeMode = CS.isChapterMode(docId);

      // 移行実行
      var ok = CS.migrateToChapterMode(docId);

      // 移行後
      var afterMode = CS.isChapterMode(docId);
      var chapters = CS.getChaptersForDoc(docId);

      return {
        beforeMode: beforeMode,
        ok: ok,
        afterMode: afterMode,
        chapterCount: chapters.length,
        titles: chapters.map(function (c) { return c.name; }),
        contents: chapters.map(function (c) { return c.content.trim(); })
      };
    });

    expect(result.beforeMode).toBe(false);
    expect(result.ok).toBe(true);
    expect(result.afterMode).toBe(true);
    expect(result.chapterCount).toBe(2);
    expect(result.titles).toEqual(['第一章', '第二章']);
    expect(result.contents[0]).toBe('本文A');
    expect(result.contents[1]).toBe('本文B');
  });

  // -----------------------------------------------------------------------
  // 6. Focus モードで移行ボタンが表示される
  // -----------------------------------------------------------------------
  test('非 chapterMode で Focus モード時に移行ボタンが表示される', async ({ page }) => {
    const testContent = '## 第一章\n\n本文A';
    await setupTestDoc(page, testContent);
    await forceLegacyMode(page);
    await setEditorContent(page, testContent);
    await enterFocusMode(page);

    // チャプターリストが表示される
    await page.waitForSelector('.cl-item', { timeout: 3000 });

    // 移行ボタンが表示される
    const migrateBtn = page.locator('.cl-migrate-btn');
    await expect(migrateBtn).toBeVisible();
    expect(await migrateBtn.textContent()).toContain('章モードに変換');
  });

  // -----------------------------------------------------------------------
  // 7. Normal ↔ Focus モード切替で内容が維持される
  // -----------------------------------------------------------------------
  test('chapterMode で Normal → Focus → Normal の切替で内容が維持される', async ({ page }) => {
    const testContent = '## 第一章\n\n本文A\n\n## 第二章\n\n本文B';
    await setupTestDoc(page, testContent);
    await setEditorContent(page, testContent);

    // chapterMode に移行
    await page.evaluate(() => {
      var S = window.ZenWriterStorage;
      var CS = window.ZWChapterStore;
      var docId = S.getCurrentDocId();
      CS.migrateToChapterMode(docId);
    });
    await page.waitForTimeout(200);

    // Normal モードからスタートして Focus に切替
    await enterNormalMode(page);
    // エディタに全文をセットし直す（Normal モードでの全文保持を確認）
    await setEditorContent(page, testContent);
    await enterFocusMode(page);
    await page.waitForTimeout(500);

    // チャプターリストが表示される
    const chapterItems = page.locator('.cl-item');
    const count = await chapterItems.count();
    expect(count).toBe(2);

    // Normal モードに戻る
    await enterNormalMode(page);
    await page.waitForTimeout(300);

    // 全文テキストが復元される
    const text = await getEditorContent(page);
    expect(text).toContain('第一章');
    expect(text).toContain('本文A');
    expect(text).toContain('第二章');
    expect(text).toContain('本文B');
  });
});
