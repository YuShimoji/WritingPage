const { platform } = require('node:os');
const { test, expect } = require('@playwright/test');
const { ensureNormalMode } = require('./helpers');

const undoShortcut = platform() === 'darwin' ? 'Meta+z' : 'Control+z';
const redoShortcut = platform() === 'darwin' ? 'Meta+Shift+KeyZ' : 'Control+y';

async function setRichContent(page, content) {
  await page.evaluate((text) => {
    const editor = window.ZenWriterEditor;
    editor.setContent(text);
    const rich = editor.richTextEditor;
    rich.resetUndoStack();
    rich.wysiwygEditor.focus();
    const range = document.createRange();
    range.selectNodeContents(rich.wysiwygEditor.querySelector('p'));
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }, content);
}

test.describe('Integrated Rich controls and editing trust', () => {
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

  test('keyboard toolbar bold has one formatting Undo and permits continued writing after Escape', async ({ page }) => {
    const editor = page.locator('#wysiwyg-editor');
    const toolbar = page.locator('#wysiwyg-toolbar');
    await setRichContent(page, 'Seed');
    await page.keyboard.insertText('Before');
    await page.keyboard.press('Shift+Home');
    await expect(toolbar).toHaveAttribute('data-visible', 'true');
    const selectedBefore = await page.evaluate(() => window.getSelection().toString());
    expect(selectedBefore).toBe('SeedBefore');

    await page.keyboard.press('Shift+Tab');
    expect(await page.evaluate(() => !!document.activeElement.closest('#wysiwyg-toolbar'))).toBe(true);
    expect(await page.evaluate(() => window.getSelection().toString())).toBe(selectedBefore);
    await page.locator('#wysiwyg-bold').focus();
    await page.keyboard.press('Enter');
    await expect(editor.locator('strong, b')).toHaveText(selectedBefore);
    expect(await page.evaluate(() => window.getSelection().toString())).toBe(selectedBefore);
    await expect(editor).toBeFocused();

    await page.keyboard.press(undoShortcut);
    await expect(editor).toHaveText('SeedBefore');
    await expect(editor.locator('strong, b')).toHaveCount(0);
    await page.keyboard.press(redoShortcut);
    await expect(editor).toHaveText('SeedBefore');
    await expect(editor.locator('strong, b')).toHaveText('SeedBefore');

    // Undo/Redo only promises the saved caret, not restoration of a full range.
    await page.keyboard.press('Home');
    await page.keyboard.press('Shift+End');
    await expect(toolbar).toHaveAttribute('data-visible', 'true');
    await page.keyboard.press('Shift+Tab');
    expect(await page.evaluate(() => !!document.activeElement.closest('#wysiwyg-toolbar'))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(toolbar).toHaveAttribute('data-visible', 'false');
    await expect(editor).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.insertText('After');
    await expect(editor).toHaveText('SeedBeforeAfter');
  });

  test('aligned typed URL and email linkify at conversion and survive reload with their text', async ({ page }) => {
    const editor = page.locator('#wysiwyg-editor');
    const paragraph = editor.locator('p');
    const sourceText = 'Alignment https://example.com writer@example.com';
    await setRichContent(page, 'Alignment');
    await page.keyboard.insertText(' https://example.com writer@example.com');
    await expect(editor.locator('a')).toHaveCount(0);
    await page.locator('[data-overflow="align-center"]').dispatchEvent('mousedown');
    await expect(paragraph).toHaveCSS('text-align', 'center');
    await expect(paragraph).toHaveText(sourceText);

    await page.evaluate(() => window.richTextEditor.switchToTextarea());
    await expect(page.locator('#editor')).toBeVisible();
    await page.evaluate(() => window.richTextEditor.switchToWysiwyg());

    for (let boundary = 0; boundary < 2; boundary += 1) {
      await expect(paragraph).toHaveText(sourceText);
      await expect(paragraph).toHaveCSS('text-align', 'center');
      await expect(paragraph.locator('a[href="https://example.com"]')).toHaveText('https://example.com');
      await expect(paragraph.locator('a[href="mailto:writer@example.com"]')).toHaveText('writer@example.com');
      const styles = await paragraph.locator('a').evaluateAll((links) => links.map((link) => ({
        target: link.getAttribute('target') || '',
        decoration: getComputedStyle(link).textDecorationLine,
        color: getComputedStyle(link).color,
        editorColor: getComputedStyle(document.getElementById('wysiwyg-editor')).color,
      })));
      expect(styles).toHaveLength(2);
      expect(styles.every((link) => link.target === '' && link.decoration.includes('underline') && link.color === link.editorColor)).toBe(true);
      if (boundary === 0) {
        await page.evaluate(() => window.ZenWriterEditor.saveContent());
        await page.reload();
        await expect(editor).toBeVisible();
      }
    }
  });

  test('queued native selectionchange keeps toolbar focus until Escape and continued writing', async ({ page }) => {
    const editor = page.locator('#wysiwyg-editor');
    const toolbar = page.locator('#wysiwyg-toolbar');
    await setRichContent(page, 'Native toolbar focus probe');
    await page.evaluate(() => {
      const editorNode = document.getElementById('wysiwyg-editor');
      const range = document.createRange();
      range.selectNodeContents(editorNode.querySelector('p'));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    });
    await expect(toolbar).toHaveAttribute('data-visible', 'true');

    const states = await page.evaluate(async () => {
      const button = document.getElementById('wysiwyg-bold');
      const toolbarNode = document.getElementById('wysiwyg-toolbar');
      const selection = window.getSelection();
      const range = selection.getRangeAt(0).cloneRange();
      const before = selection.toString();
      // DOM Selection queues its native event; focus changes in the same task.
      selection.removeAllRanges();
      selection.addRange(range);
      button.focus();
      const immediateActive = document.activeElement.id;
      await new Promise(resolve => setTimeout(resolve, 200));
      return {
        before,
        immediateActive,
        active: document.activeElement.id,
        visible: toolbarNode.getAttribute('data-visible'),
        selected: selection.toString(),
        saved: window.richTextEditor._floatingToolbarSelection.toString(),
      };
    });
    expect(states.immediateActive).toBe('wysiwyg-bold');
    expect(states.active).toBe('wysiwyg-bold');
    expect(states.visible).toBe('true');
    expect(states.selected).toBe(states.before);
    expect(states.saved).toBe(states.before);
    await page.keyboard.press('Escape');
    await expect(toolbar).toHaveAttribute('data-visible', 'false');
    await expect(editor).toBeFocused();
    expect(await page.evaluate(() => window.getSelection().toString())).toBe(states.before);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.insertText(' continued');
    await expect(editor).toHaveText('Native toolbar focus probe continued');
  });
});
