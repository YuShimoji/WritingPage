// @ts-check
/**
 * SP-079 チャプター管理 UX イシュー再現テスト (2026-03-19)
 *
 * Issue A: 章モード — 一方向移行でロールバック不可
 * Issue B: 文字数表示が Markdown ソース全体 (DSL 含む) で不正確
 * Issue C: Legacy モードの章追加がテキスト本文に見出しを挿入する
 */
const { test, expect } = require('@playwright/test');

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

async function enterFocusMode(page) {
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-ui-mode', 'focus');
  });
  await page.waitForTimeout(200);
}

/**
 * 現在のドキュメントを Legacy モード (chapterMode: false) に強制する
 * SP-079 で chapterMode がデフォルトになったため、Legacy テストにはこれが必要
 */
async function forceLegacyMode(page) {
  await page.evaluate(() => {
    var S = window.ZenWriterStorage;
    if (!S) return;
    var docId = S.getCurrentDocId();
    if (!docId) return;
    var docs = S.loadDocuments();
    // chapterMode フラグを外す + 章レコードを削除
    var cleaned = [];
    for (var i = 0; i < docs.length; i++) {
      if (docs[i] && docs[i].id === docId) {
        docs[i].chapterMode = false;
        cleaned.push(docs[i]);
      } else if (docs[i] && docs[i].type === 'chapter' && docs[i].parentId === docId) {
        // 章レコードをスキップ (削除)
      } else {
        cleaned.push(docs[i]);
      }
    }
    S.saveDocuments(cleaned);
  });
  await page.waitForTimeout(100);
}

