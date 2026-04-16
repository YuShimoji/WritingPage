// @ts-check
const { test, expect } = require('@playwright/test');

// ---------------------------------------------------------------------------
// Helper: chapterMode でドキュメントと章を設定
// ---------------------------------------------------------------------------
async function setupChapters(page, chapters) {
  await page.evaluate((chs) => {
    var S = window.ZenWriterStorage;
    var Store = window.ZWChapterStore;
    if (!S || !Store) return;
    var docId = S.getCurrentDocId();
    if (!docId) return;
    // chapterMode を確保
    if (Store.ensureChapterMode) Store.ensureChapterMode(docId);
    // 既存章を削除
    var existing = Store.getChaptersForDoc(docId) || [];
    for (var i = 0; i < existing.length; i++) {
      Store.deleteChapter(existing[i].id);
    }
    // 新しい章を作成
    var prevId = null;
    for (var j = 0; j < chs.length; j++) {
      var ch = chs[j];
      Store.createChapter(docId, ch.title, ch.content || '', prevId, ch.level || 2);
      var created = Store.getChaptersForDoc(docId) || [];
      if (created.length > 0) prevId = created[created.length - 1].id;
    }
  }, chapters);
  await page.waitForTimeout(200);
}

// ---------------------------------------------------------------------------
// Helper: Focusモードを有効化する
// ---------------------------------------------------------------------------
async function enterFocusMode(page) {
  await page.evaluate(() => {
    // サイドバーを閉じて章パネルの遮蔽を防ぐ
    if (window.sidebarManager) window.sidebarManager.forceSidebarState(false);
    if (window.ZenWriterApp && window.ZenWriterApp.setUIMode) window.ZenWriterApp.setUIMode('focus');
    else document.documentElement.setAttribute('data-ui-mode', 'focus');
    // テスト用: エッジホバーを発火させて章パネルを表示
    document.documentElement.setAttribute('data-edge-hover-left', 'true');
  });
  await page.waitForTimeout(500);
}

