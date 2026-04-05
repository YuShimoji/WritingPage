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
    // chapterMode をオフにし、Legacy パス (editor.value) でコンテンツを読ませる
    await page.evaluate(() => {
      var S = window.ZenWriterStorage;
      if (!S) return;
      var docId = S.getCurrentDocId();
      if (!docId) return;
      var docs = S.loadDocuments();
      for (var i = 0; i < docs.length; i++) {
        if (docs[i] && docs[i].id === docId) {
          docs[i].chapterMode = false;
          break;
        }
      }
      S.saveDocuments(docs);
    });
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
    // 長いコンテンツを入力 (textarea + WYSIWYG 両方に設定)
    await page.evaluate(() => {
      var md = '## 第1章\n';
      var html = '<h2>第1章</h2>';
      for (var i = 0; i < 50; i++) {
        md += 'テスト本文の段落' + i + 'です。\n\n';
        html += '<p>テスト本文の段落' + i + 'です。</p>';
      }
      var textEditor = document.getElementById('editor');
      if (textEditor) textEditor.value = md;
      var editor = document.getElementById('wysiwyg-editor');
      if (editor) {
        editor.innerHTML = html;
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
    // 長いコンテンツを入力 (textarea + WYSIWYG 両方に設定)
    await page.evaluate(() => {
      var md = '## 第1章\n';
      var html = '<h2>第1章</h2>';
      for (var i = 0; i < 50; i++) {
        md += '段落' + i + '。\n\n';
        html += '<p>段落' + i + '。</p>';
      }
      var textEditor = document.getElementById('editor');
      if (textEditor) textEditor.value = md;
      var editor = document.getElementById('wysiwyg-editor');
      if (editor) {
        editor.innerHTML = html;
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

  test('テクスチャオーバーレイが読者プレビューで表示される', async ({ page }) => {
    await page.evaluate(() => {
      var textEditor = document.getElementById('editor');
      if (textEditor) textEditor.value = '## 第1章\n\n[wave]波打つテキスト[/wave]';
      var editor = document.getElementById('wysiwyg-editor');
      if (editor) {
        editor.innerHTML = '<h2>第1章</h2><p>[wave]波打つテキスト[/wave]</p>';
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    await page.evaluate(() => window.ZWReaderPreview.enter());
    await page.waitForTimeout(300);

    const texWave = page.locator('#reader-preview-inner .tex-wave');
    await expect(texWave).toBeAttached();
  });

  test('傍点(kenten)が読者プレビューで表示される', async ({ page }) => {
    await page.evaluate(() => {
      var textEditor = document.getElementById('editor');
      if (textEditor) textEditor.value = '## 第1章\n\n{kenten|重要なテキスト}を含む文';
      var editor = document.getElementById('wysiwyg-editor');
      if (editor) {
        editor.innerHTML = '<h2>第1章</h2><p>{kenten|重要なテキスト}を含む文</p>';
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    await page.evaluate(() => window.ZWReaderPreview.enter());
    await page.waitForTimeout(300);

    const kenten = page.locator('#reader-preview-inner .kenten');
    await expect(kenten).toBeAttached();
    await expect(kenten).toHaveText('重要なテキスト');
  });

  test('wikilinkが読者プレビューでリンク化される', async ({ page }) => {
    await page.evaluate(() => {
      var textEditor = document.getElementById('editor');
      if (textEditor) textEditor.value = '## 第1章\n\n[[テストキャラ]]が登場する';
      var editor = document.getElementById('wysiwyg-editor');
      if (editor) {
        editor.innerHTML = '<h2>第1章</h2><p>[[テストキャラ]]が登場する</p>';
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    await page.evaluate(() => window.ZWReaderPreview.enter());
    await page.waitForTimeout(300);

    const wikilink = page.locator('#reader-preview-inner a.wikilink');
    await expect(wikilink).toBeAttached();
    await expect(wikilink).toHaveAttribute('data-wikilink');
  });

  test('ルビ記法が読者プレビューで変換される', async ({ page }) => {
    await page.evaluate(() => {
      var textEditor = document.getElementById('editor');
      if (textEditor) textEditor.value = '## 第1章\n\n{漢字|かんじ}のテスト';
      var editor = document.getElementById('wysiwyg-editor');
      if (editor) {
        editor.innerHTML = '<h2>第1章</h2><p>{漢字|かんじ}のテスト</p>';
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    await page.evaluate(() => window.ZWReaderPreview.enter());
    await page.waitForTimeout(300);

    const ruby = page.locator('#reader-preview-inner ruby');
    await expect(ruby).toBeAttached();
    const rt = page.locator('#reader-preview-inner ruby rt');
    await expect(rt).toHaveText('かんじ');
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

  test('focus復帰後も同位置にReader復帰導線が見える', async ({ page }) => {
    await page.evaluate(() => {
      if (window.ZenWriterApp) window.ZenWriterApp.setUIMode('focus');
    });
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.enter();
    });
    await page.waitForTimeout(250);

    const backFab = page.locator('#reader-back-fab');
    await expect(backFab).toBeVisible();
    await backFab.click();
    await page.waitForTimeout(250);

    const mode = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-ui-mode');
    });
    expect(mode).toBe('focus');

  });

  test('Reader復帰導線から再入場できる', async ({ page }) => {
    await page.evaluate(() => {
      if (window.ZenWriterApp) window.ZenWriterApp.setUIMode('focus');
    });
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.enter();
    });
    await page.waitForTimeout(250);

    await page.locator('#reader-back-fab').click();
    await page.waitForTimeout(250);

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-edge-hover-top', 'true');
    });
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      var button = document.getElementById('toggle-reader-preview');
      if (button) button.click();
    });
    await page.waitForTimeout(250);

    const mode = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-ui-mode');
    });
    expect(mode).toBe('reader');
    await expect(page.locator('#reader-back-fab')).toBeVisible();
  });

  test('compact toolbarでも読者プレビュー導線が見える', async ({ page }) => {
    const toolbarEntry = page.locator('#toggle-reader-preview');
    await expect(toolbarEntry).toBeAttached();

    await page.evaluate(() => {
      var button = document.getElementById('toggle-reader-preview');
      if (button) button.click();
    });
    await page.waitForTimeout(250);

    await expect(page.locator('#reader-back-fab')).toBeVisible();
    const mode = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-ui-mode');
    });
    expect(mode).toBe('reader');
  });
});