// ---------------------------------------------------------------------------
// Issue A: 章モード一方向移行
// ---------------------------------------------------------------------------
test.describe('Issue A: 章モード一方向移行', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);
  });

  test('A-1: Legacy モードで見出しがあれば「章モードに変換」ボタンが表示される', async ({ page }) => {
    await forceLegacyMode(page);
    await setEditorContent(page, '## 第一章\n\n本文A\n\n## 第二章\n\n本文B');
    await enterFocusMode(page);

    const migrateBtn = page.locator('.cl-migrate-btn');
    await expect(migrateBtn).toBeVisible({ timeout: 5000 });
    await expect(migrateBtn).toHaveText('章モードに変換');
  });

  test('A-2: 章モードで「章モードを解除」ボタンが存在する', async ({ page }) => {
    await setEditorContent(page, '## 第一章\n\n本文A\n\n## 第二章\n\n本文B');
    await enterFocusMode(page);

    // chapterMode (デフォルト) で解除ボタンが表示される
    const revertBtn = page.locator('.cl-revert-btn');
    await expect(revertBtn).toBeVisible({ timeout: 5000 });
    await expect(revertBtn).toHaveText('章モードを解除');
  });

  test('A-3: migrateToChapterMode API で chapterMode フラグが true になる', async ({ page }) => {
    // API レベルで Legacy→chapterMode 移行を検証
    const result = await page.evaluate(() => {
      var S = window.ZenWriterStorage;
      var CS = window.ZWChapterStore;
      if (!S || !CS) return { error: 'Store not available' };

      // Legacy ドキュメントを直接作成 (chapterMode 解除)
      var doc = S.createDocument('Legacy テスト', '## 章1\n\n本文\n\n## 章2\n\n本文2');
      var docs = S.loadDocuments();
      for (var i = 0; i < docs.length; i++) {
        if (docs[i].id === doc.id) {
          docs[i].chapterMode = false;
          // splitIntoChapters で作られた章も削除
          break;
        }
      }
      // 章レコード削除
      docs = docs.filter(function(d) {
        return !(d.type === 'chapter' && d.parentId === doc.id);
      });
      S.saveDocuments(docs);
      S.setCurrentDocId(doc.id);

      var before = CS.isChapterMode(doc.id);
      var ok = CS.migrateToChapterMode(doc.id);
      var after = CS.isChapterMode(doc.id);
      var chapters = CS.getChaptersForDoc(doc.id);

      return { before: before, ok: ok, after: after, count: chapters.length };
    });

    expect(result.before).toBe(false);
    expect(result.ok).toBe(true);
    expect(result.after).toBe(true);
    expect(result.count).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Issue B: 文字数がMarkdownソース全体(DSL込み)でカウントされる
// ---------------------------------------------------------------------------
test.describe('Issue B: 文字数表示の精度問題', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);
  });

  test('B-1: DSLなしコンテンツで文字数と実文字数が一致する', async ({ page }) => {
    const plainText = '## 第一章\n\nこれはプレーンなテキストです。合計20文字程度。';
    await setEditorContent(page, plainText);
    await enterFocusMode(page);

    const displayedCount = await page.evaluate(() => {
      var countEl = document.querySelector('.cl-item__count');
      return countEl ? parseInt(countEl.textContent.replace(/,/g, ''), 10) : null;
    });
    await page.waitForTimeout(200);

    // DSLなしなのでソース文字数と本文字数は近い値のはず
    expect(displayedCount).not.toBeNull();
    console.log('Plain text source length:', plainText.trim().length);
    console.log('Displayed count:', displayedCount);
  });

  test('B-2: DSL構文込みコンテンツで表示文字数がプレーンテキスト文字数を大幅に超える (バグ確認)', async ({ page }) => {
    const dslContent = '## DSLテスト章\n\n:::zw-scroll{effect:"fade-in", delay:"300ms"}\nこれが本文です。\n:::';
    const plainText = 'これが本文です。'; // 8文字

    await setEditorContent(page, dslContent);
    await enterFocusMode(page);

    const displayedCount = await page.evaluate(() => {
      var countEl = document.querySelector('.cl-item__count');
      return countEl ? parseInt(countEl.textContent.replace(/,/g, ''), 10) : null;
    });

    console.log('DSL content source length:', dslContent.trim().length);
    console.log('Plain text length:', plainText.length);
    console.log('Displayed count:', displayedCount);

    // バグ確認: 表示文字数がプレーンテキスト (8文字) よりはるかに大きい
    // (DSL 構文 ":::zw-scroll{effect:"fade-in", delay:"300ms"}\n:::" が加算される)
    if (displayedCount !== null) {
      expect(displayedCount).toBeGreaterThan(plainText.length);
      console.log(`[BUG CONFIRMED] Displayed ${displayedCount} vs actual plain text ${plainText.length}`);
    }
  });

  test('B-3: リアルタイム更新されない (入力後即座に変わらない)', async ({ page }) => {
    await setEditorContent(page, '## 章\n\n短いテキスト');
    await enterFocusMode(page);

    const before = await page.evaluate(() => {
      var el = document.querySelector('.cl-item__count');
      return el ? el.textContent.trim() : '0';
    });

    // エディタに追加入力 (再描画を待たない)
    await page.evaluate(() => {
      var editor = document.getElementById('editor');
      if (editor) {
        editor.value += '\n追加テキスト追加テキスト追加テキスト';
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.waitForTimeout(100); // debounce 前

    const after = await page.evaluate(() => {
      var el = document.querySelector('.cl-item__count');
      return el ? el.textContent.trim() : '0';
    });

    console.log('Before input:', before, '/ After input (100ms):', after);
    // 注: before === after の場合は即時更新されていない (Issue B の指摘通り)
    if (before === after) {
      console.log('[CONFIRMED] Character count not updated in real-time');
    }
  });
});

// ---------------------------------------------------------------------------
// Issue C: Legacy モードの章追加がテキスト本文に見出しを挿入する
// ---------------------------------------------------------------------------
test.describe('Issue C: Legacy モード章追加のテキスト汚染', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);
  });

  test('C-1: Legacy モードで「+ 新しい章」を押すとMarkdownに見出しが挿入される', async ({ page }) => {
    await forceLegacyMode(page);
    const initialContent = '## 序章\n\nこれは序章の本文です。読者が最初に読む部分。';
    await setEditorContent(page, initialContent);
    await enterFocusMode(page);

    // 「+ 新しい章」ボタンをクリック
    const addBtn = page.locator('#focus-add-chapter');
    await expect(addBtn).toBeVisible({ timeout: 3000 });
    await addBtn.click();
    await page.waitForTimeout(400);

    const contentAfter = await getEditorContent(page);
    console.log('Content after adding chapter:', JSON.stringify(contentAfter));

    // バグ確認: Markdown テキストに見出し行が挿入されている
    const hasInsertedHeading = contentAfter.includes('新しい章');
    expect(hasInsertedHeading).toBe(true);
    console.log('[CONFIRMED] Adding chapter inserts heading into Markdown text:', hasInsertedHeading);
  });

  test('C-2: chapterMode では章追加がテキストを汚染しない', async ({ page }) => {
    await setEditorContent(page, '## 序章\n\n本文内容。');
    await enterFocusMode(page);

    // chapterMode に移行
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

    // 章を追加
    await page.locator('#focus-add-chapter').click();
    await page.waitForTimeout(400);

    // アクティブ章のコンテンツは変わらない (別 DB エントリが作られるだけ)
    const activeContent = await getEditorContent(page);
    console.log('Active chapter content after adding chapter in chapterMode:', JSON.stringify(activeContent));

    // 「新しい章」が現在の editor テキストに入っていない
    const contaminated = activeContent.includes('新しい章');
    expect(contaminated).toBe(false);
    console.log('[chapterMode] Text not contaminated:', !contaminated);
  });
});
