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

  test('段落揃えが保存・再開後も MD プレビューと Reader に残る', async ({ page }) => {
    const token = 'AlignPersistProbe-20260625';

    const applied = await page.evaluate((probe) => {
      var editor = window.ZenWriterEditor;
      var rte = editor && editor.richTextEditor;
      var wys = document.getElementById('wysiwyg-editor');
      if (!editor || !rte || !wys) return null;
      if (!rte.isWysiwygMode && typeof rte.switchToWysiwyg === 'function') {
        rte.switchToWysiwyg();
      }
      if (typeof editor.setContent === 'function') {
        editor.setContent(probe);
      } else {
        wys.innerHTML = '<p>' + probe + '</p>';
      }
      wys.focus();
      var p = Array.from(wys.querySelectorAll('p')).find(function (node) {
        return (node.textContent || '').indexOf(probe) >= 0;
      });
      if (!p || !p.firstChild) return null;
      var range = document.createRange();
      range.setStart(p.firstChild, Math.min(2, p.firstChild.length));
      range.collapse(true);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      var alignBtn = document.querySelector('[data-overflow="align-end"]');
      if (!alignBtn) return null;
      alignBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      return {
        wysiwygAlign: p.getAttribute('data-zw-align'),
        markdown: document.getElementById('editor')?.value || '',
        stored: window.ZenWriterStorage && typeof window.ZenWriterStorage.loadContent === 'function'
          ? window.ZenWriterStorage.loadContent()
          : ''
      };
    }, token);

    expect(applied).toBeTruthy();
    expect(applied.wysiwygAlign).toBe('end');

    await page.waitForFunction((probe) => {
      var stored = window.ZenWriterStorage && typeof window.ZenWriterStorage.loadContent === 'function'
        ? window.ZenWriterStorage.loadContent()
        : '';
      return stored.indexOf(probe) >= 0 && stored.indexOf('data-zw-align="end"') >= 0;
    }, token);

    await page.evaluate(() => {
      if (window.ZenWriterEditor && typeof window.ZenWriterEditor.togglePreview === 'function') {
        window.ZenWriterEditor.togglePreview();
      }
    });
    await page.waitForSelector('#markdown-preview-panel [data-zw-align="end"]', { state: 'attached', timeout: 10000 });
    const mdAlign = await page.evaluate(() => {
      var el = document.querySelector('#markdown-preview-panel [data-zw-align="end"]');
      return el ? window.getComputedStyle(el).textAlign : null;
    });
    expect(mdAlign).toBe('right');

    await page.evaluate(() => {
      if (window.ZWReaderPreview && typeof window.ZWReaderPreview.enter === 'function') {
        window.ZWReaderPreview.enter();
      }
    });
    await page.waitForSelector('#reader-preview-inner .reader-preview__content [data-zw-align="end"]', { state: 'attached', timeout: 10000 });
    const readerAlign = await page.evaluate(() => {
      var el = document.querySelector('#reader-preview-inner .reader-preview__content [data-zw-align="end"]');
      return el ? window.getComputedStyle(el).textAlign : null;
    });
    expect(readerAlign).toBe('right');

    await page.reload({ waitUntil: 'networkidle' });
    await ensureNormalMode(page);
    await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });
    await page.waitForFunction((probe) => {
      return window.ZenWriterEditor &&
        typeof window.ZenWriterEditor.getEditorValue === 'function' &&
        window.ZenWriterEditor.getEditorValue().indexOf(probe) >= 0;
    }, token);

    const resumed = await page.evaluate((probe) => {
      var wys = document.getElementById('wysiwyg-editor');
      var p = wys && Array.from(wys.querySelectorAll('p')).find(function (node) {
        return (node.textContent || '').indexOf(probe) >= 0;
      });
      return {
        stored: window.ZenWriterStorage && typeof window.ZenWriterStorage.loadContent === 'function'
          ? window.ZenWriterStorage.loadContent()
          : '',
        wysiwygAlign: p ? p.getAttribute('data-zw-align') : null
      };
    }, token);
    expect(resumed.stored).toContain('data-zw-align="end"');
    expect(resumed.stored).toContain(token);
    expect(resumed.wysiwygAlign).toBe('end');
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
