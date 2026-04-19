// @ts-check
const { test, expect } = require('@playwright/test');
const { ensureNormalMode, openSidebar, setUIMode } = require('./helpers');

test.describe('SP-052 Sections Navigator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForLoadState('networkidle');
    await ensureNormalMode(page);
  });

  /** Helper: set editor content via app API and wait for gadget to update */
  async function setEditorContent(page, text) {
    // Wait for all init timers to complete
    await page.waitForTimeout(600);

    await page.evaluate((text) => {
      // Use the app's setContent API to handle both textarea and WYSIWYG modes
      if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function') {
        window.ZenWriterEditor.setContent(text);
      } else {
        var editor = document.getElementById('editor');
        if (editor) editor.value = text;
      }
      // Dispatch input event on textarea to trigger gadget render
      var editor = document.getElementById('editor');
      if (editor) editor.dispatchEvent(new Event('input', { bubbles: true }));
      // Also dispatch on wysiwyg editor if exists
      var wysiwyg = document.getElementById('wysiwyg-editor');
      if (wysiwyg) wysiwyg.dispatchEvent(new Event('input', { bubbles: true }));
    }, text);

    // Wait for debounce (120ms) + render
    await page.waitForTimeout(300);
  }

  test('セクションカテゴリがサイドバーに存在する', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // サイドバーを開く
    await openSidebar(page);

    // sections カテゴリが存在する
    const sectionsCategory = await page.evaluate(() => {
      return !!document.querySelector('[data-category="sections"]');
    });
    expect(sectionsCategory).toBe(true);

    // sections が最上段にある（structure より前）
    const order = await page.evaluate(() => {
      var cats = document.querySelectorAll('.accordion-category');
      var result = [];
      for (var i = 0; i < cats.length; i++) {
        result.push(cats[i].getAttribute('data-category'));
      }
      return result;
    });
    expect(order.indexOf('sections')).toBeLessThan(order.indexOf('structure'));
  });

  test('見出しツリーが正しくレンダリングされる', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await setEditorContent(page, '# 第1章 序章\n\n本文...\n\n## シーン1\n\nシーン本文\n\n## シーン2\n\nシーン本文\n\n# 第2章 展開\n\n本文...');

    // サイドバーを開く
    await openSidebar(page);

    // ツリーノードが存在する
    const nodeCount = await page.evaluate(() => {
      return document.querySelectorAll('.sections-tree-node').length;
    });
    expect(nodeCount).toBe(4); // 第1章, シーン1, シーン2, 第2章

    // ノードテキストが正しい
    const titles = await page.evaluate(() => {
      var nodes = document.querySelectorAll('.sections-tree-node .sections-node-title');
      var result = [];
      for (var i = 0; i < nodes.length; i++) {
        result.push(nodes[i].textContent);
      }
      return result;
    });
    expect(titles).toEqual(['第1章 序章', 'シーン1', 'シーン2', '第2章 展開']);
  });

  test('ツリーノードクリックでエディタがジャンプする', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await setEditorContent(page, '# 第1章\n\n本文...\n\n# 第2章\n\n本文...');

    // サイドバーを開く
    await openSidebar(page);

    // 2番目のノード（第2章）をクリック
    await page.evaluate(() => {
      var nodes = document.querySelectorAll('.sections-tree-node');
      if (nodes[1]) nodes[1].click();
    });
    await page.waitForTimeout(300);

    // カーソルが第2章の位置に移動している
    const cursorPos = await page.evaluate(() => {
      var editor = document.getElementById('editor');
      return editor ? editor.selectionStart : -1;
    });
    const expectedPos = await page.evaluate(() => {
      var editor = document.getElementById('editor');
      return editor ? editor.value.indexOf('# 第2章') : -1;
    });
    expect(expectedPos).toBeGreaterThanOrEqual(0);
    expect(cursorPos).toBe(expectedPos);
  });

  test('エディタ下部ナビ (Legacy) が存在しない', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const navExists = await page.evaluate(() => {
      return !!document.getElementById('editor-bottom-nav');
    });
    expect(navExists).toBe(false);
  });

  test('session 109: chapterMode 新章の virtual heading クリックで該当章にジャンプする', async ({ page }) => {
    // session 108 で sections ガジェットに ChapterStore 章タイトルを virtual heading として統合したが、
    // offset: -1 のままで textarea へ selectionStart を渡していたため click が未定義動作だった。
    // session 109 で virtual heading → navigateTo ルートを追加した回帰テスト。
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // chapterMode で 2 章をセットアップ (直接 Store 操作)
    await page.evaluate(() => {
      var S = window.ZenWriterStorage;
      var Store = window.ZWChapterStore;
      var docId = S.getCurrentDocId();
      if (Store.ensureChapterMode) Store.ensureChapterMode(docId);
      var existing = Store.getChaptersForDoc(docId) || [];
      for (var i = 0; i < existing.length; i++) Store.deleteChapter(existing[i].id);
      Store.createChapter(docId, '章Alpha', 'alpha-body', null, 2);
      var chs = Store.getChaptersForDoc(docId) || [];
      var prevId = chs.length ? chs[chs.length - 1].id : null;
      Store.createChapter(docId, '章Beta', 'beta-body', prevId, 2);
    });
    await page.waitForTimeout(200);

    // Focus モードに入る → chapter-list が refresh され内部 chapters 配列が populate される
    await setUIMode(page, 'focus');
    await page.waitForTimeout(400);

    // sidebar を開いて sections アコーディオンを展開 (ガジェット init を確実に)
    await openSidebar(page);
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      var header = document.querySelector('.accordion-header[aria-controls="accordion-sections"]');
      if (header && header.getAttribute('aria-expanded') !== 'true') header.click();
      // sections ガジェットへ再描画を促す
      window.dispatchEvent(new CustomEvent('ZWChapterStoreChanged'));
    });
    await page.waitForTimeout(500);

    // virtual heading (「章Beta」) のノードが存在することを確認
    const titles = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.sections-tree-node .sections-node-title'))
        .map(function (el) { return el.textContent.trim(); });
    });
    expect(titles).toContain('章Alpha');
    expect(titles).toContain('章Beta');

    // 章Beta のノードをクリック (virtual heading → navigateTo ルート)
    await page.evaluate(() => {
      var nodes = document.querySelectorAll('.sections-tree-node');
      for (var i = 0; i < nodes.length; i++) {
        var t = nodes[i].querySelector('.sections-node-title');
        if (t && t.textContent.trim() === '章Beta') { nodes[i].click(); return; }
      }
    });
    await page.waitForTimeout(500);

    // virtual heading クリック後、ZWChapterList がアクティブ章 index を切り替えた、
    // または editor に章Beta の内容が表示されていること
    const result = await page.evaluate(() => {
      var cl = window.ZWChapterList;
      var activeIdx = cl && typeof cl.getActiveIndex === 'function' ? cl.getActiveIndex() : null;
      var editor = document.getElementById('editor');
      var wysiwyg = document.getElementById('wysiwyg-editor');
      var edText = editor ? editor.value : '';
      var wysiwygText = wysiwyg ? (wysiwyg.textContent || wysiwyg.innerText || '') : '';
      return { activeIdx: activeIdx, editorContent: edText, wysiwygText: wysiwygText };
    });
    // virtual heading クリック後: アクティブ章 index = 1 (章Beta) または editor に beta-body
    var hasBeta = (result.editorContent && result.editorContent.indexOf('beta-body') >= 0) ||
      (result.wysiwygText && result.wysiwygText.indexOf('beta-body') >= 0) ||
      result.activeIdx === 1;
    expect(hasBeta).toBe(true);
  });

  test('同名章が複数あっても sections に全件表示され、順にクリックで各章へ遷移する', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      var S = window.ZenWriterStorage;
      var Store = window.ZWChapterStore;
      var docId = S.getCurrentDocId();
      if (Store.ensureChapterMode) Store.ensureChapterMode(docId);
      var existing = Store.getChaptersForDoc(docId) || [];
      for (var i = 0; i < existing.length; i++) Store.deleteChapter(existing[i].id);
      Store.createChapter(docId, 'SameTitle', 'dup-body-first', null, 2);
      var chs = Store.getChaptersForDoc(docId) || [];
      var prevId = chs.length ? chs[chs.length - 1].id : null;
      Store.createChapter(docId, 'SameTitle', 'dup-body-second', prevId, 2);
    });
    await page.waitForTimeout(200);

    await setUIMode(page, 'focus');
    await page.waitForTimeout(400);

    await openSidebar(page);
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      var header = document.querySelector('.accordion-header[aria-controls="accordion-sections"]');
      if (header && header.getAttribute('aria-expanded') !== 'true') header.click();
      window.dispatchEvent(new CustomEvent('ZWChapterStoreChanged'));
    });
    await page.waitForTimeout(500);

    const dupCount = await page.evaluate(() => {
      var titles = Array.from(document.querySelectorAll('.sections-tree-node .sections-node-title'))
        .map(function (el) { return el.textContent.trim(); });
      return titles.filter(function (t) { return t === 'SameTitle'; }).length;
    });
    expect(dupCount).toBe(2);

    await page.evaluate(() => {
      var nodes = document.querySelectorAll('.sections-tree-node');
      var matches = [];
      for (var i = 0; i < nodes.length; i++) {
        var t = nodes[i].querySelector('.sections-node-title');
        if (t && t.textContent.trim() === 'SameTitle') matches.push(nodes[i]);
      }
      if (matches[0]) matches[0].click();
    });
    await page.waitForTimeout(500);

    const r1 = await page.evaluate(() => {
      var cl = window.ZWChapterList;
      var idx = cl && typeof cl.getActiveIndex === 'function' ? cl.getActiveIndex() : null;
      var editor = document.getElementById('editor');
      var wysiwyg = document.getElementById('wysiwyg-editor');
      var edText = editor ? editor.value : '';
      var wyText = wysiwyg ? (wysiwyg.textContent || wysiwyg.innerText || '') : '';
      return { idx: idx, edText: edText, wyText: wyText };
    });
    const okFirst = r1.idx === 0 ||
      (r1.edText && r1.edText.indexOf('dup-body-first') >= 0) ||
      (r1.wyText && r1.wyText.indexOf('dup-body-first') >= 0);
    expect(okFirst).toBe(true);

    await page.evaluate(() => {
      var nodes = document.querySelectorAll('.sections-tree-node');
      var matches = [];
      for (var i = 0; i < nodes.length; i++) {
        var t = nodes[i].querySelector('.sections-node-title');
        if (t && t.textContent.trim() === 'SameTitle') matches.push(nodes[i]);
      }
      if (matches[1]) matches[1].click();
    });
    await page.waitForTimeout(500);

    const r2 = await page.evaluate(() => {
      var cl = window.ZWChapterList;
      var idx = cl && typeof cl.getActiveIndex === 'function' ? cl.getActiveIndex() : null;
      var editor = document.getElementById('editor');
      var wysiwyg = document.getElementById('wysiwyg-editor');
      var edText = editor ? editor.value : '';
      var wyText = wysiwyg ? (wysiwyg.textContent || wysiwyg.innerText || '') : '';
      return { idx: idx, edText: edText, wyText: wyText };
    });
    const okSecond = r2.idx === 1 ||
      (r2.edText && r2.edText.indexOf('dup-body-second') >= 0) ||
      (r2.wyText && r2.wyText.indexOf('dup-body-second') >= 0);
    expect(okSecond).toBe(true);
  });
});

// SP-052 Phase 2 (WYSIWYG Section Collapse) テスト削除 — session 91 でコラプス機能廃止 (applySectionCollapse no-op、全展開ボタン撤去)
