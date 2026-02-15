const { test, expect } = require('@playwright/test');
const { openSearchPanel } = require('./helpers');

const pageUrl = '/index.html';

test.describe('Accessibility E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(pageUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#editor', { timeout: 10000 });
  });

  test('keyboard can open and close sidebar from toggle button', async ({ page }) => {
    const sidebar = page.locator('#sidebar');
    const toggleBtn = page.locator('#toggle-sidebar');

    await expect(sidebar).not.toHaveClass(/open/);

    await toggleBtn.focus();
    await expect(toggleBtn).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(sidebar).toHaveClass(/open/);
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Space');
    await expect(sidebar).not.toHaveClass(/open/);
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
  });

  test('tab key moves focus and shift+tab can return focus', async ({ page }) => {
    await page.locator('#editor').focus();
    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? (el.id || el.className || el.tagName) : '';
    });

    expect(focusedElement).toBeTruthy();

    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#editor')).toBeFocused();
  });

  test('ESC closes search panel dialog', async ({ page }) => {
    await openSearchPanel(page);
    const searchPanel = page.locator('#search-panel');
    await expect(searchPanel).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(searchPanel).not.toBeVisible();
  });

  test('arrow keys switch between sidebar tabs', async ({ page }) => {
    await page.locator('#toggle-sidebar').click();

    const firstTab = page.locator('.sidebar-tab').first();
    const secondTab = page.locator('.sidebar-tab').nth(1);

    await firstTab.focus();
    await page.keyboard.press('ArrowRight');
    await expect(secondTab).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await expect(firstTab).toBeFocused();
  });

  test('ARIA attributes exist on key regions and controls', async ({ page }) => {
    await expect(page.locator('#sidebar')).toHaveAttribute('role', 'complementary');
    await expect(page.locator('.toolbar')).toHaveAttribute('role', 'toolbar');
    await expect(page.locator('#editor')).toHaveAttribute('role', 'textbox');
    await expect(page.locator('#toggle-sidebar')).toHaveAttribute('aria-expanded');

    const firstTab = page.locator('.sidebar-tab').first();
    await expect(firstTab).toHaveAttribute('role', 'tab');
    await expect(firstTab).toHaveAttribute('aria-selected');
  });

  test('focus-visible style is applied for keyboard users', async ({ page }) => {
    await page.keyboard.press('Tab');

    const hasKeyboardUserClass = await page.evaluate(() => {
      return document.body.classList.contains('keyboard-user');
    });
    expect(hasKeyboardUserClass).toBe(true);

    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const style = window.getComputedStyle(el);
      return {
        outlineWidth: style.outlineWidth,
      };
    });

    expect(focused).toBeTruthy();
    expect(parseInt(focused.outlineWidth, 10) || 0).toBeGreaterThan(0);
  });

  test('word count region has aria-live and updates', async ({ page }) => {
    const wordCount = page.locator('.word-count');
    await expect(wordCount).toHaveAttribute('aria-live', 'polite');
    await expect(wordCount).toHaveAttribute('role', 'status');

    await page.locator('#editor').fill('テストテキスト');
    await page.waitForTimeout(300);

    const wordCountText = await wordCount.textContent();
    expect(wordCountText).toBeTruthy();
    expect(wordCountText.length).toBeGreaterThan(0);
  });

  test('search dialog moves focus to input when opened', async ({ page }) => {
    await openSearchPanel(page);
    await expect(page.locator('#search-panel')).toBeVisible();
    await expect(page.locator('#search-input')).toBeFocused();
    await expect(page.locator('#search-panel')).toHaveAttribute('aria-modal', 'true');
  });

  test('preview toggle updates aria-expanded and panel collapsed class', async ({ page }) => {
    const previewToggle = page.locator('#toggle-preview');
    const previewPanel = page.locator('#editor-preview');

    const initialExpanded = await previewToggle.getAttribute('aria-expanded');
    const initialCollapsed = await previewPanel.evaluate((el) => el.classList.contains('editor-preview--collapsed'));

    await previewToggle.click();

    const newExpanded = await previewToggle.getAttribute('aria-expanded');
    const newCollapsed = await previewPanel.evaluate((el) => el.classList.contains('editor-preview--collapsed'));

    expect(newExpanded).not.toBe(initialExpanded);
    expect(newCollapsed).not.toBe(initialCollapsed);
  });
});
