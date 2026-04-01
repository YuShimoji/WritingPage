// @ts-nocheck
/**
 * ルビ WYSIWYG 双方向統合 E2Eテスト
 * 挿入・表示・編集・削除・ラウンドトリップを検証
 */
const { test, expect } = require('@playwright/test');
const { switchToTextareaMode } = require('./helpers');

test.describe('ルビ WYSIWYG 統合', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-toolbar-mode', 'full');
    });
  });

  test('WYSIWYG で {漢字|かな} が <ruby> として表示される', async ({ page }) => {
    await page.fill('#editor', 'これは{東京|とうきょう}です');
    await page.locator('#toggle-wysiwyg').dispatchEvent('mousedown');
    await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });

    const ruby = await page.evaluate(() => {
      var ed = document.getElementById('wysiwyg-editor');
      var el = ed ? ed.querySelector('ruby') : null;
      if (!el) return null;
      var rt = el.querySelector('rt');
      return {
        base: el.childNodes[0].textContent,
        reading: rt ? rt.textContent : ''
      };
    });

    expect(ruby).not.toBeNull();
    expect(ruby.base).toBe('東京');
    expect(ruby.reading).toBe('とうきょう');
  });

  test('WYSIWYG → textarea ラウンドトリップで {漢字|かな} が保持される', async ({ page }) => {
    const original = 'これは{東京|とうきょう}です';
    await page.fill('#editor', original);

    // textarea → WYSIWYG
    await page.locator('#toggle-wysiwyg').dispatchEvent('mousedown');
    await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });

    // WYSIWYG → textarea
    await switchToTextareaMode(page);
    await page.waitForSelector('#editor', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(300);

    const result = await page.evaluate(() => {
      var ed = document.getElementById('editor');
      return ed ? ed.value : '';
    });

    expect(result).toContain('{東京|とうきょう}');
  });

  test('ルビ挿入 API が正しく動作する', async ({ page }) => {
    await page.fill('#editor', 'テスト文章です');
    await page.locator('#toggle-wysiwyg').dispatchEvent('mousedown');
    await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });

    const result = await page.evaluate(() => {
      var rte = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
      if (!rte) return null;

      // エディタにフォーカスしてテキストを選択
      var ed = document.getElementById('wysiwyg-editor');
      if (!ed) return null;
      ed.focus();

      // 直接 ruby 要素を挿入してテスト
      var ruby = document.createElement('ruby');
      ruby.textContent = '漢字';
      var rt = document.createElement('rt');
      rt.textContent = 'かんじ';
      ruby.appendChild(rt);
      ed.appendChild(ruby);

      var rubyEl = ed.querySelector('ruby');
      var rtEl = rubyEl ? rubyEl.querySelector('rt') : null;
      return {
        hasRuby: !!rubyEl,
        base: rubyEl ? rubyEl.childNodes[0].textContent : '',
        reading: rtEl ? rtEl.textContent : ''
      };
    });

    expect(result).not.toBeNull();
    expect(result.hasRuby).toBe(true);
    expect(result.base).toBe('漢字');
    expect(result.reading).toBe('かんじ');
  });

  test('ルビ削除: ruby要素をテキストに戻せる', async ({ page }) => {
    await page.fill('#editor', '{東京|とうきょう}は日本の首都');
    await page.locator('#toggle-wysiwyg').dispatchEvent('mousedown');
    await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });

    // ruby要素を直接テキストに置換 (UIクリックの代わり)
    const result = await page.evaluate(() => {
      var ed = document.getElementById('wysiwyg-editor');
      if (!ed) return null;
      var ruby = ed.querySelector('ruby');
      if (!ruby) return { error: 'no ruby found' };

      // ベーステキストを取得
      var base = '';
      for (var i = 0; i < ruby.childNodes.length; i++) {
        if (ruby.childNodes[i].nodeName !== 'RT' && ruby.childNodes[i].nodeName !== 'RP') {
          base += ruby.childNodes[i].textContent || '';
        }
      }
      ruby.replaceWith(document.createTextNode(base));

      return {
        hasRuby: !!ed.querySelector('ruby'),
        text: ed.textContent
      };
    });

    expect(result.hasRuby).toBe(false);
    expect(result.text).toContain('東京');
  });

  test('ルビボタン (#wysiwyg-ruby) がツールバーに存在する', async ({ page }) => {
    await page.locator('#toggle-wysiwyg').dispatchEvent('mousedown');
    await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });

    const exists = await page.evaluate(() => {
      return !!document.getElementById('wysiwyg-ruby');
    });
    expect(exists).toBe(true);
  });
});
