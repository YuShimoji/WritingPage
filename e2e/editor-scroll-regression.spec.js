// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Editor Scroll Regression', () => {
  test('editor container keeps stretch layout to avoid forced scroll-back', async ({ page }) => {
    await page.goto('/');
    const computed = await page.locator('.editor-container').evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        display: style.display,
        alignItems: style.alignItems,
        height: style.height,
      };
    });

    expect(computed.display).toBe('flex');
    expect(computed.alignItems).toBe('stretch');
    expect(parseFloat(computed.height)).toBeGreaterThan(0);
  });
});
