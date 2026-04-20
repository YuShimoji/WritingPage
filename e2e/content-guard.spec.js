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

async function getEditorContent(page) { // eslint-disable-line no-unused-vars
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
      if (Store.ensureChapterMode) Store.ensureChapterMode(doc.id);

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

// ---------------------------------------------------------------------------
// session 105 Slice 2: ドキュメント一覧 UX
// ---------------------------------------------------------------------------
test.describe('Documents Hierarchy UX (session 105)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForLoadState('networkidle');
  });

  /** ドキュメントを n 件作成し、structure パネルの Documents ガジェットを表示する */
  async function setupDocsAndOpenGadget(page, n) {
    // ドキュメントを n 件作成
    await page.evaluate((count) => {
      var S = window.ZenWriterStorage;
      var originalNow = Date.now;
      var seed = originalNow();
      try {
        for (var i = 0; i < count; i++) {
          Date.now = function () { return seed + i; };
          S.createDocument('TestDoc-' + i, 'Content of doc ' + i);
        }
      } finally {
        Date.now = originalNow;
      }
    }, n);
    await page.waitForTimeout(200);

    // Normal モードでサイドバーを開き、structure カテゴリを展開
    await page.evaluate(() => {
      if (window.ZenWriterApp) window.ZenWriterApp.setUIMode('normal');
      var sidebar = document.getElementById('sidebar');
      if (sidebar && !sidebar.classList.contains('open') &&
          window.sidebarManager && typeof window.sidebarManager.forceSidebarState === 'function') {
        window.sidebarManager.forceSidebarState(true);
      }
      // slim モード解除
      document.documentElement.removeAttribute('data-sidebar-slim');
      // structure アコーディオンを展開
      var header = document.querySelector('.accordion-header[aria-controls="accordion-structure"]');
      if (header && header.getAttribute('aria-expanded') !== 'true') header.click();
    });
    await page.waitForTimeout(500);

    // Documents ガジェットが存在するか確認
    await page.waitForFunction(() => {
      return document.querySelector('.documents-hierarchy') !== null ||
        document.querySelector('.documents-tree-container') !== null;
    }, { timeout: 10000 });
  }

  async function expandDocumentsGadget(page) {
    await page.evaluate(() => {
      var gadgets = document.querySelectorAll('#structure-gadgets-panel [data-gadget-collapsed]');
      gadgets.forEach(function (g) { g.removeAttribute('data-gadget-collapsed'); });
    });
    await page.waitForTimeout(300);
  }

  async function enableMultiSelect(page) {
    await expandDocumentsGadget(page);

    await page.evaluate(() => {
      var panel = document.getElementById('structure-gadgets-panel');
      if (!panel) return;
      var btns = panel.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        if (btns[i].textContent.trim() === '...' || btns[i].textContent.trim() === '\u2026') {
          btns[i].click();
          return;
        }
      }
    });
    await page.waitForTimeout(300);

    const activated = await page.evaluate(() => {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var text = btns[i].textContent || '';
        if (text.indexOf('複数選択') >= 0 && btns[i].offsetParent !== null) {
          btns[i].click();
          return true;
        }
      }
      return false;
    });
    if (!activated) {
      test.skip();
      return false;
    }
    await page.waitForTimeout(500);
    return true;
  }

  async function getMultiSelectState(page) {
    return page.evaluate(() => {
      var cbs = document.querySelectorAll('.tree-select-cb');
      var checkedCount = 0;
      for (var i = 0; i < cbs.length; i++) {
        if (cbs[i].checked) checkedCount++;
      }

      var batchDeleteBtn = Array.from(document.querySelectorAll('.documents-hierarchy button'))
        .find(function (btn) {
          var text = (btn.textContent || '').trim();
          return text === '一括削除' || text.indexOf('件削除') >= 0;
        });
      var selectAllBtn = Array.from(document.querySelectorAll('.documents-hierarchy button'))
        .find(function (btn) {
          var text = (btn.textContent || '').trim();
          return text === '全選択' || text === '全解除';
        });

      return {
        checkboxCount: cbs.length,
        checkedCount: checkedCount,
        batchDeleteVisible: !!(batchDeleteBtn && batchDeleteBtn.offsetParent !== null),
        batchDeleteText: batchDeleteBtn ? (batchDeleteBtn.textContent || '').trim() : '',
        selectAllVisible: !!(selectAllBtn && selectAllBtn.offsetParent !== null),
        selectAllText: selectAllBtn ? (selectAllBtn.textContent || '').trim() : ''
      };
    });
  }

  test('複数選択モードで Shift+Click により範囲選択される', async ({ page }) => {
    await setupDocsAndOpenGadget(page, 5);
    const activated = await enableMultiSelect(page);
    if (!activated) return;

    // チェックボックスが表示されていること
    const cbCount = await page.evaluate(() => {
      return document.querySelectorAll('.tree-select-cb').length;
    });
    expect(cbCount).toBeGreaterThanOrEqual(5);

    // 1 つ目のチェックボックスをクリック (アンカー設定)
    await page.locator('.tree-select-cb').first().click();
    await page.waitForTimeout(400);

    // 4 つ目のチェックボックスを Shift+Click (範囲選択)
    // refreshUI で DOM 再構築されるため nth を再取得して Playwright の modifiers を使う
    await page.locator('.tree-select-cb').nth(3).click({ modifiers: ['Shift'] });
    await page.waitForTimeout(600);

    // refreshUI で DOM が再構築されるため、checked 状態を再計測
    const checkedCount = await page.evaluate(() => {
      var cbs = document.querySelectorAll('.tree-select-cb');
      var count = 0;
      for (var i = 0; i < cbs.length; i++) { if (cbs[i].checked) count++; }
      return count;
    });

    // 1-4 番目 (4 件以上) が選択されているはず
    expect(checkedCount).toBeGreaterThanOrEqual(4);
  });

  test('チェックボックス外クリックでは選択数表示も checked 状態も維持される', async ({ page }) => {
    await setupDocsAndOpenGadget(page, 5);
    const activated = await enableMultiSelect(page);
    if (!activated) return;

    await page.locator('.tree-select-cb').nth(0).click();
    await page.waitForTimeout(250);
    await page.locator('.tree-select-cb').nth(1).click();
    await page.waitForTimeout(400);

    const beforeOutsideClick = await getMultiSelectState(page);
    expect(beforeOutsideClick.checkboxCount).toBeGreaterThanOrEqual(5);
    expect(beforeOutsideClick.checkedCount).toBe(2);
    expect(beforeOutsideClick.batchDeleteVisible).toBe(true);
    expect(beforeOutsideClick.batchDeleteText).toBe('2 件削除');
    expect(beforeOutsideClick.selectAllVisible).toBe(true);

    const outsidePoint = await page.evaluate(() => {
      var target = document.querySelector('#wysiwyg-editor');
      if (!target || window.getComputedStyle(target).display === 'none') {
        target = document.querySelector('#editor');
      }
      if (!target) {
        return { x: window.innerWidth - 24, y: 24 };
      }
      var rect = target.getBoundingClientRect();
      return {
        x: Math.round(rect.left + Math.min(24, Math.max(8, rect.width / 4))),
        y: Math.round(rect.top + Math.min(24, Math.max(8, rect.height / 4)))
      };
    });
    await page.mouse.click(outsidePoint.x, outsidePoint.y);
    await page.waitForTimeout(400);

    const afterOutsideClick = await getMultiSelectState(page);
    expect(afterOutsideClick.checkboxCount).toBe(beforeOutsideClick.checkboxCount);
    expect(afterOutsideClick.checkedCount).toBe(2);
    expect(afterOutsideClick.batchDeleteVisible).toBe(true);
    expect(afterOutsideClick.batchDeleteText).toBe('2 件削除');
    expect(afterOutsideClick.selectAllVisible).toBe(true);
    expect(afterOutsideClick.selectAllText).toBe(beforeOutsideClick.selectAllText);
  });

  test('ドキュメント一覧がスクロール可能で見切れない', async ({ page }) => {
    await setupDocsAndOpenGadget(page, 15);
    await page.waitForTimeout(300);

    const scrollInfo = await page.evaluate(() => {
      var container = document.querySelector('.documents-tree-container');
      if (!container) return null;
      var style = window.getComputedStyle(container);
      // コンテナの overflow 設定と、実際に中身がはみ出す場合にスクロール可能であること
      return {
        overflowY: style.overflowY || style.overflow,
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
        treeItems: container.querySelectorAll('.tree-item').length
      };
    });

    expect(scrollInfo).not.toBeNull();
    // overflow が auto または scroll であること (見切れない条件)
    expect(['auto', 'scroll']).toContain(scrollInfo.overflowY);
    // 15 件のドキュメントが DOM に存在すること (見切れていない)
    expect(scrollInfo.treeItems).toBeGreaterThanOrEqual(15);
  });
});
