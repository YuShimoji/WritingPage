const { test, expect } = require('@playwright/test');
const { ensureNormalMode } = require('./helpers');

async function openCommandPalette(page) {
  await page.evaluate(() => {
    if (window.commandPalette && typeof window.commandPalette.show === 'function') {
      window.commandPalette.show();
    }
  });
}

async function updateEditorContent(page, markdown) {
  await page.evaluate((value) => {
    if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function') {
      window.ZenWriterEditor.setContent(value);
      return;
    }
    const editor = document.getElementById('editor');
    if (editor) {
      editor.value = value;
      editor.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        inputType: 'insertText',
        data: value.slice(-1)
      }));
    }
  }, markdown);
}

test.describe('WP-005 Slice B: MD preview rich-preview activation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForSelector('#editor', { state: 'attached', timeout: 10000 });
    await ensureNormalMode(page);
  });

  test('command palette opens editor-adjacent MD preview and refreshes typing/scroll controllers after content updates', async ({ page }) => {
    await updateEditorContent(page, [
      '## Slice B initial heading',
      '',
      ':::zw-typing{speed:"30ms", mode:"auto"}',
      'Slice B typing initial',
      ':::',
      '',
      ':::zw-scroll{effect:"fade-in", threshold:"0"}',
      'Slice B scroll initial',
      ':::'
    ].join('\n'));

    await openCommandPalette(page);
    const previewCommand = page.locator('.command-palette-item[data-command-id="toggle-markdown-preview"]');
    await expect(previewCommand).toBeVisible();
    await previewCommand.click();

    const previewPanel = page.locator('#editor-preview');
    const previewBody = page.locator('#markdown-preview-panel');
    await expect(previewPanel).not.toHaveClass(/editor-preview--collapsed/);
    await expect(previewBody.locator('h2')).toContainText('Slice B initial heading');

    const placement = await page.evaluate(() => {
      const preview = document.getElementById('editor-preview');
      const previewBox = preview ? preview.getBoundingClientRect() : null;
      const style = preview ? window.getComputedStyle(preview) : null;
      return {
        previewLeft: previewBox ? previewBox.left : 0,
        previewWidth: previewBox ? previewBox.width : 0,
        display: style ? style.display : ''
      };
    });
    expect(placement.display).not.toBe('none');
    expect(placement.previewWidth).toBeGreaterThan(0);
    expect(placement.previewLeft).toBeGreaterThanOrEqual(0);

    const typing = previewBody.locator('.zw-typing').first();
    await expect(typing).toBeAttached();
    await expect(typing).toHaveAttribute('data-typing-activated', 'true');

    const scroll = previewBody.locator('.zw-scroll').first();
    await expect(scroll).toBeAttached();
    await expect(scroll).toHaveAttribute('data-scroll-activated', 'true');

    await expect(page.locator('html')).not.toHaveAttribute('data-reader-overlay-open', 'true');
    await expect(page.locator('#reader-preview')).not.toBeVisible();
    await expect(page.locator('#split-view-container')).toBeHidden();

    await updateEditorContent(page, [
      '## Slice B updated heading',
      '',
      ':::zw-typing{speed:"30ms", mode:"auto"}',
      'Slice B typing updated',
      ':::',
      '',
      ':::zw-scroll{effect:"slide-up", threshold:"0"}',
      'Slice B scroll updated',
      ':::'
    ].join('\n'));

    await expect(previewBody.locator('h2')).toContainText('Slice B updated heading');
    await expect(previewBody).toContainText('Slice B typing updated');
    await expect(previewBody).not.toContainText('Slice B typing initial');
    await expect(previewBody.locator('.zw-typing').first()).toHaveAttribute('data-typing-activated', 'true');
    await expect(previewBody.locator('.zw-scroll').first()).toHaveAttribute('data-scroll-activated', 'true');
    await expect(page.locator('html')).not.toHaveAttribute('data-reader-overlay-open', 'true');
    await expect(page.locator('#split-view-container')).toBeHidden();
  });
});
