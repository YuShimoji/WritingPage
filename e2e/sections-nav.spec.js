// @ts-check
const { test, expect } = require('@playwright/test');
const { ensureNormalMode, openSidebar } = require('./helpers');

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
});

// SP-052 Phase 2 (WYSIWYG Section Collapse) テスト削除 — session 91 でコラプス機能廃止 (applySectionCollapse no-op、全展開ボタン撤去)
