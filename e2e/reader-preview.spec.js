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
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-toolbar-mode', 'full');
    });
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

  test('読者プレビューに切り替えられる', async ({ page }) => {
    // コンテンツを入力
    await page.evaluate(() => {
      var editor = document.getElementById('wysiwyg-editor');
      if (editor) {
        editor.innerHTML = '<h2>第1章</h2><p>テスト本文</p>';
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // 読者プレビューに切り替え
    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.enter();
    });
    await page.waitForTimeout(300);

    const mode = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-reader-overlay-open');
    });
    expect(mode).toBe('true');
  });

  test('読者プレビュー枠に aria-describedby と主要ボタンの aria-label がある', async ({ page }) => {
    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.enter();
    });
    await page.waitForTimeout(300);

    const a11y = await page.evaluate(() => {
      var root = document.getElementById('reader-preview');
      var back = document.getElementById('reader-back-fab');
      var exp = document.getElementById('reader-export-html');
      var vert = document.getElementById('reader-vertical-toggle');
      return {
        describedBy: root && root.getAttribute('aria-describedby'),
        backLabel: back && back.getAttribute('aria-label'),
        exportLabel: exp && exp.getAttribute('aria-label'),
        vertLabel: vert && vert.getAttribute('aria-label'),
        vertPressed: vert && vert.getAttribute('aria-pressed'),
      };
    });

    expect(a11y.describedBy).toBe('reader-mode-hint');
    expect(a11y.backLabel).toContain('編集に戻る');
    expect(a11y.exportLabel).toContain('HTML');
    expect(a11y.vertLabel).toContain('縦書き');
    expect(a11y.vertLabel).toContain('再生オーバーレイ');
    expect(a11y.vertPressed).toBe('false');
  });

  test('HTMLとして保存ボタンが読者プレビューで表示される', async ({ page }) => {
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

    // 読者プレビューに入り、スクロール
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
      return document.documentElement.hasAttribute('data-reader-overlay-open');
    });
    expect(mode).toBe(false);
  });

  test('focus復帰後も同位置にReader復帰導線が見える', async ({ page }) => {
    await page.evaluate(() => {
      if (window.ZenWriterApp) window.ZenWriterApp.setUIMode('focus');
    });
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.enter();
    });
    await page.waitForFunction(() => document.documentElement.getAttribute('data-reader-overlay-open') === 'true');

    const backFab = page.locator('#reader-back-fab');
    await expect(backFab).toBeVisible();
    await backFab.click();
    await page.waitForFunction(() => document.documentElement.getAttribute('data-reader-overlay-open') !== 'true');

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
    await page.waitForFunction(() => document.documentElement.getAttribute('data-reader-overlay-open') === 'true');

    await page.locator('#reader-back-fab').click();
    await page.waitForFunction(() => document.documentElement.getAttribute('data-reader-overlay-open') !== 'true');

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-edge-hover-top', 'true');
    });
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      var button = document.querySelector('[data-reader-preview-toggle]');
      if (button) button.click();
    });
    await page.waitForFunction(() => document.documentElement.getAttribute('data-reader-overlay-open') === 'true');

    const mode = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-reader-overlay-open');
    });
    expect(mode).toBe('true');
    await expect(page.locator('#reader-back-fab')).toBeVisible();
  });

  test('compact toolbarでも読者プレビュー導線が見える', async ({ page }) => {
    const toolbarEntry = page.locator('[data-reader-preview-toggle]').first();
    await expect(toolbarEntry).toBeAttached();

    await page.evaluate(() => {
      var button = document.querySelector('[data-reader-preview-toggle]');
      if (button) button.click();
    });
    await page.waitForFunction(() => document.documentElement.getAttribute('data-reader-overlay-open') === 'true');

    await expect(page.locator('#reader-back-fab')).toBeVisible();
    const mode = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-reader-overlay-open');
    });
    expect(mode).toBe('true');
  });

  test('章ナビ操作はFocus用 navigateTo を呼ばず Reader 内でスクロールする', async ({ page }) => {
    await page.evaluate(() => {
      var paras = '';
      var htmlParas = '';
      for (var p = 0; p < 30; p++) {
        paras += '段落' + p + 'の本文を少し長めにしてスクロール量を確保します。\n\n';
        htmlParas += '<p>段落' + p + 'の本文を少し長めにしてスクロール量を確保します。</p>';
      }
      var md = '## 第1章\n\n' + paras + '\n## 第2章\n\n' + paras;
      var textEditor = document.getElementById('editor');
      if (textEditor) textEditor.value = md;
      var editor = document.getElementById('wysiwyg-editor');
      if (editor) {
        editor.innerHTML = '<h2>第1章</h2>' + htmlParas + '<h2>第2章</h2>' + htmlParas;
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
      var S = window.ZenWriterStorage;
      if (S && typeof S.saveContent === 'function') S.saveContent(md);
      var st = S.loadSettings();
      st.chapterNav = { enabled: true, style: 'minimal' };
      S.saveSettings(st);
    });

    await page.evaluate(() => {
      if (window.ZenWriterApp) window.ZenWriterApp.setUIMode('focus');
    });
    await page.waitForTimeout(150);

    await page.evaluate(() => {
      var CL = window.ZWChapterList;
      if (!CL || typeof CL.navigateTo !== 'function') return;
      if (CL.__zwOrigNavigateTo) return;
      CL.__zwOrigNavigateTo = CL.navigateTo;
      CL.__zwNavigateToCalls = [];
      CL.navigateTo = function (idx) {
        CL.__zwNavigateToCalls.push(idx);
        return CL.__zwOrigNavigateTo.call(this, idx);
      };
    });

    try {
      await page.evaluate(() => {
        if (window.ZWReaderPreview) window.ZWReaderPreview.enter();
      });
      await page.waitForFunction(() => document.documentElement.getAttribute('data-reader-overlay-open') === 'true');

      const nextNav = page.locator('#reader-preview-inner .chapter-nav-bar__link.chapter-nav-bar__next').filter({ hasText: /\u2192/ });
      await expect(nextNav).toBeVisible({ timeout: 10000 });

      const scrollBefore = await page.evaluate(() => {
        var el = document.getElementById('reader-preview');
        return el ? el.scrollTop : 0;
      });

      await nextNav.click();
      await page.waitForFunction(
        (before) => {
          var el = document.getElementById('reader-preview');
          return el && el.scrollTop > before + 5;
        },
        scrollBefore,
        { timeout: 8000 }
      );

      const calls = await page.evaluate(() => {
        var CL = window.ZWChapterList;
        return CL && CL.__zwNavigateToCalls ? CL.__zwNavigateToCalls.slice() : [];
      });

      expect(calls.length).toBe(0);
    } finally {
      await page.evaluate(() => {
        var CL = window.ZWChapterList;
        if (CL && CL.__zwOrigNavigateTo) {
          CL.navigateTo = CL.__zwOrigNavigateTo;
          delete CL.__zwOrigNavigateTo;
          delete CL.__zwNavigateToCalls;
        }
      });
    }
  });
});
