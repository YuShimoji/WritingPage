// @ts-check
const { test, expect } = require('@playwright/test');

// ---------------------------------------------------------------------------
// Helper: エディタにコンテンツを設定してFocusモードUIが反映されるまで待つ
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
  // debounce + render
  await page.waitForTimeout(300);
}

// ---------------------------------------------------------------------------
// Helper: Focusモードを有効化する
// ---------------------------------------------------------------------------
async function enterFocusMode(page) {
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-ui-mode', 'focus');
  });
  await page.waitForTimeout(200);
}

// ---------------------------------------------------------------------------
// SP-071 Chapter List — Focus mode
// ---------------------------------------------------------------------------
test.describe('SP-071 ChapterList', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForLoadState('networkidle');
    // Wait for app initialisation
    await page.waitForTimeout(600);
  });

  // -------------------------------------------------------------------------
  // 1. Chapter detection
  // -------------------------------------------------------------------------
  test('見出しからチャプターアイテムが生成される', async ({ page }) => {
    await setEditorContent(
      page,
      '## Chapter 1\n\n本文A\n\n## Chapter 2\n\n本文B\n\n## Chapter 3\n\n本文C'
    );

    await enterFocusMode(page);

    // #focus-chapter-list が存在し、各章が .cl-item として表示される
    const chapterList = page.locator('#focus-chapter-list');
    await expect(chapterList).toBeVisible({ timeout: 5000 });

    const itemCount = await page.evaluate(() => {
      return document.querySelectorAll('#focus-chapter-list .cl-item').length;
    });
    expect(itemCount).toBe(3);

    // 各アイテムが data-ch-idx 属性を持つ
    const indices = await page.evaluate(() => {
      var items = document.querySelectorAll('#focus-chapter-list .cl-item');
      var result = [];
      for (var i = 0; i < items.length; i++) {
        result.push(items[i].getAttribute('data-ch-idx'));
      }
      return result;
    });
    expect(indices).toEqual(['0', '1', '2']);

    // 表示テキストが見出しと一致する
    const labels = await page.evaluate(() => {
      var items = document.querySelectorAll('#focus-chapter-list .cl-item');
      var result = [];
      for (var i = 0; i < items.length; i++) {
        result.push(items[i].textContent.trim());
      }
      return result;
    });
    expect(labels[0]).toContain('Chapter 1');
    expect(labels[1]).toContain('Chapter 2');
    expect(labels[2]).toContain('Chapter 3');
  });

  // -------------------------------------------------------------------------
  // 2. Chapter navigation
  // -------------------------------------------------------------------------
  test('チャプターアイテムクリックでカーソルが見出し位置に移動する', async ({ page }) => {
    const content = '## Chapter 1\n\n本文A\n\n## Chapter 2\n\n本文B';
    await setEditorContent(page, content);
    await enterFocusMode(page);

    await page.waitForSelector('#focus-chapter-list .cl-item', { timeout: 5000 });

    // 2番目のアイテム（Chapter 2）をクリック
    await page.evaluate(() => {
      var items = document.querySelectorAll('#focus-chapter-list .cl-item');
      if (items[1]) items[1].click();
    });
    await page.waitForTimeout(200);

    // エディタのカーソル位置が "## Chapter 2" の先頭にある
    const cursorPos = await page.evaluate(() => {
      var editor = document.getElementById('editor');
      return editor ? editor.selectionStart : -1;
    });
    const expectedPos = await page.evaluate(() => {
      var editor = document.getElementById('editor');
      return editor ? editor.value.indexOf('## Chapter 2') : -1;
    });

    expect(expectedPos).toBeGreaterThanOrEqual(0);
    expect(cursorPos).toBeGreaterThanOrEqual(expectedPos);
    // カーソルは見出し行の範囲内に収まっている（前後10文字の余裕）
    expect(cursorPos).toBeLessThan(expectedPos + '## Chapter 2'.length + 1);
  });

  // -------------------------------------------------------------------------
  // 3. Add chapter
  // -------------------------------------------------------------------------
  test('「新しい章」ボタンでエディタに新しい見出しが挿入される', async ({ page }) => {
    await setEditorContent(page, '## Chapter 1\n\n本文A');
    await enterFocusMode(page);

    const addBtn = page.locator('#focus-add-chapter');
    await expect(addBtn).toBeVisible({ timeout: 5000 });

    await addBtn.click();
    await page.waitForTimeout(300);

    // エディタに新しい ## 見出しが追加されている
    const editorValue = await page.evaluate(() => {
      var editor = document.getElementById('editor');
      return editor ? editor.value : '';
    });

    // 元の Chapter 1 に加えて、もう一つ見出しが存在する
    const headingMatches = editorValue.match(/^##\s+/mg);
    expect(headingMatches).not.toBeNull();
    expect(headingMatches.length).toBeGreaterThanOrEqual(2);
  });

  // -------------------------------------------------------------------------
  // 4. Inline rename
  // -------------------------------------------------------------------------
  test('ダブルクリックでインライン編集フィールドが表示され、Enter でエディタの見出しが更新される', async ({ page }) => {
    await setEditorContent(page, '## Chapter 1\n\n本文A\n\n## Chapter 2\n\n本文B');
    await enterFocusMode(page);

    await page.waitForSelector('#focus-chapter-list .cl-item', { timeout: 5000 });

    // 1番目のアイテムをダブルクリック
    await page.evaluate(() => {
      var items = document.querySelectorAll('#focus-chapter-list .cl-item');
      if (items[0]) {
        items[0].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      }
    });
    await page.waitForTimeout(200);

    // インライン編集フィールドが出現している
    const inputExists = await page.evaluate(() => {
      return !!document.querySelector('#focus-chapter-list .cl-item input, #focus-chapter-list .cl-rename-input');
    });
    expect(inputExists).toBe(true);

    // 新しい名前を入力して Enter
    const inputSel = '#focus-chapter-list .cl-item input, #focus-chapter-list .cl-rename-input';
    await page.fill(inputSel, '改名された章');
    await page.press(inputSel, 'Enter');
    await page.waitForTimeout(300);

    // エディタの見出しテキストが更新されている
    const editorValue = await page.evaluate(() => {
      var editor = document.getElementById('editor');
      return editor ? editor.value : '';
    });
    expect(editorValue).toContain('改名された章');
    // 元のテキストはなくなっている
    expect(editorValue).not.toContain('## Chapter 1\n');
  });

  // -------------------------------------------------------------------------
  // 5. Context menu
  // -------------------------------------------------------------------------
  test('右クリックでコンテキストメニューが表示される', async ({ page }) => {
    await setEditorContent(page, '## Chapter 1\n\n本文A\n\n## Chapter 2\n\n本文B');
    await enterFocusMode(page);

    await page.waitForSelector('#focus-chapter-list .cl-item', { timeout: 5000 });

    // 1番目のアイテムを右クリック
    await page.evaluate(() => {
      var items = document.querySelectorAll('#focus-chapter-list .cl-item');
      if (items[0]) {
        items[0].dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
      }
    });
    await page.waitForTimeout(200);

    // コンテキストメニューが表示される
    const contextMenu = page.locator('.cl-context-menu');
    await expect(contextMenu).toBeVisible({ timeout: 3000 });

    // メニューアイテムが存在する
    const menuItemCount = await page.evaluate(() => {
      var menu = document.querySelector('.cl-context-menu');
      if (!menu) return 0;
      return menu.querySelectorAll('[role="menuitem"], .cl-context-menu-item, li, button').length;
    });
    expect(menuItemCount).toBeGreaterThan(0);

    // Escape でメニューを閉じる
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await expect(contextMenu).not.toBeVisible();
  });

  // -------------------------------------------------------------------------
  // 6. Active chapter highlight
  // -------------------------------------------------------------------------
  test('クリックしたアイテムに .cl-item--active クラスが付く', async ({ page }) => {
    await setEditorContent(
      page,
      '## Chapter 1\n\n本文A\n\n## Chapter 2\n\n本文B\n\n## Chapter 3\n\n本文C'
    );
    await enterFocusMode(page);

    await page.waitForSelector('#focus-chapter-list .cl-item', { timeout: 5000 });

    // 1番目をクリック → active になる
    await page.evaluate(() => {
      var items = document.querySelectorAll('#focus-chapter-list .cl-item');
      if (items[0]) items[0].click();
    });
    await page.waitForTimeout(200);

    const activeIdx0 = await page.evaluate(() => {
      var items = document.querySelectorAll('#focus-chapter-list .cl-item');
      var actives = [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].classList.contains('cl-item--active')) actives.push(i);
      }
      return actives;
    });
    expect(activeIdx0).toContain(0);
    expect(activeIdx0).not.toContain(1);
    expect(activeIdx0).not.toContain(2);

    // 3番目をクリック → active が移動する
    await page.evaluate(() => {
      var items = document.querySelectorAll('#focus-chapter-list .cl-item');
      if (items[2]) items[2].click();
    });
    await page.waitForTimeout(200);

    const activeIdx2 = await page.evaluate(() => {
      var items = document.querySelectorAll('#focus-chapter-list .cl-item');
      var actives = [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].classList.contains('cl-item--active')) actives.push(i);
      }
      return actives;
    });
    expect(activeIdx2).toContain(2);
    expect(activeIdx2).not.toContain(0);
    expect(activeIdx2).not.toContain(1);
  });
});
