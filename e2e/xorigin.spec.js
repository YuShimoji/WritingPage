// E2E: クロスオリジン埋め込みデモ（8080 親 → 8081 子）
const { test, expect } = require('@playwright/test');

const demo = '/embed-xorigin-demo.html';

test.describe('Cross-Origin Embed Demo', () => {
  test('set/get/focus/snapshot via postMessage works', async ({ page }) => {
    page.on('console', (msg) => {
      console.log('[xorigin console]', msg.type(), msg.text());
    });
    await page.goto(demo);
    await expect(page.locator('h1')).toContainText('Cross-Origin');

    const iframeLocator = page.locator('#zw-container iframe');
    await expect(iframeLocator).toHaveCount(1);
    const iframeSrc = await iframeLocator.getAttribute('src');
    console.log('[xorigin debug] iframe src', iframeSrc);
    const frames = page.frames().map((f) => ({ url: f.url(), name: f.name() }));
    console.log('[xorigin debug] frames', JSON.stringify(frames));

    const payload = 'Cross-Origin E2E content.';
    await page.fill('#src-text', payload);

    // setContent -> focus
    await page.click('#btn-set');
    const parentStateAfterSet = await page.evaluate(() => {
      try {
        return {
          debugLogs: (window.__zwDebugLogs || []).slice(-5),
          pendingLen: window.__zwDebugLogs ? window.__zwDebugLogs.length : 0,
        };
      } catch (e) {
        return { error: String(e) };
      }
    });
    console.log(
      '[xorigin debug] parent state after set',
      JSON.stringify(parentStateAfterSet),
    );

    // getContent -> out
    await page.click('#btn-get');
    const parentStateAfterGet = await page.evaluate(() => {
      try {
        return {
          debugLogs: (window.__zwDebugLogs || []).slice(-5),
          outText: document.getElementById('out')?.textContent || '',
        };
      } catch (e) {
        return { error: String(e) };
      }
    });
    console.log(
      '[xorigin debug] parent state after get',
      JSON.stringify(parentStateAfterGet),
    );
    await expect(page.locator('#out')).toContainText(
      'Cross-Origin E2E content',
    );

    // focus (no direct iframe access in x-origin; rely on no error and UI stays active)
    await page.click('#btn-focus');

    // snapshot (alert present in demo)
    const dialogPromise = new Promise((resolve) => {
      page.once('dialog', async (dlg) => {
        await dlg.accept();
        resolve();
      });
    });
    await page.click('#btn-snap');
    await dialogPromise;

    // events pane should receive notifications
    await expect(page.locator('#events')).toContainText(/contentChanged/i);

    // iframe src should include embed_origin and ?embed=1
    const src = await page.locator('#zw-container iframe').getAttribute('src');
    expect(src).toContain('embed=1');
    expect(src).toMatch(/embed_origin=/);
  });
});
