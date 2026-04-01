// @ts-nocheck
/**
 * WYSIWYG DSL ブロック静的プレビュー E2E テスト (Q3)
 * 型バッジ表示 + スクロールブロック可視化 + スタイル適用の検証
 */
const { test, expect } = require('@playwright/test');
const { ensureNormalMode } = require('./helpers');

test.describe('WYSIWYG DSL ブロック静的プレビュー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await ensureNormalMode(page);
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-toolbar-mode', 'full');
    });
  });

  /**
   * WYSIWYG に切り替えて DSL ブロックを API 挿入するヘルパー
   */
  async function setupWysiwygWithDsl(page, insertFn) {
    await page.fill('#editor', 'テスト本文');
    await page.locator('#toggle-wysiwyg').dispatchEvent('mousedown');
    await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });
    await page.evaluate(insertFn);
    await page.waitForTimeout(200);
  }

  test('タイピングブロックに型バッジが表示される', async ({ page }) => {
    await setupWysiwygWithDsl(page, () => {
      var rte = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
      if (rte) rte._insertTypingBlock();
    });

    const typing = page.locator('#wysiwyg-editor .zw-typing');
    await expect(typing).toBeAttached({ timeout: 3000 });

    // ::before 擬似要素の content を検証
    const badgeContent = await typing.evaluate(el => {
      return window.getComputedStyle(el, '::before').content;
    });
    expect(badgeContent).toContain('タイピング');

    // 左ボーダーが適用されている
    const borderLeft = await typing.evaluate(el => {
      return window.getComputedStyle(el).borderLeftStyle;
    });
    expect(borderLeft).toBe('solid');
  });

  test('タイピング click モードで拡張バッジが表示される', async ({ page }) => {
    await setupWysiwygWithDsl(page, () => {
      var rte = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
      if (rte) rte._insertTypingBlock({ mode: 'click' });
    });

    const typing = page.locator('#wysiwyg-editor .zw-typing[data-mode="click"]');
    await expect(typing).toBeAttached({ timeout: 3000 });

    const badgeContent = await typing.evaluate(el => {
      return window.getComputedStyle(el, '::before').content;
    });
    expect(badgeContent).toContain('クリック');
  });

  test('ダイアログブロックに型バッジが表示される', async ({ page }) => {
    await setupWysiwygWithDsl(page, () => {
      var rte = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
      if (rte) rte._insertDialogBlock({ speaker: 'ナオミ' });
    });

    const dialog = page.locator('#wysiwyg-editor .zw-dialog');
    await expect(dialog).toBeAttached({ timeout: 3000 });

    const badgeContent = await dialog.evaluate(el => {
      return window.getComputedStyle(el, '::before').content;
    });
    expect(badgeContent).toContain('ダイアログ');

    // absolute 配置されたバッジ
    const position = await dialog.evaluate(el => {
      return window.getComputedStyle(el, '::before').position;
    });
    expect(position).toBe('absolute');
  });

  test('スクロールブロックがWYSIWYG内で可視状態', async ({ page }) => {
    await setupWysiwygWithDsl(page, () => {
      var rte = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
      if (rte) rte._insertScrollBlock({ effect: 'fade-in' });
    });

    const scroll = page.locator('#wysiwyg-editor .zw-scroll');
    await expect(scroll).toBeAttached({ timeout: 3000 });

    // opacity が 1 (本来は 0 だが WYSIWYG では上書き)
    const opacity = await scroll.evaluate(el => {
      return window.getComputedStyle(el).opacity;
    });
    expect(opacity).toBe('1');

    // transform が none
    const transform = await scroll.evaluate(el => {
      return window.getComputedStyle(el).transform;
    });
    expect(transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true);
  });

  test('スクロールブロックに型バッジ + エフェクト名が表示される', async ({ page }) => {
    await setupWysiwygWithDsl(page, () => {
      var rte = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
      if (rte) rte._insertScrollBlock({ effect: 'slide-up' });
    });

    const scroll = page.locator('#wysiwyg-editor .zw-scroll');
    await expect(scroll).toBeAttached({ timeout: 3000 });

    const badgeContent = await scroll.evaluate(el => {
      return window.getComputedStyle(el, '::before').content;
    });
    expect(badgeContent).toContain('スクロール');
    expect(badgeContent).toContain('slide-up');
  });

  test('スクロールブロックが editor-preview でも可視状態', async ({ page }) => {
    await page.fill('#editor', ':::zw-scroll{effect:"fade-in"}\nフェードイン要素\n:::');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-toolbar-mode', 'full');
    });
    await page.click('#toggle-preview');
    await page.waitForTimeout(500);

    const scroll = page.locator('#editor-preview .zw-scroll');
    await expect(scroll).toBeAttached({ timeout: 5000 });

    const opacity = await scroll.evaluate(el => {
      return window.getComputedStyle(el).opacity;
    });
    expect(opacity).toBe('1');
  });

  test('スクロールブロックの zw-scroll クラス統一 (ラウンドトリップ)', async ({ page }) => {
    // Markdown → WYSIWYG → Markdown の往復で scroll ブロックが保持される
    await page.fill('#editor', ':::zw-scroll{effect:"slide-up"}\nスライドアップ\n:::');
    await page.locator('#toggle-wysiwyg').dispatchEvent('mousedown');
    await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(500);

    // WYSIWYG 内に .zw-scroll 要素が存在
    const hasScroll = await page.evaluate(() => {
      var ed = document.getElementById('wysiwyg-editor');
      return ed ? !!ed.querySelector('.zw-scroll') : false;
    });
    expect(hasScroll).toBe(true);

    // Markdown に戻す
    await page.locator('#toggle-wysiwyg').dispatchEvent('mousedown');
    await page.waitForSelector('#editor', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(500);

    const markdown = await page.evaluate(() => {
      var editor = document.getElementById('editor');
      return editor ? editor.value : '';
    });

    // DSL ブロックが保持されている
    expect(markdown).toContain('zw-scroll');
  });
});
