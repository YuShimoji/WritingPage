/**
 * P2 段落揃え: RichTextCommandAdapter の data-zw-align と Turndown 往復（最小）
 */
const { test, expect } = require('@playwright/test');
const { ensureNormalMode } = require('./helpers');

test.describe('Rich text block align (P2)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await ensureNormalMode(page);
    await page.locator('#toggle-wysiwyg').dispatchEvent('mousedown');
    await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });
  });

  test('aligncenter / alignstart がカーソルブロックに data-zw-align を付与・除去する', async ({ page }) => {
    const r = await page.evaluate(() => {
      var wys = document.getElementById('wysiwyg-editor');
      var rte = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
      if (!wys || !rte || !rte.commandAdapter) return null;
      wys.innerHTML = '<p>AlignProbeText</p>';
      wys.focus();
      var p = wys.querySelector('p');
      var rge = document.createRange();
      rge.setStart(p.firstChild, 3);
      rge.collapse(true);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(rge);
      var okCenter = rte.commandAdapter.execute('aligncenter');
      var hasCenter = p.getAttribute('data-zw-align') === 'center';
      var okStart = rte.commandAdapter.execute('alignstart');
      var noAttr = !p.hasAttribute('data-zw-align');
      return { okCenter, hasCenter, okStart, noAttr };
    });
    expect(r).toBeTruthy();
    expect(r.okCenter).toBe(true);
    expect(r.hasCenter).toBe(true);
    expect(r.okStart).toBe(true);
    expect(r.noAttr).toBe(true);
  });

  test('sanitizeHtml が paste 用に data-zw-align を保持する', async ({ page }) => {
    const out = await page.evaluate(() => {
      var rte = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
      if (!rte || !rte.commandAdapter) return '';
      var raw = '<p data-zw-align="end" onclick="alert(1)">Z</p>';
      return rte.commandAdapter.sanitizeHtml(raw);
    });
    expect(out.indexOf('data-zw-align="end"')).not.toBe(-1);
    expect(out.indexOf('onclick')).toBe(-1);
  });

  test('WYSIWYG の「その他」メニューから段落中央揃えが実行できる', async ({ page }) => {
    const ok = await page.evaluate(() => {
      var wys = document.getElementById('wysiwyg-editor');
      if (!wys) return false;
      wys.innerHTML = '<p>MenuAlignProbe</p>';
      wys.focus();
      var p = wys.querySelector('p');
      var rge = document.createRange();
      rge.setStart(p.firstChild, 1);
      rge.collapse(true);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(rge);
      var alignBtn = document.querySelector('[data-overflow="align-center"]');
      if (!alignBtn) return false;
      alignBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      p = document.querySelector('#wysiwyg-editor p');
      return p && p.getAttribute('data-zw-align') === 'center';
    });
    expect(ok).toBe(true);
  });

  test('Turndown が data-zw-align 付きブロックを HTML 断片として保持する', async ({ page }) => {
    const md = await page.evaluate(() => {
      var rte = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
      if (!rte || !rte.turndownService) return null;
      return rte.turndownService.turndown('<p data-zw-align="center">LineProbe</p>');
    });
    expect(md).toBeTruthy();
    expect(md.indexOf('data-zw-align="center"')).not.toBe(-1);
    expect(md.indexOf('LineProbe')).not.toBe(-1);
  });

  test('Ctrl+Shift+Alt+D（macOS は Meta+Shift+Alt+D）で effectPersistDecorAcrossNewline がトグルされる', async ({ page }) => {
    await page.locator('#wysiwyg-editor').click();
    var mod = process.platform === 'darwin' ? 'Meta' : 'Control';
    var before = await page.evaluate(() => {
      var s = window.ZenWriterStorage.loadSettings();
      return !!(s.editor && s.editor.effectPersistDecorAcrossNewline === true);
    });
    await page.keyboard.press(mod + '+Shift+Alt+KeyD');
    var after = await page.evaluate(() => {
      var s = window.ZenWriterStorage.loadSettings();
      return !!(s.editor && s.editor.effectPersistDecorAcrossNewline === true);
    });
    expect(after).toBe(!before);
    await page.keyboard.press(mod + '+Shift+Alt+KeyD');
    var restored = await page.evaluate(() => {
      var s = window.ZenWriterStorage.loadSettings();
      return !!(s.editor && s.editor.effectPersistDecorAcrossNewline === true);
    });
    expect(restored).toBe(before);
  });
});