// ---------------------------------------------------------------------------
// SP-071 Chapter List — chapterMode
// ---------------------------------------------------------------------------
test.describe('SP-071 ChapterList (chapterMode)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);
    await page.evaluate(() => {
      if (window.ZenWriterApp && window.ZenWriterApp.setUIMode) window.ZenWriterApp.setUIMode('normal');
      else document.documentElement.setAttribute('data-ui-mode', 'normal');
    });
    await page.waitForTimeout(100);
  });

  // -------------------------------------------------------------------------
  // 1. Chapter display
  // -------------------------------------------------------------------------
  test('章レコードからチャプターアイテムが生成される', async ({ page }) => {
    await setupChapters(page, [
      { title: 'Chapter 1', content: '本文A' },
      { title: 'Chapter 2', content: '本文B' },
      { title: 'Chapter 3', content: '本文C' }
    ]);

    await enterFocusMode(page);

    const chapterList = page.locator('#focus-chapter-list');
    await expect(chapterList).toBeVisible({ timeout: 5000 });

    const itemCount = await page.evaluate(() => {
      return document.querySelectorAll('#focus-chapter-list .cl-item').length;
    });
    expect(itemCount).toBe(3);

    const labels = await page.evaluate(() => {
      var items = document.querySelectorAll('#focus-chapter-list .cl-item .cl-item__title');
      var result = [];
      for (var i = 0; i < items.length; i++) {
        result.push(items[i].textContent.trim());
      }
      return result;
    });
    expect(labels).toEqual(['Chapter 1', 'Chapter 2', 'Chapter 3']);
  });

  // -------------------------------------------------------------------------
  // 2. Chapter navigation
  // -------------------------------------------------------------------------
  test('チャプターアイテムクリックでエディタ内容が章のコンテンツに切り替わる', async ({ page }) => {
    await setupChapters(page, [
      { title: 'Chapter 1', content: '本文A' },
      { title: 'Chapter 2', content: '本文B' }
    ]);
    await enterFocusMode(page);

    await page.waitForSelector('#focus-chapter-list .cl-item', { timeout: 5000 });

    // 2番目のアイテム (Chapter 2) をクリック
    await page.evaluate(() => {
      var items = document.querySelectorAll('#focus-chapter-list .cl-item');
      if (items[1]) items[1].click();
    });
    await page.waitForTimeout(300);

    // エディタの内容が Chapter 2 のコンテンツ
    const editorContent = await page.evaluate(() => {
      var G = window.ZWContentGuard;
      if (G) return G.getEditorContent();
      var editor = document.getElementById('editor');
      return editor ? editor.value : '';
    });
    expect(editorContent).toContain('本文B');
  });

  // -------------------------------------------------------------------------
  // 3. Add chapter
  // -------------------------------------------------------------------------
  test('「新しい章」ボタンで章レコードが追加される', async ({ page }) => {
    await setupChapters(page, [
      { title: 'Chapter 1', content: '本文A' }
    ]);
    await enterFocusMode(page);

    const addBtn = page.locator('#focus-add-chapter');
    await expect(addBtn).toBeVisible({ timeout: 5000 });

    await addBtn.click();
    await page.waitForFunction(() => {
      return document.querySelectorAll('#focus-chapter-list .cl-item').length >= 2;
    }, { timeout: 5000 });

    // 章が2つになっている
    const itemCount = await page.evaluate(() => {
      return document.querySelectorAll('#focus-chapter-list .cl-item').length;
    });
    expect(itemCount).toBe(2);
  });

  // -------------------------------------------------------------------------
  // 4. Inline rename
  // -------------------------------------------------------------------------
  test('ダブルクリックでインライン編集フィールドが表示される', async ({ page }) => {
    await setupChapters(page, [
      { title: 'Chapter 1', content: '本文A' },
      { title: 'Chapter 2', content: '本文B' }
    ]);
    await enterFocusMode(page);

    await page.waitForSelector('#focus-chapter-list .cl-item', { timeout: 5000 });

    // 1番目のアイテムをダブルクリック
    await page.evaluate(() => {
      var items = document.querySelectorAll('#focus-chapter-list .cl-item');
      if (items[0]) {
        items[0].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      }
    });
    await page.waitForTimeout(300);

    const inputExists = await page.evaluate(() => {
      return !!document.querySelector('#focus-chapter-list .cl-item input, #focus-chapter-list .cl-rename-input');
    });
    expect(inputExists).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 5. Context menu
  // -------------------------------------------------------------------------
  test('右クリックでコンテキストメニューが表示される', async ({ page }) => {
    await setupChapters(page, [
      { title: 'Chapter 1', content: '本文A' },
      { title: 'Chapter 2', content: '本文B' }
    ]);
    await enterFocusMode(page);

    await page.waitForSelector('#focus-chapter-list .cl-item', { timeout: 5000 });

    await page.evaluate(() => {
      var items = document.querySelectorAll('#focus-chapter-list .cl-item');
      if (items[0]) {
        items[0].dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
      }
    });
    await page.waitForTimeout(200);

    const contextMenu = page.locator('.cl-context-menu');
    await expect(contextMenu).toBeVisible({ timeout: 3000 });

    const menuItemCount = await page.evaluate(() => {
      var menu = document.querySelector('.cl-context-menu');
      if (!menu) return 0;
      return menu.querySelectorAll('[role="menuitem"], .cl-context-menu-item, li, button').length;
    });
    expect(menuItemCount).toBeGreaterThan(0);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await expect(contextMenu).not.toBeVisible();
  });

  // -------------------------------------------------------------------------
  // 6. Active chapter highlight
  // -------------------------------------------------------------------------
  test('クリックしたアイテムに .cl-item--active クラスが付く', async ({ page }) => {
    await setupChapters(page, [
      { title: 'Chapter 1', content: '本文A' },
      { title: 'Chapter 2', content: '本文B' },
      { title: 'Chapter 3', content: '本文C' }
    ]);
    await enterFocusMode(page);

    await page.waitForSelector('#focus-chapter-list .cl-item', { timeout: 5000 });

    // 1番目をクリック
    await page.evaluate(() => {
      var items = document.querySelectorAll('#focus-chapter-list .cl-item');
      if (items[0]) items[0].click();
    });
    await page.waitForTimeout(200);

    const firstActive = await page.evaluate(() => {
      var items = document.querySelectorAll('#focus-chapter-list .cl-item');
      return items[0] ? items[0].classList.contains('cl-item--active') : false;
    });
    expect(firstActive).toBe(true);

    // 3番目をクリック → 1番目は非アクティブ、3番目がアクティブ
    await page.evaluate(() => {
      var items = document.querySelectorAll('#focus-chapter-list .cl-item');
      if (items[2]) items[2].click();
    });
    await page.waitForTimeout(200);

    const states = await page.evaluate(() => {
      var items = document.querySelectorAll('#focus-chapter-list .cl-item');
      return {
        first: items[0] ? items[0].classList.contains('cl-item--active') : false,
        third: items[2] ? items[2].classList.contains('cl-item--active') : false
      };
    });
    expect(states.first).toBe(false);
    expect(states.third).toBe(true);
  });
});
