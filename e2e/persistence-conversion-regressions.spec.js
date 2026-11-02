const { test, expect } = require('@playwright/test');
const { ensureNormalMode } = require('./helpers');

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await ensureNormalMode(page);
  await expect(page.locator('#wysiwyg-editor')).toBeVisible();
});

async function save(page) {
  await page.keyboard.press('F2');
  await page.locator('#command-palette-input').fill('保存');
  await page.locator('.command-palette-item[data-command-id="save"]').click();
  await expect(page.locator('#writing-status-chip')).toHaveAttribute('data-save-state', 'saved');
}

test('empty heading boundaries and the empty final chapter survive Rich save and reload', async ({ page }) => {
  const expected = '## Body\n\nseed\n\n## \n\nalpha\n\n## \n\n## ';
  await page.evaluate(() => {
    const rich = document.getElementById('wysiwyg-editor');
    rich.innerHTML = '<h2>Body</h2><p>seed</p><h2></h2><p>alpha</p><h2></h2><h2></h2>';
    rich.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('#editor')).toHaveValue(expected);
  await save(page);
  await page.reload();
  await expect(page.locator('#editor')).toHaveValue(expected);
  await expect(page.locator('#wysiwyg-editor h2')).toHaveText(['Body', '', '', '']);
  await expect(page.locator('#wysiwyg-editor p')).toHaveText(['seed', 'alpha']);
});

test('eleven aligned paragraphs keep distinct bodies in visible preview and Reader after reload', async ({ page }) => {
  const bodies = Array.from({ length: 11 }, (_, i) => 'Distinct' + i);
  await page.evaluate((texts) => {
    const editor = window.ZenWriterEditor;
    editor.setContent(texts.map(text => '<p data-zw-align="center">' + text + '</p>').join('\n\n'));
  }, bodies);
  await save(page);
  await page.reload();
  await expect(page.locator('#wysiwyg-editor [data-zw-align="center"]')).toHaveText(bodies);
  await page.evaluate(() => window.ZenWriterEditor.togglePreview());
  const preview = page.locator('#markdown-preview-panel [data-zw-align="center"]');
  await expect(preview.first()).toBeVisible();
  await expect(preview).toHaveText(bodies);
  await page.evaluate(() => window.ZWReaderPreview.enter());
  const reader = page.locator('#reader-preview-inner .reader-preview__content [data-zw-align="center"]');
  await expect(reader.first()).toBeVisible();
  await expect(reader).toHaveText(bodies);
});
