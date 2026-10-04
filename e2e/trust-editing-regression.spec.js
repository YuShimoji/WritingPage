const { platform } = require('node:os');
const { test, expect } = require('@playwright/test');
const { ensureNormalMode } = require('./helpers');

const undoShortcut = platform() === 'darwin' ? 'Meta+z' : 'Control+z';
const redoShortcut = platform() === 'darwin' ? 'Meta+Shift+KeyZ' : 'Control+y';

async function setRichContent(page, markdown) {
  await page.evaluate((content) => {
    const editor = window.ZenWriterEditor;
    editor.setContent(content);
    const rich = editor.richTextEditor;
    rich.resetUndoStack();
    rich.wysiwygEditor.focus();
    const range = document.createRange();
    range.selectNodeContents(rich.wysiwygEditor.querySelector('p') || rich.wysiwygEditor);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }, markdown);
}

async function alignCenter(page) {
  // The overflow handler preserves the editor selection on mousedown.
  await page.locator('[data-overflow="align-center"]').dispatchEvent('mousedown');
}

test.describe('Rich editing trust regressions', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await ensureNormalMode(page);
    await page.waitForFunction(() => {
      const rich = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
      return rich && rich.isWysiwygMode && rich.__richTextEnhancedInstalled;
    });
    await expect(page.locator('#wysiwyg-editor')).toBeVisible();
  });

  test('aligned bold text survives save and repeated reload without literal Markdown', async ({ page }) => {
    const paragraph = page.locator('#wysiwyg-editor p');
    await setRichContent(page, '**AuditBold**');
    await expect(paragraph.locator('strong')).toHaveText('AuditBold');
    await alignCenter(page);
    await expect(paragraph).toHaveCSS('text-align', 'center');

    for (let reload = 0; reload < 2; reload += 1) {
      await page.evaluate(() => window.ZenWriterEditor.saveContent());
      await page.reload();
      await expect(page.locator('#wysiwyg-editor')).toBeVisible();
      await expect(paragraph).toHaveText('AuditBold');
      await expect(paragraph).toHaveCSS('text-align', 'center');
      await expect(paragraph.locator('strong')).toHaveText('AuditBold');
    }
  });

  test('the first alignment change can be undone and redone without changing its text', async ({ page }) => {
    const paragraph = page.locator('#wysiwyg-editor p');
    await setRichContent(page, 'UndoAlignProbe');
    await expect(paragraph).not.toHaveAttribute('data-zw-align');
    await alignCenter(page);
    await expect(paragraph).toHaveCSS('text-align', 'center');
    await expect(paragraph).toHaveText('UndoAlignProbe');

    await page.keyboard.press(undoShortcut);
    await expect(paragraph).not.toHaveAttribute('data-zw-align');
    await expect(paragraph).toHaveText('UndoAlignProbe');
    await page.keyboard.press(redoShortcut);
    await expect(paragraph).toHaveCSS('text-align', 'center');
    await expect(paragraph).toHaveText('UndoAlignProbe');
  });

  test('immediate first-input Undo works before debounce and Redo restores the input', async ({ page }) => {
    const editor = page.locator('#wysiwyg-editor');
    await setRichContent(page, '');
    await expect(editor).toHaveText('');
    await page.evaluate(() => {
      const rich = document.getElementById('wysiwyg-editor');
      window.__trustImmediateUndo = {};
      rich.addEventListener('input', () => {
        window.__trustImmediateUndo.inputAt = performance.now();
      }, { once: true });
      rich.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
          window.__trustImmediateUndo.beforeUndo = rich.textContent;
          window.__trustImmediateUndo.elapsed = performance.now() - window.__trustImmediateUndo.inputAt;
        }
      }, { capture: true });
    });
    await page.keyboard.insertText('ImmediateUndoProbe');
    await page.keyboard.press(undoShortcut);
    const timing = await page.evaluate(() => window.__trustImmediateUndo);
    expect(timing.beforeUndo).toBe('ImmediateUndoProbe');
    expect(timing.elapsed).toBeLessThan(500);
    await expect(editor).toHaveText('');
    await page.keyboard.press(redoShortcut);
    await expect(editor).toHaveText('ImmediateUndoProbe');
  });

  test('typing and alignment remain separate Undo steps and new typing replaces the Redo branch', async ({ page }) => {
    const paragraph = page.locator('#wysiwyg-editor p');
    await setRichContent(page, 'Seed');
    await page.keyboard.insertText('Before');
    await alignCenter(page);
    await page.keyboard.insertText('After');
    await expect(paragraph).toHaveText('SeedBeforeAfter');
    await expect(paragraph).toHaveCSS('text-align', 'center');

    await page.keyboard.press(undoShortcut);
    await expect(paragraph).toHaveText('SeedBefore');
    await expect(paragraph).toHaveAttribute('data-zw-align', 'center');
    await page.keyboard.press(undoShortcut);
    await expect(paragraph).toHaveText('SeedBefore');
    await expect(paragraph).not.toHaveAttribute('data-zw-align');
    await page.keyboard.press(undoShortcut);
    await expect(paragraph).toHaveText('Seed');

    await page.keyboard.press(redoShortcut);
    await expect(paragraph).toHaveText('SeedBefore');
    await expect(paragraph).not.toHaveAttribute('data-zw-align');
    await page.keyboard.press(redoShortcut);
    await expect(paragraph).toHaveText('SeedBefore');
    await expect(paragraph).toHaveAttribute('data-zw-align', 'center');
    await page.keyboard.press(redoShortcut);
    await expect(paragraph).toHaveText('SeedBeforeAfter');

    await page.keyboard.press(undoShortcut);
    await page.keyboard.insertText('Replacement');
    await page.keyboard.press(redoShortcut);
    await expect(paragraph).toHaveText('SeedBeforeReplacement');
    await expect(paragraph).toHaveAttribute('data-zw-align', 'center');
  });

  test('new input after Undo cannot be overwritten by immediate Redo', async ({ page }) => {
    const editor = page.locator('#wysiwyg-editor');
    await setRichContent(page, '');
    await page.keyboard.insertText('OldInput');
    await page.waitForTimeout(650);
    await page.keyboard.press(undoShortcut);
    await expect(editor).toHaveText('');
    await page.evaluate(() => {
      const rich = document.getElementById('wysiwyg-editor');
      window.__trustImmediateRedo = {};
      rich.addEventListener('input', () => {
        window.__trustImmediateRedo.inputAt = performance.now();
      }, { once: true });
      rich.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();
        if ((event.ctrlKey || event.metaKey) && (key === 'y' || (event.shiftKey && key === 'z'))) {
          window.__trustImmediateRedo.beforeRedo = rich.textContent;
          window.__trustImmediateRedo.elapsed = performance.now() - window.__trustImmediateRedo.inputAt;
        }
      }, { capture: true });
    });
    await page.keyboard.insertText('NewInput');
    await page.keyboard.press(redoShortcut);
    const timing = await page.evaluate(() => window.__trustImmediateRedo);
    expect(timing.beforeRedo).toBe('NewInput');
    expect(timing.elapsed).toBeLessThan(500);
    await expect(editor).toHaveText('NewInput');
  });

  test('Undo of the first alignment restores the caret at the original paragraph end', async ({ page }) => {
    const paragraph = page.locator('#wysiwyg-editor p');
    await setRichContent(page, 'CaretAlignProbe');
    await alignCenter(page);
    await expect(paragraph).toHaveAttribute('data-zw-align', 'center');
    await page.keyboard.press(undoShortcut);
    await expect(paragraph).not.toHaveAttribute('data-zw-align');
    await page.keyboard.insertText('X');
    await expect(paragraph).toHaveText('CaretAlignProbeX');
  });
});
