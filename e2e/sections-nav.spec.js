// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('SP-052 Sections Navigator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForLoadState('networkidle');
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
    await page.click('#toggle-sidebar');
    await page.waitForTimeout(200);

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
    await page.click('#toggle-sidebar');
    await page.waitForTimeout(300);

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
    await page.click('#toggle-sidebar');
    await page.waitForTimeout(300);

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

  test('エディタ下部ナビが表示される', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 下部ナビが存在する
    const navExists = await page.evaluate(() => {
      return !!document.getElementById('editor-bottom-nav');
    });
    expect(navExists).toBe(true);

    // ボタンが存在する
    const prevExists = await page.evaluate(() => {
      return !!document.getElementById('bottom-nav-prev');
    });
    expect(prevExists).toBe(true);

    const nextExists = await page.evaluate(() => {
      return !!document.getElementById('bottom-nav-next');
    });
    expect(nextExists).toBe(true);
  });

  test('下部ナビにアクティブセクション名が表示される', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await setEditorContent(page, '# 第1章 始まり\n\n本文...\n\n# 第2章 終わり\n\n本文...');

    // カーソルを先頭に設定して再度renderをトリガー
    await page.evaluate(() => {
      var editor = document.getElementById('editor');
      if (editor) {
        editor.selectionStart = 0;
        editor.selectionEnd = 0;
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.waitForTimeout(300);

    // 下部ナビのタイトルが第1章になっている
    const titleText = await page.evaluate(() => {
      var el = document.getElementById('bottom-nav-title-text');
      return el ? el.textContent : '';
    });
    expect(titleText).toBe('第1章 始まり');
  });
});

