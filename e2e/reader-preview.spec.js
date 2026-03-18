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

  test('プログレスバーがスクロールに連動する', async ({ page }) => {
    // 長いコンテンツを入力
    await page.evaluate(() => {
      var editor = document.getElementById('wysiwyg-editor');
      if (editor) {
        var content = '<h2>第1章</h2>';
        for (var i = 0; i < 50; i++) content += '<p>テスト本文の段落' + i + 'です。</p>';
        editor.innerHTML = content;
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.enter();
    });
    await page.waitForTimeout(300);

    // プログレスバーが存在する
    const progressBar = page.locator('.reader-progress-bar');
    await expect(progressBar).toBeAttached();

    // 初期状態: 進捗は小さい
    var pct = await page.evaluate(() => window.ZWReaderPreview.getProgress());
    expect(pct).toBeLessThan(10);

    // スクロールを底まで
    await page.evaluate(() => {
      var el = document.getElementById('reader-preview');
      if (el) el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(200);

    pct = await page.evaluate(() => window.ZWReaderPreview.getProgress());
    expect(pct).toBeGreaterThan(90);
  });

  test('スクロール位置が記憶され復元される', async ({ page }) => {
    // 長いコンテンツを入力
    await page.evaluate(() => {
      var editor = document.getElementById('wysiwyg-editor');
      if (editor) {
        var content = '<h2>第1章</h2>';
        for (var i = 0; i < 50; i++) content += '<p>段落' + i + '。</p>';
        editor.innerHTML = content;
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // 読者モードに入り、スクロール
    await page.evaluate(() => window.ZWReaderPreview.enter());
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      var el = document.getElementById('reader-preview');
      if (el) el.scrollTop = 500;
    });
    await page.waitForTimeout(100);

    // 退出
    await page.evaluate(() => window.ZWReaderPreview.exit());
    await page.waitForTimeout(200);

    // 再入場
    await page.evaluate(() => window.ZWReaderPreview.enter());
    await page.waitForTimeout(300);

    // スクロール位置が復元される
    var scrollTop = await page.evaluate(() => {
      var el = document.getElementById('reader-preview');
      return el ? el.scrollTop : 0;
    });
    expect(scrollTop).toBeGreaterThan(400);
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
