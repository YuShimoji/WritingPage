const { platform } = require('node:os');
const { test, expect } = require('@playwright/test');
const { ensureNormalMode } = require('./helpers');
const undo = platform() === 'darwin' ? 'Meta+z' : 'Control+z';
const redo = platform() === 'darwin' ? 'Meta+Shift+KeyZ' : 'Control+y';

test.describe('Paragraph and canonical save fidelity', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await ensureNormalMode(page);
    await page.waitForFunction(() => window.ZenWriterEditor?.richTextEditor?.__richTextEnhancedInstalled);
    await expect(page.locator('#wysiwyg-editor')).toBeVisible();
  });

  for (const selected of [false, true]) {
    test(`direct root text aligns with ${selected ? 'selection' : 'caret'}, one Undo and continued typing`, async ({ page }) => {
      const editor = page.locator('#wysiwyg-editor');
      await page.evaluate(() => {
        const rich = window.ZenWriterEditor.richTextEditor;
        window.ZenWriterEditor.setContent('');
        rich.resetUndoStack();
        rich.wysiwygEditor.focus();
        const range = document.createRange();
        range.selectNodeContents(rich.wysiwygEditor);
        range.collapse(false);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      });
      await page.keyboard.insertText('直接入力 Root');
      await expect(editor.locator('p')).toHaveCount(0);
      expect(await editor.evaluate(node => node.textContent)).toBe('直接入力 Root');
      if (selected) await page.keyboard.press('Shift+Home');
      const beforeSelection = await page.evaluate(() => window.getSelection().toString());
      await page.locator('[data-overflow="align-center"]').dispatchEvent('mousedown');
      await expect(editor.locator('p')).toHaveAttribute('data-zw-align', 'center');
      await expect(editor.locator('p')).toHaveCSS('text-align', 'center');
      expect(await editor.evaluate(node => node.textContent)).toBe('直接入力 Root');
      expect(await page.evaluate(() => window.getSelection().toString())).toBe(beforeSelection);
      await page.keyboard.press(undo);
      await expect(editor.locator('p')).toHaveCount(0);
      expect(await editor.evaluate(node => node.textContent)).toBe('直接入力 Root');
      await page.keyboard.press(redo);
      await expect(editor.locator('p')).toHaveAttribute('data-zw-align', 'center');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.insertText(' 続き');
      expect(await editor.evaluate(node => node.textContent)).toBe('直接入力 Root 続き');
      await page.evaluate(() => window.ZenWriterEditor.saveContent());
      const canonical = await page.locator('#editor').inputValue();
      await page.reload();
      await expect(editor.locator('p')).toHaveAttribute('data-zw-align', 'center');
      expect(await editor.locator('p').evaluate(node => node.textContent)).toBe('直接入力 Root 続き');
      expect(await page.locator('#editor').inputValue()).toBe(canonical);
    });
  }

  test('alignment across existing heading and paragraph preserves their structure and canonical bytes', async ({ page }) => {
    await page.evaluate(() => {
      window.ZenWriterEditor.setContent('# Keep heading\n\nKeep paragraph');
      const rich = window.ZenWriterEditor.richTextEditor;
      rich.resetUndoStack();
      rich.wysiwygEditor.focus();
      const range = document.createRange();
      range.selectNodeContents(rich.wysiwygEditor);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    });
    const editor = page.locator('#wysiwyg-editor');
    const before = await editor.innerHTML();
    const canonical = await page.locator('#editor').inputValue();
    await page.locator('[data-overflow="align-center"]').dispatchEvent('mousedown');
    expect(await editor.innerHTML()).toBe(before);
    await expect(editor.locator('h1')).toHaveText('Keep heading');
    await expect(editor.locator('p')).toHaveText('Keep paragraph');
    expect(await page.locator('#editor').inputValue()).toBe(canonical);
    // Unsupported block types keep their former no-op boundary as well.
    for (const source of ['#### Keep level four', '~~~text\nKeep code\n~~~']) {
      await page.evaluate(content => {
        window.ZenWriterEditor.setContent(content);
        const rich = window.ZenWriterEditor.richTextEditor;
        rich.wysiwygEditor.focus();
        const range = document.createRange();
        range.selectNodeContents(rich.wysiwygEditor.querySelector('h4, pre'));
        range.collapse(false);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }, source);
      const blockHtml = await editor.innerHTML();
      const blockCanonical = await page.locator('#editor').inputValue();
      await page.locator('[data-overflow="align-center"]').dispatchEvent('mousedown');
      expect(await editor.innerHTML()).toBe(blockHtml);
      expect(await page.locator('#editor').inputValue()).toBe(blockCanonical);
    }
  });

  for (const breaks of [1, 2]) {
  test(`aligned ${breaks} explicit line breaks and formatting have no added outer LF and stable saved bytes`, async ({ page }, testInfo) => {
    const editor = page.locator('#wysiwyg-editor');
    const initial = '<p data-zw-align="center">First' + '\n'.repeat(breaks) + 'Second **bold**</p>';
    const expectedText = 'First' + '\n'.repeat(breaks) + 'Second bold';
    await page.evaluate(source => window.ZenWriterEditor.setContent(source), initial);
    const before = await page.evaluate(() => ({ html:window.richTextEditor.wysiwygEditor.innerHTML, text:window.richTextEditor.wysiwygEditor.textContent, canonical:document.getElementById('editor').value }));
    await testInfo.attach('synthetic-before.json', {body:JSON.stringify(before), contentType:'application/json'});
    expect(before.text).toBe(expectedText);
    await expect(editor.locator('p br')).toHaveCount(breaks);
    await expect(editor.locator('strong')).toHaveText('bold');
    await page.evaluate(() => window.ZenWriterEditor.saveContent());
    const canonical = await page.locator('#editor').inputValue();
    for (let iteration = 0; iteration < 3; iteration++) {
      await page.reload();
      await expect(editor).toBeVisible();
      expect(await editor.evaluate(node => node.textContent)).toBe(expectedText);
      await expect(editor.locator('p br')).toHaveCount(breaks);
      await expect(editor.locator('p')).toHaveCSS('text-align', 'center');
      await expect(editor.locator('strong')).toHaveText('bold');
      expect(await page.locator('#editor').inputValue()).toBe(canonical);
      await page.evaluate(() => window.ZenWriterEditor.saveContent());
      expect(await page.locator('#editor').inputValue()).toBe(canonical);
    }
  });
  }
});