// =========================================================
//  Phase 2: WYSIWYG セクションコラプス
// =========================================================
test.describe('SP-052 Phase 2: WYSIWYG Section Collapse', () => {
  // WYSIWYG モードを有効化
  test.use({
    storageState: {
      cookies: [],
      origins: [{
        origin: 'http://127.0.0.1:9080',
        localStorage: [],
      }],
    },
  });

  const MULTI_SECTION_MD = [
    '# 第1章 序章',
    '',
    '序章の段落1。',
    '',
    '序章の段落2。',
    '',
    '序章の段落3。',
    '',
    '序章の段落4。',
    '',
    '# 第2章 展開',
    '',
    '展開の段落1。',
    '',
    '展開の段落2。',
    '',
    '展開の段落3。',
    '',
    '# 第3章 結末',
    '',
    '結末の段落1。',
    '',
    '結末の段落2。',
    '',
    '結末の段落3。',
  ].join('\n');

  /** Helper: set content and wait for WYSIWYG + gadget render */
  async function setupWysiwygContent(page, text) {
    await page.goto('/?reset=1');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(600);

    await page.evaluate((t) => {
      if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function') {
        window.ZenWriterEditor.setContent(t);
      }
      var editor = document.getElementById('editor');
      if (editor) editor.dispatchEvent(new Event('input', { bubbles: true }));
      var wysiwyg = document.getElementById('wysiwyg-editor');
      if (wysiwyg) wysiwyg.dispatchEvent(new Event('input', { bubbles: true }));
    }, text);

    await page.waitForTimeout(400);
  }

  test('ツリーノードクリックで他セクションが折りたたまれる', async ({ page }) => {
    await setupWysiwygContent(page, MULTI_SECTION_MD);

    // サイドバーを開く
    await page.click('#toggle-sidebar');
    await page.waitForTimeout(300);

    // 第2章をクリック
    await page.evaluate(() => {
      var nodes = document.querySelectorAll('.sections-tree-node');
      if (nodes[1]) nodes[1].click();
    });
    await page.waitForTimeout(500);

    // コラプスがアクティブ
    const collapseActive = await page.evaluate(() => {
      return document.getElementById('wysiwyg-editor')
        ?.hasAttribute('data-section-collapse-active') ?? false;
    });
    expect(collapseActive).toBe(true);

    // 非アクティブセクションに data-collapsed 要素がある
    const collapsedCount = await page.evaluate(() => {
      return document.querySelectorAll('#wysiwyg-editor [data-collapsed="true"]').length;
    });
    expect(collapsedCount).toBeGreaterThan(0);

    // 省略マーカーが存在する
    const markerCount = await page.evaluate(() => {
      return document.querySelectorAll('#wysiwyg-editor .section-collapse-more').length;
    });
    expect(markerCount).toBeGreaterThan(0);
  });

  test('折りたたみ時に先頭2段落が表示される', async ({ page }) => {
    await setupWysiwygContent(page, MULTI_SECTION_MD);

    await page.click('#toggle-sidebar');
    await page.waitForTimeout(300);

    // 第2章をクリック → 第1章と第3章が折りたたまれる
    await page.evaluate(() => {
      var nodes = document.querySelectorAll('.sections-tree-node');
      if (nodes[1]) nodes[1].click();
    });
    await page.waitForTimeout(500);

    // 第1章の表示段落数を確認 (先頭2段落は表示、残りは非表示)
    const ch1Visible = await page.evaluate(() => {
      var wysiwyg = document.getElementById('wysiwyg-editor');
      if (!wysiwyg) return { visible: 0, hidden: 0 };
      var headings = wysiwyg.querySelectorAll('h1, h2, h3, h4, h5, h6');
      if (headings.length < 1) return { visible: 0, hidden: 0 };
      // 第1章 (index 0) の次の見出しまでの段落を数える
      var visible = 0, hidden = 0;
      var sibling = headings[0].nextElementSibling;
      while (sibling && !/^H[1-6]$/.test(sibling.tagName)) {
        if (sibling.classList && sibling.classList.contains('section-collapse-more')) {
          sibling = sibling.nextElementSibling;
          continue;
        }
        if (sibling.getAttribute('data-collapsed') === 'true') {
          hidden++;
        } else {
          visible++;
        }
        sibling = sibling.nextElementSibling;
      }
      return { visible, hidden };
    });
    expect(ch1Visible.visible).toBe(2);
    expect(ch1Visible.hidden).toBeGreaterThan(0);
  });

  test('省略マーカークリックでセクション切替', async ({ page }) => {
    await setupWysiwygContent(page, MULTI_SECTION_MD);

    await page.click('#toggle-sidebar');
    await page.waitForTimeout(300);

    // 第2章をクリックしてコラプス適用
    await page.evaluate(() => {
      var nodes = document.querySelectorAll('.sections-tree-node');
      if (nodes[1]) nodes[1].click();
    });
    await page.waitForTimeout(500);

    // 第1章の省略マーカーをクリック → 第1章がアクティブに切替
    await page.evaluate(() => {
      var marker = document.querySelector('#wysiwyg-editor .section-collapse-more[data-collapse-section-index="0"]');
      if (marker) marker.click();
    });
    await page.waitForTimeout(500);

    // 第1章がアクティブセクションになっている
    const activeTitle = await page.evaluate(() => {
      var active = document.querySelector('#wysiwyg-editor [data-section-active="true"]');
      return active ? active.textContent.trim() : '';
    });
    expect(activeTitle).toContain('第1章');
  });

  test('全展開ボタンでコラプス解除', async ({ page }) => {
    await setupWysiwygContent(page, MULTI_SECTION_MD);

    await page.click('#toggle-sidebar');
    await page.waitForTimeout(300);

    // コラプス適用
    await page.evaluate(() => {
      var nodes = document.querySelectorAll('.sections-tree-node');
      if (nodes[1]) nodes[1].click();
    });
    await page.waitForTimeout(500);

    // 全展開ボタンが表示されている
    const expandBtnVisible = await page.evaluate(() => {
      var btn = document.querySelector('.sections-expand-all-btn');
      return btn ? btn.style.display !== 'none' : false;
    });
    expect(expandBtnVisible).toBe(true);

    // 全展開をクリック
    await page.evaluate(() => {
      var btn = document.querySelector('.sections-expand-all-btn');
      if (btn) btn.click();
    });
    await page.waitForTimeout(500);

    // コラプスが解除されている
    const collapsedAfter = await page.evaluate(() => {
      return document.querySelectorAll('#wysiwyg-editor [data-collapsed="true"]').length;
    });
    expect(collapsedAfter).toBe(0);

    const markersAfter = await page.evaluate(() => {
      return document.querySelectorAll('#wysiwyg-editor .section-collapse-more').length;
    });
    expect(markersAfter).toBe(0);
  });

  test('下部ナビprev/nextでコラプスが追従する', async ({ page }) => {
    await setupWysiwygContent(page, MULTI_SECTION_MD);

    await page.click('#toggle-sidebar');
    await page.waitForTimeout(300);

    // 第1章をクリックしてコラプス適用
    await page.evaluate(() => {
      var nodes = document.querySelectorAll('.sections-tree-node');
      if (nodes[0]) nodes[0].click();
    });
    await page.waitForTimeout(500);

    // nextボタンをクリック → 第2章へ
    await page.click('#bottom-nav-next');
    await page.waitForTimeout(500);

    // コラプスがアクティブで、第2章がアクティブセクション
    const activeTitle = await page.evaluate(() => {
      var active = document.querySelector('#wysiwyg-editor [data-section-active="true"]');
      return active ? active.textContent.trim() : '';
    });
    expect(activeTitle).toContain('第2章');

    // コラプスが維持されている
    const collapseActive = await page.evaluate(() => {
      return document.getElementById('wysiwyg-editor')
        ?.hasAttribute('data-section-collapse-active') ?? false;
    });
    expect(collapseActive).toBe(true);
  });

  test('ステータスバーがエディタ外に固定表示される', async ({ page }) => {
    await setupWysiwygContent(page, MULTI_SECTION_MD);

    // ステータスバーがeditor-containerの外にある
    const isOutsideEditor = await page.evaluate(() => {
      var nav = document.getElementById('editor-bottom-nav');
      var editorContainer = document.querySelector('.editor-container');
      if (!nav || !editorContainer) return false;
      return !editorContainer.contains(nav);
    });
    expect(isOutsideEditor).toBe(true);

    // ステータスバーが表示されている
    const isVisible = await page.evaluate(() => {
      var nav = document.getElementById('editor-bottom-nav');
      if (!nav) return false;
      var style = window.getComputedStyle(nav);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
    expect(isVisible).toBe(true);
  });
});
