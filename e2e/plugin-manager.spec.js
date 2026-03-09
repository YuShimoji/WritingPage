// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Plugin Manager', () => {
  test('loads manifest plugins in non-embed mode', async ({ page }) => {
    await page.goto('/');

    await page.waitForFunction(() => {
      try {
        return !!(
          window.ZWPluginManager &&
          window.ZenWriterPlugins &&
          typeof window.ZenWriterPlugins.list === 'function' &&
          window.ZenWriterPlugins.list().some((p) => p && p.id === 'choice')
        );
      } catch (_) {
        return false;
      }
    });

    const hasChoice = await page.evaluate(() => {
      if (!window.ZenWriterPlugins || typeof window.ZenWriterPlugins.list !== 'function') return false;
      return window.ZenWriterPlugins.list().some((p) => p && p.id === 'choice');
    });

    expect(hasChoice).toBe(true);
  });
});
