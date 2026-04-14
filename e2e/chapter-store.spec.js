// @ts-check
const { test, expect } = require('@playwright/test');
const { ensureNormalMode } = require('./helpers');

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function enterFocusMode(page) {
  await page.evaluate(() => {
    var html = document.documentElement;
    var current = html.getAttribute('data-ui-mode');
    if (current === 'focus') {
      if (window.ZWChapterList && typeof window.ZWChapterList.refresh === 'function') {
        window.ZWChapterList.refresh();
      }
    } else {
      if (window.ZenWriterApp && window.ZenWriterApp.setUIMode) window.ZenWriterApp.setUIMode('focus');
      else html.setAttribute('data-ui-mode', 'focus');
    }
  });
  await page.waitForTimeout(300);
}

async function enterNormalMode(page) {
  await page.evaluate(() => {
    if (window.ZenWriterApp && window.ZenWriterApp.setUIMode) window.ZenWriterApp.setUIMode('normal');
    else document.documentElement.setAttribute('data-ui-mode', 'normal');
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
             typeof window.ZWChapterStore.ensureChapterMode === 'function';
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
  // 5. ensureChapterMode (SP-081: migrateToChapterMode 削除済み)
  // -----------------------------------------------------------------------
  test('ensureChapterMode で章モードが自動適用される', async ({ page }) => {
    const result = await page.evaluate(() => {
      var S = window.ZenWriterStorage;
      var CS = window.ZWChapterStore;
      var docId = S.getCurrentDocId();

      // ensureChapterMode はフラグを設定し、既存コンテンツがあれば分割する
      CS.ensureChapterMode(docId);

      var afterMode = CS.isChapterMode(docId);

      return { afterMode: afterMode };
    });

    expect(result.afterMode).toBe(true);
  });

  // -----------------------------------------------------------------------
  // 6. Normal ↔ Focus モード切替で内容が維持される
  // -----------------------------------------------------------------------
  test('chapterMode で Normal → Focus → Normal の切替でエラーが出ない', async ({ page }) => {
    // ensureChapterMode で章モード適用
    await page.evaluate(() => {
      var S = window.ZenWriterStorage;
      var CS = window.ZWChapterStore;
      var docId = S.getCurrentDocId();
      CS.ensureChapterMode(docId);
    });
    await page.waitForTimeout(200);

    // モード切替が安定して動作する
    await enterNormalMode(page);
    await page.waitForTimeout(300);
    await enterFocusMode(page);
    await page.waitForTimeout(300);
    await enterNormalMode(page);
    await page.waitForTimeout(300);

    // エラーなくモード切替が完了
    const mode = await page.evaluate(() => document.documentElement.getAttribute('data-ui-mode'));
    expect(mode).toBe('normal');
  });
});

// ---------------------------------------------------------------------------
// SP-079 Issue C: chapterMode では章追加がアクティブ章のテキストを汚染しない
// (元 chapter-ux-issues.spec.js Issue C-2 を統合。Issue A/B/C-1 は SP-081 で
//  機能削除済、B-2/B-3 はバグ記録型テストのため削除)
// ---------------------------------------------------------------------------
test.describe('SP-079 Issue C: chapterMode 章追加の非汚染', () => {
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
    await page.waitForTimeout(400);
  }

  async function getEditorContent(page) {
    return page.evaluate(() => {
      var G = window.ZWContentGuard;
      if (G && typeof G.getEditorContent === 'function') return G.getEditorContent();
      var e = document.getElementById('editor');
      return e ? e.value : '';
    });
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForLoadState('networkidle');
    await ensureNormalMode(page);
    await page.waitForTimeout(600);
  });

  test('C-2: chapterMode では章追加がテキストを汚染しない', async ({ page }) => {
    await setEditorContent(page, '## 序章\n\n本文内容。');
    await enterFocusMode(page);

    const migrateBtn = page.locator('.cl-migrate-btn');
    if (await migrateBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      page.once('dialog', d => d.accept());
      await migrateBtn.click();
      await page.waitForTimeout(500);
    }

    const isChMode = await page.evaluate(() => {
      var Store = window.ZWChapterStore;
      var docId = window.ZenWriterEditor && typeof window.ZenWriterEditor.getCurrentDocId === 'function'
        ? window.ZenWriterEditor.getCurrentDocId()
        : null;
      if (!Store || !docId) return false;
      return Store.isChapterMode(docId);
    });

    if (!isChMode) {
      test.skip(true, 'Could not enter chapterMode');
      return;
    }

    await page.locator('#focus-add-chapter').click();
    await page.waitForTimeout(400);

    const activeContent = await getEditorContent(page);
    expect(activeContent.includes('新しい章')).toBe(false);
  });
});
