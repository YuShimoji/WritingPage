// E2E: クロスオリジン埋め込みデモ（8080 親 → 8081 子）
const { test, expect } = require('@playwright/test');

const demo = '/embed-xorigin-demo.html';

test.describe('Cross-Origin Embed Demo', () => {
  test('set/get/focus/snapshot via postMessage works', async ({ page }) => {
    await page.goto(demo);
    await expect(page.locator('h1')).toContainText('Cross-Origin');

    const payload = 'Cross-Origin E2E content.';
    await page.fill('#src-text', payload);

    // setContent -> focus
    await page.click('#btn-set');

    // getContent -> out
    await page.click('#btn-get');
    await expect(page.locator('#out')).toContainText('Cross-Origin E2E content');

    // focus (no direct iframe access in x-origin; rely on no error and UI stays active)
    await page.click('#btn-focus');

    // snapshot (alert present in demo)
    const dialogPromise = page.waitForEvent('dialog');
    await page.click('#btn-snap');
    const dlg = await dialogPromise; await dlg.accept();

    // events pane should receive notifications
    await expect(page.locator('#events')).toContainText(/contentChanged/i);

    // iframe src should include embed_origin and ?embed=1
    const src = await page.locator('#zw-container iframe').getAttribute('src');
    expect(src).toContain('embed=1');
    expect(src).toMatch(/embed_origin=/);
  });
});
