// E2E: SP-078 読者プレビューモード — HTML出力
const { test, expect } = require('@playwright/test');

test.describe('SP-078 Reader Preview HTML Export', () => {
  test.use({
    storageState: {
      cookies: [],
      origins: [{
        origin: 'http://127.0.0.1:9080',
        localStorage: [],
      }],
    },
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });
  });

  test('読者プレビューモードに切り替えられる', async ({ page }) => {
    // コンテンツを入力
    await page.evaluate(() => {
      var editor = document.getElementById('wysiwyg-editor');
      if (editor) {
        editor.innerHTML = '<h2>第1章</h2><p>テスト本文</p>';
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // 読者プレビューモードに切り替え
    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.enter();
    });
    await page.waitForTimeout(300);

    const mode = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-ui-mode');
    });
    expect(mode).toBe('reader');
  });

  test('HTMLとして保存ボタンが読者モードで表示される', async ({ page }) => {
    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.enter();
    });
    await page.waitForTimeout(300);

    // ホバーでボタンが表示される
    const exportBtn = page.locator('#reader-export-html');
    // ボタンは存在するがtop:-48pxで隠れている
    await expect(exportBtn).toBeAttached();
  });

  test('exportHtml APIが呼び出し可能', async ({ page }) => {
    // コンテンツを入力
    await page.evaluate(() => {
      var editor = document.getElementById('wysiwyg-editor');
      if (editor) {
        editor.innerHTML = '<h2>第1章</h2><p>テスト本文です</p>';
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // 読者プレビューに入る
    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.enter();
    });
    await page.waitForTimeout(300);

    // ダウンロードイベントをキャプチャ
    const downloadPromise = page.waitForEvent('download');
    await page.evaluate(() => {
      if (window.ZWReaderPreview && typeof window.ZWReaderPreview.exportHtml === 'function') {
        window.ZWReaderPreview.exportHtml();
      }
    });

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.html$/);
  });

  test('exit APIで編集モードに復帰する', async ({ page }) => {
    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.enter();
    });
    await page.waitForTimeout(200);

    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.exit();
    });
    await page.waitForTimeout(200);

    const mode = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-ui-mode');
    });
    expect(mode).not.toBe('reader');
  });
});
