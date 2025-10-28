// E2E: 同一オリジンの埋め込みデモ
const { test, expect } = require('@playwright/test');

const demo = '/embed-demo.html';

test.describe('Embed Demo (same-origin)', () => {
  test('set/get/focus/snapshot flow works', async ({ page }) => {
    await page.goto(demo);
    await expect(page.locator('h1')).toHaveText(/Zen Writer Embed Demo/i);

    // wait child app ready (ZenWriterAPI loaded in iframe)
    const frame = await page.frameLocator('#zw-container iframe');
    await expect(frame.locator('#editor')).toBeVisible();
    await frame.locator('#editor').waitFor();
    await page.waitForFunction(() => {
      try {
        const ifr = document.querySelector('#zw-container iframe');
        if (!ifr || !ifr.contentWindow) return false;
        const api = ifr.contentWindow.ZenWriterAPI;
        return (
          !!api &&
          typeof api.getContent === 'function' &&
          typeof api.setContent === 'function'
        );
      } catch (_) {
        return false;
      }
    });

    // setContent via child API (same-origin direct call for robustness)
    const content = 'Hello from E2E!\n\nこれは自動テストの本文です。';
    await page.fill('#src-text', content);
    await frame.locator('html').evaluate((_, t) => {
      return window.ZenWriterAPI &&
        typeof window.ZenWriterAPI.setContent === 'function'
        ? window.ZenWriterAPI.setContent(t)
        : false;
    }, content);
    // focus via child API to mimic demo button
    await frame
      .locator('html')
      .evaluate(
        () =>
          window.ZenWriterAPI &&
          window.ZenWriterAPI.focus &&
          window.ZenWriterAPI.focus(),
      );

    // confirm the iframe editor actually received content
    await expect(frame.locator('#editor')).toHaveValue(/Hello from E2E/);

    // getContent (direct) and verify
    const got = await frame.locator('html').evaluate(() => {
      return window.ZenWriterAPI &&
        typeof window.ZenWriterAPI.getContent === 'function'
        ? window.ZenWriterAPI.getContent()
        : '';
    });
    expect(String(got)).toContain('Hello from E2E');

    // iframe editor should have focus after set+focus
    await expect(frame.locator('#editor')).toBeVisible();
    const isFocused = await frame.locator('#editor').evaluate((el) => {
      try {
        return el === document.activeElement;
      } catch (_) {
        return false;
      }
    });
    expect(isFocused).toBeTruthy();

    // snapshot via child API and verify child state
    await frame.locator('html').evaluate(() => {
      return window.ZenWriterAPI &&
        typeof window.ZenWriterAPI.takeSnapshot === 'function'
        ? window.ZenWriterAPI.takeSnapshot()
        : false;
    });
    const snapCount = await frame.locator('html').evaluate(() => {
      try {
        return (window.ZenWriterStorage.loadSnapshots() || []).length;
      } catch (_) {
        return 0;
      }
    });
    expect(snapCount).toBeGreaterThan(0);

    // basic lightweight expectations (embed=1 in iframe src)
    const src = await page.locator('#zw-container iframe').getAttribute('src');
    expect(src).toContain('embed=1');
  });
});
