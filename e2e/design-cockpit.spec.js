const { test, expect } = require('@playwright/test');
const { ensureNormalMode, openCommandPalette } = require('./helpers');

const pageUrl = '/index.html?reset=1';

async function setEditorContent(page, text) {
  await page.evaluate((value) => {
    if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function') {
      window.ZenWriterEditor.setContent(value);
    }
    var textarea = document.getElementById('editor');
    if (textarea) {
      textarea.value = value;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    var rich = document.getElementById('wysiwyg-editor');
    if (rich) {
      rich.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, text);
}

test.describe('Design Cockpit dashboard', () => {
  test('opens from command palette and reports save trust without manuscript text', async ({ page }) => {
    const secretToken = 'design-cockpit-secret-manuscript-token';
    await page.goto(pageUrl);
    await page.waitForLoadState('networkidle');
    await ensureNormalMode(page);
    await setEditorContent(page, `Draft checkpoint ${secretToken}`);

    await openCommandPalette(page);
    await page.locator('#command-palette-input').fill('Design Cockpit');
    const command = page.locator('.command-palette-item[data-command-id="design-cockpit"]');
    await expect(command).toBeVisible();
    await command.click();

    const cockpit = page.locator('#design-cockpit');
    await expect(cockpit).toBeVisible();
    await expect(page.locator('#design-cockpit-save-state')).not.toHaveText('unknown');
    await expect(page.locator('#design-cockpit-count')).toContainText('文字');
    await expect(page.locator('#design-cockpit-doc')).not.toHaveText('unknown');
    await expect(page.locator('#design-cockpit-autosave')).toContainText('ON');
    await expect(page.locator('#design-cockpit-manual-save')).toContainText('保存');
    await expect(page.locator('#design-cockpit-check-writing')).toHaveAttribute('data-state', 'pass');
    await expect(page.locator('#design-cockpit-check-save-visible')).toHaveAttribute('data-state', 'pass');
    await expect(page.locator('#design-cockpit-check-manual-save')).toHaveAttribute('data-state', 'pass');
    await expect(cockpit).not.toContainText(secretToken);

    await page.locator('#design-cockpit-save').click();
    await expect(page.locator('#writing-status-chip')).toHaveAttribute('data-save-state', 'saved', { timeout: 5000 });

    const summary = page.locator('#design-cockpit-summary');
    await expect(summary).toContainText('Design Cockpit / Writing UX checkpoint');
    await expect(summary).toContainText('manuscript_content=copied_never');
    await expect(summary).not.toContainText(secretToken);

    await page.locator('#design-cockpit-focus').click();
    await expect(cockpit).not.toBeVisible();
    const activeId = await page.evaluate(() => document.activeElement && document.activeElement.id);
    expect(['editor', 'wysiwyg-editor']).toContain(activeId);
  });

  test('opens from local review query parameter', async ({ page }) => {
    await page.goto('/index.html?designCockpit=1');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#design-cockpit')).toBeVisible();
    await expect(page.locator('#design-cockpit-summary')).toContainText('review_surface=available');
  });
});
