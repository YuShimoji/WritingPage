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

  test('見出しがないときは空状態と現在の状態が表示される', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await setEditorContent(page, '');
    await openSidebar(page);

    const emptyState = await page.evaluate(() => {
      var title = document.querySelector('.sections-empty-state__title');
      var meta = document.querySelector('.sections-empty-state__meta');
      var hint = document.querySelector('.sections-empty-state__hint');
      return {
        visible: !!(title && title.offsetParent !== null),
        title: title ? title.textContent.trim() : '',
        meta: meta ? meta.textContent.trim() : '',
        hint: hint ? hint.textContent.trim() : ''
      };
    });

    expect(emptyState.visible).toBe(true);
    expect(emptyState.title).toContain('表示できるセクションがまだありません');
    expect(emptyState.meta).toContain('現在:');
    expect(emptyState.hint).toContain('見出し');
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

  test('同名章 3 件が sections に全表示され、遷移後に戻っても正しい章へ飛ぶ', async ({ page }) => {
    // session 110: mergeVirtualChapterHeadings の 1 対 1 突き合わせ回帰
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 同名タイトル 3 章をセットアップ
    await page.evaluate(() => {
      var S = window.ZenWriterStorage;
      var Store = window.ZWChapterStore;
      var docId = S.getCurrentDocId();
      if (Store.ensureChapterMode) Store.ensureChapterMode(docId);
      var existing = Store.getChaptersForDoc(docId) || [];
      for (var i = 0; i < existing.length; i++) Store.deleteChapter(existing[i].id);
      Store.createChapter(docId, 'SameTitle', 'body-FIRST', null, 2);
      var chs = Store.getChaptersForDoc(docId) || [];
      Store.createChapter(docId, 'SameTitle', 'body-SECOND', chs[chs.length - 1].id, 2);
      chs = Store.getChaptersForDoc(docId) || [];
      Store.createChapter(docId, 'SameTitle', 'body-THIRD', chs[chs.length - 1].id, 2);
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

    // 3 行とも表示されること
    const dupCount = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.sections-tree-node .sections-node-title'))
        .filter(function (el) { return el.textContent.trim() === 'SameTitle'; }).length;
    });
    expect(dupCount).toBe(3);

    // ヘルパ: N 番目の SameTitle ノードをクリックしてアクティブ章情報を返す
    async function clickSameTitleAt(n) {
      await page.evaluate((idx) => {
        var nodes = document.querySelectorAll('.sections-tree-node');
        var matches = [];
        for (var i = 0; i < nodes.length; i++) {
          var t = nodes[i].querySelector('.sections-node-title');
          if (t && t.textContent.trim() === 'SameTitle') matches.push(nodes[i]);
        }
        if (matches[idx]) matches[idx].click();
      }, n);
      await page.waitForTimeout(500);
      return page.evaluate(() => {
        var cl = window.ZWChapterList;
        var idx = cl && typeof cl.getActiveIndex === 'function' ? cl.getActiveIndex() : null;
        var editor = document.getElementById('editor');
        var wysiwyg = document.getElementById('wysiwyg-editor');
        var edText = editor ? editor.value : '';
        var wyText = wysiwyg ? (wysiwyg.textContent || wysiwyg.innerText || '') : '';
        return { idx: idx, edText: edText, wyText: wyText };
      });
    }

    function hasBody(result, marker) {
      return (result.edText && result.edText.indexOf(marker) >= 0) ||
        (result.wyText && result.wyText.indexOf(marker) >= 0);
    }

    // 1 件目 (idx 0) → body-FIRST
    const r0 = await clickSameTitleAt(0);
    expect(r0.idx === 0 || hasBody(r0, 'body-FIRST')).toBe(true);

    // 3 件目 (idx 2) → body-THIRD — 1 件目を飛ばして 3 件目へ直接遷移
    const r2 = await clickSameTitleAt(2);
    expect(r2.idx === 2 || hasBody(r2, 'body-THIRD')).toBe(true);

    // 別章 (2 件目) に一度移動
    const r1 = await clickSameTitleAt(1);
    expect(r1.idx === 1 || hasBody(r1, 'body-SECOND')).toBe(true);

    // 1 件目に戻って再クリック — 移動後も正しい章に飛ぶこと
    const r0b = await clickSameTitleAt(0);
    expect(r0b.idx === 0 || hasBody(r0b, 'body-FIRST')).toBe(true);

    // 3 件目に再クリック — 同じく正しい章に飛ぶこと
    const r2b = await clickSameTitleAt(2);
    expect(r2b.idx === 2 || hasBody(r2b, 'body-THIRD')).toBe(true);
  });

  test('session 110: autoSave OFF でも章内容は保存され、章切替後も保持される', async ({ page }) => {
    // autoSave.enabled は HUD 通知のみ制御し、章内容保存は常時実行する契約 (INVARIANTS)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // chapterMode で 2 章セットアップ
    await page.evaluate(() => {
      var S = window.ZenWriterStorage;
      var Store = window.ZWChapterStore;
      var docId = S.getCurrentDocId();
      if (Store.ensureChapterMode) Store.ensureChapterMode(docId);
      var existing = Store.getChaptersForDoc(docId) || [];
      for (var i = 0; i < existing.length; i++) Store.deleteChapter(existing[i].id);
      Store.createChapter(docId, 'Ch-A', 'content-A', null, 2);
      var chs = Store.getChaptersForDoc(docId) || [];
      Store.createChapter(docId, 'Ch-B', 'content-B', chs[chs.length - 1].id, 2);
    });
    await page.waitForTimeout(200);

    // autoSave OFF に設定
    await page.evaluate(() => {
      var s = window.ZenWriterStorage.loadSettings();
      s.autoSave = { ...(s.autoSave || {}), enabled: false };
      window.ZenWriterStorage.saveSettings(s);
    });

    // Focus モードに入り章を表示
    await setUIMode(page, 'focus');
    await page.waitForTimeout(400);

    // Ch-A に入力を追加
    await page.evaluate(() => {
      var cl = window.ZWChapterList;
      if (cl && typeof cl.navigateTo === 'function') cl.navigateTo(0);
    });
    await page.waitForTimeout(300);

    // エディタに追記 (WYSIWYG or textarea)
    await page.evaluate(() => {
      var wysiwyg = document.getElementById('wysiwyg-editor');
      var editor = document.getElementById('editor');
      if (wysiwyg && wysiwyg.contentEditable === 'true') {
        wysiwyg.focus();
        document.execCommand('insertText', false, ' APPENDED');
        wysiwyg.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (editor) {
        editor.value += ' APPENDED';
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.waitForTimeout(600); // flush debounce

    // Ch-B に切り替え
    await page.evaluate(() => {
      var cl = window.ZWChapterList;
      if (cl && typeof cl.navigateTo === 'function') cl.navigateTo(1);
    });
    await page.waitForTimeout(400);

    // Ch-A に戻る
    await page.evaluate(() => {
      var cl = window.ZWChapterList;
      if (cl && typeof cl.navigateTo === 'function') cl.navigateTo(0);
    });
    await page.waitForTimeout(400);

    // Ch-A の内容に APPENDED が残っていること
    const content = await page.evaluate(() => {
      var wysiwyg = document.getElementById('wysiwyg-editor');
      var editor = document.getElementById('editor');
      var wyText = wysiwyg ? (wysiwyg.textContent || wysiwyg.innerText || '') : '';
      var edText = editor ? editor.value : '';
      return wyText + edText;
    });
    expect(content).toContain('APPENDED');

    // autoSave ON に戻す (cleanup)
    await page.evaluate(() => {
      var s = window.ZenWriterStorage.loadSettings();
      s.autoSave = { ...(s.autoSave || {}), enabled: true };
      window.ZenWriterStorage.saveSettings(s);
    });
  });

  test('session 110: autoSave OFF 時は HUD 通知が出ず、ON にすると出る', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // chapterMode + autoSave OFF
    await page.evaluate(() => {
      var S = window.ZenWriterStorage;
      var Store = window.ZWChapterStore;
      var docId = S.getCurrentDocId();
      if (Store.ensureChapterMode) Store.ensureChapterMode(docId);
      var existing = Store.getChaptersForDoc(docId) || [];
      for (var i = 0; i < existing.length; i++) Store.deleteChapter(existing[i].id);
      Store.createChapter(docId, 'TestCh', 'test-content', null, 2);
      var s = S.loadSettings();
      s.autoSave = { ...(s.autoSave || {}), enabled: false };
      S.saveSettings(s);
    });
    await page.waitForTimeout(200);

    await setUIMode(page, 'focus');
    await page.waitForTimeout(400);

    // 入力して flush を発火
    await page.evaluate(() => {
      var wysiwyg = document.getElementById('wysiwyg-editor');
      var editor = document.getElementById('editor');
      if (wysiwyg && wysiwyg.contentEditable === 'true') {
        wysiwyg.focus();
        document.execCommand('insertText', false, ' X');
        wysiwyg.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (editor) {
        editor.value += ' X';
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    // HUD cooldown + flush debounce を十分待つ
    await page.waitForTimeout(4000);

    // autoSave OFF なので HUD「自動保存」テキストが出ていないはず
    const hudHasAutoSaveText = await page.evaluate(() => {
      var hud = document.querySelector('.mini-hud');
      return hud ? (hud.textContent || '').indexOf('自動保存') >= 0 : false;
    });
    expect(hudHasAutoSaveText).toBe(false);

    // autoSave ON に切り替え
    await page.evaluate(() => {
      var s = window.ZenWriterStorage.loadSettings();
      s.autoSave = { ...(s.autoSave || {}), enabled: true };
      window.ZenWriterStorage.saveSettings(s);
    });

    // cooldown をリセットするため十分待ってから再入力
    await page.waitForTimeout(3500);
    await page.evaluate(() => {
      var wysiwyg = document.getElementById('wysiwyg-editor');
      var editor = document.getElementById('editor');
      if (wysiwyg && wysiwyg.contentEditable === 'true') {
        wysiwyg.focus();
        document.execCommand('insertText', false, ' Y');
        wysiwyg.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (editor) {
        editor.value += ' Y';
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // HUD 通知「自動保存されました」が表示されることを確認
    // flush debounce 500ms + HUD 表示タイミングを考慮して待機
    const hudAppeared = await page.waitForFunction(() => {
      var hud = document.querySelector('.mini-hud');
      if (!hud) return false;
      return hud.textContent && hud.textContent.indexOf('自動保存') >= 0;
    }, { timeout: 5000 }).then(() => true).catch(() => false);
    expect(hudAppeared).toBe(true);

    // cleanup
    await page.evaluate(() => {
      var s = window.ZenWriterStorage.loadSettings();
      s.autoSave = { ...(s.autoSave || {}), enabled: true };
      window.ZenWriterStorage.saveSettings(s);
    });
  });
});

// SP-052 Phase 2 (WYSIWYG Section Collapse) テスト削除 — session 91 でコラプス機能廃止 (applySectionCollapse no-op、全展開ボタン撤去)
