// E2E: クロスオリジン埋め込みデモ（親ポート → 親ポート+1 の子）
// このテストは run-two-servers.js で2つのサーバーが起動している必要がある。
// reuseExistingServer: true の場合、単一サーバーが再利用されると子ポートが不在になる。
const { test, expect } = require('@playwright/test');
const http = require('http');

const demo = '/embed-xorigin-demo.html';

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get({ hostname: '127.0.0.1', port, path: '/', timeout: 2000 }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

test.describe('Cross-Origin Embed Demo', () => {
  test('set/get/focus/snapshot via postMessage works', async ({ page }) => {
    await page.goto(demo);

    // 子サーバー（親ポート+1）が動作しているか確認。なければスキップ。
    const parentPort = await page.evaluate(() => parseInt(location.port || '80', 10));
    const childPort = parentPort + 1;
    const childAlive = await checkPort(childPort);
    test.skip(!childAlive, `子サーバー(port ${childPort})が未起動。run-two-servers.js が必要。`);
    await expect(page.locator('h1')).toContainText('Cross-Origin');

    // iframe が作成されるのを待つ
    const iframeLocator = page.locator('#zw-container iframe');
    await expect(iframeLocator).toHaveCount(1);

    // iframe src を検証（embed_origin が自動付与されること）
    const src = await iframeLocator.getAttribute('src');
    expect(src).toContain('embed=1');
    expect(src).toMatch(/embed_origin=/);

    // iframe 内のページがロードされ、child-bridge が READY を送信するのを待つ
    await page.waitForTimeout(3000);

    const payload = 'Cross-Origin E2E content.';
    await page.fill('#src-text', payload);

    // setContent -> focus（async handler の完了を contentChanged イベントで確認）
    await page.click('#btn-set');
    await expect(page.locator('#events')).toContainText(/contentChanged/i, { timeout: 15000 });

    // getContent -> out
    await page.click('#btn-get');
    await expect(page.locator('#out')).toContainText(
      'Cross-Origin E2E content',
      { timeout: 15000 },
    );

    // focus (cross-origin ではエラーなく動作することを確認)
    await page.click('#btn-focus');
    await page.waitForTimeout(500);

    // snapshot (alert が表示される)
    const dialogPromise = new Promise((resolve) => {
      page.once('dialog', async (dlg) => {
        await dlg.accept();
        resolve();
      });
    });
    await page.click('#btn-snap');
    await dialogPromise;
  });
});
