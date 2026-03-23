// @ts-nocheck
/**
 * DSL挿入GUI E2Eテスト
 * Q1決定: 全DSL型 (typing/dialog/scroll/pathtext) にツールバー挿入UIを提供
 */
const { test, expect } = require('@playwright/test');

test.describe('DSL挿入GUI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-toolbar-mode', 'full');
    });
    // テキストを入れてからWYSIWYGに切り替え
    await page.fill('#editor', 'テスト本文');
    await page.locator('#toggle-wysiwyg').dispatchEvent('mousedown');
    await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });
  });

  test('RichTextEditor に4種のDSL挿入メソッドが存在する', async ({ page }) => {
    const methods = await page.evaluate(() => {
      var rte = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
      if (!rte) return [];
      var result = [];
      if (typeof rte._insertTypingBlock === 'function') result.push('typing');
      if (typeof rte._insertDialogBlock === 'function') result.push('dialog');
      if (typeof rte._insertScrollBlock === 'function') result.push('scroll');
      if (typeof rte._insertPathtextBlock === 'function') result.push('pathtext');
      return result;
    });

    expect(methods).toHaveLength(4);
    expect(methods).toContain('typing');
    expect(methods).toContain('dialog');
    expect(methods).toContain('scroll');
    expect(methods).toContain('pathtext');
  });

  test('タイピング演出ブロックが挿入される', async ({ page }) => {
    const hasTyping = await page.evaluate(() => {
      var rte = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
      if (!rte || typeof rte._insertTypingBlock !== 'function') return false;
      rte._insertTypingBlock();
      var ed = document.getElementById('wysiwyg-editor');
      return ed ? !!ed.querySelector('.zw-typing') : false;
    });
    expect(hasTyping).toBe(true);
  });

  test('ダイアログブロックが挿入される', async ({ page }) => {
    const hasDialog = await page.evaluate(() => {
      var rte = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
      if (!rte || typeof rte._insertDialogBlock !== 'function') return false;
      rte._insertDialogBlock();
      var ed = document.getElementById('wysiwyg-editor');
      return ed ? !!ed.querySelector('.zw-dialog') : false;
    });
    expect(hasDialog).toBe(true);
  });

  test('スクロール演出ブロックが挿入される', async ({ page }) => {
    const result = await page.evaluate(() => {
      var rte = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
      if (!rte || typeof rte._insertScrollBlock !== 'function') return null;
      rte._insertScrollBlock();
      var ed = document.getElementById('wysiwyg-editor');
      if (!ed) return null;
      var el = ed.querySelector('.zw-scroll');
      return el ? {
        effect: el.getAttribute('data-effect'),
        threshold: el.getAttribute('data-threshold')
      } : null;
    });
    expect(result).not.toBeNull();
    expect(result.effect).toBe('fade-in');
    expect(result.threshold).toBe('0.2');
  });

  test('パステキストブロックが挿入される', async ({ page }) => {
    const result = await page.evaluate(() => {
      var rte = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
      if (!rte || typeof rte._insertPathtextBlock !== 'function') return null;
      rte._insertPathtextBlock();
      var ed = document.getElementById('wysiwyg-editor');
      if (!ed) return null;
      var wrapper = ed.querySelector('.zw-pathtext-wrapper');
      var svg = wrapper ? wrapper.querySelector('svg') : null;
      return {
        hasWrapper: !!wrapper,
        hasSvg: !!svg,
        hasTextPath: svg ? !!svg.querySelector('textPath') : false
      };
    });
    expect(result).not.toBeNull();
    expect(result.hasWrapper).toBe(true);
    expect(result.hasSvg).toBe(true);
    expect(result.hasTextPath).toBe(true);
  });

  test('_showDslModal が属性設定モーダルを表示する', async ({ page }) => {
    // モーダルを表示
    await page.evaluate(() => {
      var rte = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
      if (!rte) return;
      rte._showDslModal('typing', function () {});
    });
    await page.waitForTimeout(200);

    // モーダルが表示されている
    const modal = await page.evaluate(() => {
      var overlay = document.getElementById('dsl-attr-modal');
      if (!overlay) return null;
      var title = overlay.querySelector('.dsl-attr-modal__title');
      var rows = overlay.querySelectorAll('.dsl-attr-modal__row');
      var confirm = overlay.querySelector('.dsl-attr-modal__confirm');
      var cancel = overlay.querySelector('.dsl-attr-modal__cancel');
      return {
        title: title ? title.textContent : '',
        fieldCount: rows.length,
        hasConfirm: !!confirm,
        hasCancel: !!cancel
      };
    });

    expect(modal).not.toBeNull();
    expect(modal.title).toContain('タイピング演出');
    expect(modal.fieldCount).toBe(2); // speed, mode
    expect(modal.hasConfirm).toBe(true);
    expect(modal.hasCancel).toBe(true);
  });

  test('モーダルで属性を設定してタイピングブロックを挿入できる', async ({ page }) => {
    const result = await page.evaluate(() => {
      return new Promise(function (resolve) {
        var rte = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
        if (!rte) { resolve(null); return; }

        rte._showDslModal('typing', function (attrs) {
          rte._insertTypingBlock(attrs);
          var ed = document.getElementById('wysiwyg-editor');
          var el = ed ? ed.querySelector('.zw-typing') : null;
          resolve(el ? {
            speed: el.getAttribute('data-speed'),
            mode: el.getAttribute('data-mode')
          } : null);
        });

        // 速度を80msに変更してから確定
        setTimeout(function () {
          var overlay = document.getElementById('dsl-attr-modal');
          if (!overlay) { resolve(null); return; }
          var selects = overlay.querySelectorAll('select');
          if (selects[0]) selects[0].value = '80ms';  // speed
          if (selects[1]) selects[1].value = 'click';  // mode
          var confirmBtn = overlay.querySelector('.dsl-attr-modal__confirm');
          if (confirmBtn) confirmBtn.click();
        }, 100);
      });
    });

    expect(result).not.toBeNull();
    expect(result.speed).toBe('80ms');
    expect(result.mode).toBe('click');
  });
});
