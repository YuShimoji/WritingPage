const { test, expect } = require('@playwright/test');
const { ensureNormalMode } = require('./helpers');
const health = new WeakMap();

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  const log = { pageErrors: [], consoleErrors: [], warnings: [] };
  health.set(page, log);
  page.on('pageerror', error => log.pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') log.consoleErrors.push(message.text());
    if (message.type() === 'warning') log.warnings.push(message.text());
  });
  await page.goto('/index.html');
  await ensureNormalMode(page);
  await expect(page).toHaveTitle(/Zen Writer/);
  await expect(page.locator('#wysiwyg-editor')).toBeVisible();
  await page.locator('#wysiwyg-editor').click();
  // Widen the real pending-input interval so CI speed cannot commit the batch
  // between the keystrokes under test. History methods remain unmodified.
  await page.evaluate(() => {
    const rich = window.ZenWriterEditor.richTextEditor;
    rich._undoBatchTimeout = 60000;
    rich.resetUndoStack();
  });
});

test.afterEach(async ({ page }, testInfo) => {
  const log = health.get(page);
  await testInfo.attach('browser-health.json', { body: JSON.stringify(log), contentType: 'application/json' });
  expect(log.pageErrors).toEqual([]);
  expect(log.consoleErrors).toEqual([]);
  expect(log.warnings).toEqual([]);
});

async function observe(page, testInfo, phase) {
  const state = await page.evaluate(() => {
    const rich = window.ZenWriterEditor.richTextEditor;
    return {
      html: rich.wysiwygEditor.innerHTML,
      markdown: document.getElementById('editor').value,
      undoDepth: rich._undoStack.length,
      redoDepth: rich._redoStack.length,
      hasTimerHandle: rich._undoSnapshotTimer !== null,
    };
  });
  await testInfo.attach(phase + '.json', { body: JSON.stringify(state), contentType: 'application/json' });
  await page.screenshot({ path: testInfo.outputPath(phase + '.png') });
  return state;
}

async function saveAndReload(page, expected) {
  await page.keyboard.press('F2');
  await page.locator('#command-palette-input').fill('保存');
  await page.locator('.command-palette-item[data-command-id="save"]').click();
  await expect(page.locator('#writing-status-chip')).toHaveAttribute('data-save-state', 'saved');
  await page.reload();
  await expect(page.locator('#wysiwyg-editor')).toHaveText(expected);
  await expect(page.locator('#editor')).toHaveValue(expected);
}

test('Undo captures the first pending input before checking history', async ({ page }, testInfo) => {
  await page.keyboard.insertText('First pending input');
  const pending = await observe(page, testInfo, 'before-undo');
  expect(pending.undoDepth).toBe(0);
  await page.keyboard.press('ControlOrMeta+z');
  await observe(page, testInfo, 'after-undo');
  await expect(page.locator('#wysiwyg-editor')).toHaveText('');
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Shift+z' : 'Control+y');
  await expect(page.locator('#wysiwyg-editor')).toHaveText('First pending input');
  await saveAndReload(page, 'First pending input');
});

test('Redo preserves new pending input after Undo instead of restoring the old branch', async ({ page }, testInfo) => {
  await page.keyboard.insertText('Original branch');
  // Opening and dismissing the palette commits the original input through the
  // existing blur boundary, leaving one real edit for Undo to restore.
  await page.keyboard.press('F2');
  await page.keyboard.press('Escape');
  await page.keyboard.press('ControlOrMeta+z');
  await expect(page.locator('#wysiwyg-editor')).toHaveText('');
  await page.keyboard.insertText('New pending input');
  const pending = await observe(page, testInfo, 'before-redo');
  expect(pending.redoDepth).toBeGreaterThan(0);
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Shift+z' : 'Control+y');
  await observe(page, testInfo, 'after-redo');
  await expect(page.locator('#wysiwyg-editor')).toHaveText('New pending input');
  await saveAndReload(page, 'New pending input');
});
