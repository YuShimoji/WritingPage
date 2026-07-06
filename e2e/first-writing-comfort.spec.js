// @ts-check
const { test, expect } = require('@playwright/test');
const { ensureNormalMode, openCommandPalette } = require('./helpers');

test.describe('First writing comfort', () => {
  test.use({
    storageState: {
      cookies: [],
      origins: [{
        origin: 'http://127.0.0.1:9080',
        localStorage: []
      }]
    }
  });

  test('starts from an empty Rich editing surface, saves, reloads, and returns focus from cockpit', async ({ page }) => {
    const draft = '朝の一文を書き始める。';

    await page.goto('/index.html?reset=1');
    await page.waitForLoadState('networkidle');
    await ensureNormalMode(page);

    const editor = page.locator('#wysiwyg-editor');
    await expect(editor).toBeVisible({ timeout: 10000 });
    await expect(editor).toBeFocused();
    await expect(editor).toHaveAttribute('data-empty', 'true');
    await expect(editor).toHaveAttribute('data-empty-hint', /ここから書き始められます/);

    const emptyHint = await page.evaluate(() => {
      const el = document.getElementById('wysiwyg-editor');
      return el ? getComputedStyle(el, '::before').content : '';
    });
    expect(emptyHint).toContain('この端末に自動保存');

    await page.keyboard.insertText(draft);
    await expect(editor).toHaveAttribute('data-empty', 'false');

    const chip = page.locator('#writing-status-chip');
    await expect(chip).toBeVisible();
    await expect(chip).toHaveAttribute('data-save-state', 'editing');
    await expect(chip).toContainText('文字数:');
    await expect(chip).toHaveAttribute('aria-label', /本文はこの端末に自動保存されます/);
    await expect(chip).toHaveAttribute('data-save-state', 'saved', { timeout: 5000 });
    await expect(chip).toContainText('保存済み');

    await openCommandPalette(page);
    await page.locator('#command-palette-input').fill('保存');
    await page.locator('.command-palette-item[data-command-id="save"]').click();
    await expect(page.locator('.mini-hud')).toContainText('保存しました');

    await page.reload();
    await page.waitForLoadState('networkidle');
    await ensureNormalMode(page);
    await expect(page.locator('#wysiwyg-editor')).toContainText(draft);
    await expect(page.locator('#wysiwyg-editor')).toHaveAttribute('data-empty', 'false');

    await openCommandPalette(page);
    await page.locator('#command-palette-input').fill('Design Cockpit');
    await page.locator('.command-palette-item[data-command-id="design-cockpit"]').click();
    await expect(page.locator('#design-cockpit')).toBeVisible();
    await expect(page.locator('#design-cockpit-summary')).toContainText('manuscript_content=copied_never');
    await expect(page.locator('#design-cockpit-summary')).not.toContainText(draft);
    await page.locator('#design-cockpit-focus').click();
    await expect(page.locator('#design-cockpit')).not.toBeVisible();
    await expect(page.locator('#wysiwyg-editor')).toBeFocused();
  });
});
