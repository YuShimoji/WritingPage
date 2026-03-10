// @ts-nocheck
const { test, expect } = require('@playwright/test');
const { showFullToolbar } = require('./helpers');

// WYSIWYGエディタ機能テスト (WYSIWYGがデフォルトモード)
test.describe('WYSIWYG Editor', () => {
  // playwright.config の storageState (wysiwyg-mode=false) を上書きし、
  // localStorage未設定状態にすることでWYSIWYGデフォルト動作を得る
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
    // WYSIWYGがデフォルトで有効になるのを待つ
    await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });
    await showFullToolbar(page);
    await page.waitForSelector('#toggle-wysiwyg', { state: 'visible' });
  });

  /** textareaモードに切り替えるヘルパー */
  async function switchToTextarea(page) {
    const switchBtn = page.locator('#wysiwyg-switch-to-textarea');
    await switchBtn.dispatchEvent('mousedown');
    await expect(page.locator('#editor')).toBeVisible();
  }

  test('should start in WYSIWYG mode by default', async ({ page }) => {
    const textarea = page.locator('#editor');
    const wysiwygEditor = page.locator('#wysiwyg-editor');
    const wysiwygToolbar = page.locator('#wysiwyg-toolbar');

    // デフォルトでWYSIWYGモード
    await expect(wysiwygEditor).toBeVisible();
    // ツールバーはフローティング化により選択時のみ表示（DOMには存在）
    await expect(wysiwygToolbar).toBeAttached();
    await expect(textarea).not.toBeVisible();
  });

  test('should initialize richtextEnhanced setting and command adapter', async ({ page }) => {
    await page.waitForFunction(() => !!(window.richTextEditor && window.richTextEditor.commandAdapter));

    const state = await page.evaluate(() => {
      const settings = window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function'
        ? window.ZenWriterStorage.loadSettings()
        : {};
      return {
        richtextEnhanced: !!(settings && settings.editor && settings.editor.richtextEnhanced),
        hasAdapter: !!(window.richTextEditor && window.richTextEditor.commandAdapter)
      };
    });

    expect(state.richtextEnhanced).toBe(true);
    expect(state.hasAdapter).toBe(true);
  });

  test('should switch between WYSIWYG and textarea modes', async ({ page }) => {
    const textarea = page.locator('#editor');
    const wysiwygEditor = page.locator('#wysiwyg-editor');
    const wysiwygToolbar = page.locator('#wysiwyg-toolbar');
    const toggleBtn = page.locator('#toggle-wysiwyg');

    // 初期状態: WYSIWYGモード
    await expect(wysiwygEditor).toBeVisible();

    // toggle: WYSIWYG → textarea
    await toggleBtn.dispatchEvent('mousedown');
    await expect(textarea).toBeVisible();
    await expect(wysiwygEditor).not.toBeVisible();
    await expect(wysiwygToolbar).not.toBeVisible();

    // toggle: textarea → WYSIWYG
    await toggleBtn.dispatchEvent('mousedown');
    await expect(wysiwygEditor).toBeVisible();
    await expect(textarea).not.toBeVisible();
    // ツールバーはフローティング化により選択時のみ表示（DOMには存在）
    await expect(wysiwygToolbar).toBeAttached();
  });

  test('should convert Markdown to HTML when switching to WYSIWYG', async ({ page }) => {
    const textarea = page.locator('#editor');
    const toggleBtn = page.locator('#toggle-wysiwyg');

    // まずtextareaモードに切り替え
    await switchToTextarea(page);

    // Markdownテキストを入力
    await textarea.fill('**太字**と*斜体*のテキスト');
    await toggleBtn.dispatchEvent('mousedown');
    await expect(page.locator('#wysiwyg-editor')).toBeVisible();

    // WYSIWYGエディタにHTMLが変換されていることを確認
    const wysiwygEditor = page.locator('#wysiwyg-editor');
    const content = await wysiwygEditor.innerHTML();

    expect(content).toContain('<strong>');
    expect(content).toContain('<em>');
  });

  test('should convert HTML to Markdown when switching to textarea', async ({ page }) => {
    const textarea = page.locator('#editor');

    const wysiwygEditor = page.locator('#wysiwyg-editor');
    await wysiwygEditor.click();

    // WYSIWYGエディタに直接HTMLを入力
    await page.evaluate(() => {
      const editor = document.getElementById('wysiwyg-editor');
      editor.innerHTML = '<p><strong>太字</strong>と<em>斜体</em>のテキスト</p>';
    });

    // textareaモードに戻す
    await switchToTextarea(page);

    // Markdownに変換されていることを確認
    const markdown = await textarea.inputValue();
    expect(markdown).toContain('**');
    expect(markdown).toContain('*');
  });

  test('should apply bold formatting in WYSIWYG mode', async ({ page }) => {
    const boldBtn = page.locator('#wysiwyg-bold');
    const wysiwygEditor = page.locator('#wysiwyg-editor');

    await wysiwygEditor.click();
    await wysiwygEditor.fill('太字にするテキスト');

    // テキストを選択
    await page.evaluate(() => {
      const editor = document.getElementById('wysiwyg-editor');
      const range = document.createRange();
      range.selectNodeContents(editor);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    await boldBtn.dispatchEvent('mousedown');

    const content = await wysiwygEditor.innerHTML();
    expect(content).toMatch(/<(strong|b)>/);
  });

  test('should route formatting command through command adapter', async ({ page }) => {
    await page.waitForFunction(() => !!(window.richTextEditor && window.richTextEditor.commandAdapter));

    const boldBtn = page.locator('#wysiwyg-bold');
    const wysiwygEditor = page.locator('#wysiwyg-editor');

    await page.evaluate(() => {
      window.__adapterExecCount = 0;
      const rich = window.richTextEditor;
      if (!rich || !rich.commandAdapter || typeof rich.commandAdapter.execute !== 'function') return;
      const original = rich.commandAdapter.execute.bind(rich.commandAdapter);
      rich.commandAdapter.execute = function () {
        window.__adapterExecCount += 1;
        return original.apply(rich.commandAdapter, arguments);
      };
    });

    await wysiwygEditor.click();
    await wysiwygEditor.fill('adapter経由で太字');

    await page.evaluate(() => {
      const editor = document.getElementById('wysiwyg-editor');
      const range = document.createRange();
      range.selectNodeContents(editor);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    await boldBtn.dispatchEvent('mousedown');

    const calls = await page.evaluate(() => window.__adapterExecCount || 0);
    expect(calls).toBeGreaterThan(0);
  });

  test('should bypass adapter when richtextEnhanced rollback flag is false', async ({ page }) => {
    await page.waitForFunction(() => !!(window.richTextEditor && window.richTextEditor.commandAdapter));

    await page.evaluate(() => {
      const s = window.ZenWriterStorage.loadSettings();
      s.editor = { ...(s.editor || {}), richtextEnhanced: false };
      window.ZenWriterStorage.saveSettings(s);
      window.__adapterCalledWhenRollback = false;
      const rich = window.richTextEditor;
      const original = rich.commandAdapter.execute.bind(rich.commandAdapter);
      rich.commandAdapter.execute = function () {
        window.__adapterCalledWhenRollback = true;
        return original.apply(rich.commandAdapter, arguments);
      };
    });

    const boldBtn = page.locator('#wysiwyg-bold');
    const wysiwygEditor = page.locator('#wysiwyg-editor');
    await wysiwygEditor.click();
    await wysiwygEditor.fill('rollback');

    await page.evaluate(() => {
      const editor = document.getElementById('wysiwyg-editor');
      const range = document.createRange();
      range.selectNodeContents(editor);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    await boldBtn.dispatchEvent('mousedown');

    const adapterCalled = await page.evaluate(() => !!window.__adapterCalledWhenRollback);
    const content = await wysiwygEditor.innerHTML();
    expect(adapterCalled).toBeFalsy();
    expect(content).toMatch(/<(strong|b)>/);
  });

  test('should apply italic formatting in WYSIWYG mode', async ({ page }) => {
    const italicBtn = page.locator('#wysiwyg-italic');
    const wysiwygEditor = page.locator('#wysiwyg-editor');

    await wysiwygEditor.click();
    await wysiwygEditor.fill('斜体にするテキスト');

    await page.evaluate(() => {
      const editor = document.getElementById('wysiwyg-editor');
      const range = document.createRange();
      range.selectNodeContents(editor);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    await italicBtn.dispatchEvent('mousedown');

    const content = await wysiwygEditor.innerHTML();
    expect(content).toMatch(/<(em|i)>/);
  });

  test('should apply underline formatting in WYSIWYG mode', async ({ page }) => {
    const underlineBtn = page.locator('#wysiwyg-underline');
    const wysiwygEditor = page.locator('#wysiwyg-editor');

    await wysiwygEditor.click();
    await wysiwygEditor.fill('下線を引くテキスト');

    await page.evaluate(() => {
      const editor = document.getElementById('wysiwyg-editor');
      const range = document.createRange();
      range.selectNodeContents(editor);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    await underlineBtn.dispatchEvent('mousedown');

    const content = await wysiwygEditor.innerHTML();
    expect(content).toContain('<u>');
  });

  test('should insert link in WYSIWYG mode', async ({ page }) => {
    const linkBtn = page.locator('#wysiwyg-link');
    const wysiwygEditor = page.locator('#wysiwyg-editor');

    await wysiwygEditor.click();
    await wysiwygEditor.fill('リンクテキスト');

    await page.evaluate(() => {
      const editor = document.getElementById('wysiwyg-editor');
      const range = document.createRange();
      range.selectNodeContents(editor);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    page.once('dialog', async dialog => {
      expect(dialog.type()).toBe('prompt');
      await dialog.accept('https://example.com');
    });

    await linkBtn.dispatchEvent('mousedown');

    const content = await wysiwygEditor.innerHTML();
    expect(content).toContain('<a');
    expect(content).toContain('href');
  });

  test('should sync content between modes', async ({ page }) => {
    const textarea = page.locator('#editor');
    const wysiwygEditor = page.locator('#wysiwyg-editor');
    const toggleBtn = page.locator('#toggle-wysiwyg');

    // WYSIWYGで編集
    await wysiwygEditor.click();
    await wysiwygEditor.fill('編集されたコンテンツ');

    // textareaモードに戻す
    await switchToTextarea(page);

    // 編集内容が同期されていることを確認
    const textareaContent = await textarea.inputValue();
    expect(textareaContent).toContain('編集されたコンテンツ');

    // textareaで入力
    await textarea.fill('テストコンテンツ');

    // WYSIWYGモードに切り替え
    await toggleBtn.dispatchEvent('mousedown');
    await expect(wysiwygEditor).toBeVisible();

    const wysiwygContent = await wysiwygEditor.textContent();
    expect(wysiwygContent).toContain('テストコンテンツ');
  });

  test('should preserve content when switching modes multiple times', async ({ page }) => {
    const textarea = page.locator('#editor');
    const toggleBtn = page.locator('#toggle-wysiwyg');

    // まずtextareaに切り替え
    await switchToTextarea(page);

    // Markdown入力
    await textarea.fill('**太字**と*斜体*');

    // textarea → WYSIWYG → textarea → WYSIWYG
    await toggleBtn.dispatchEvent('mousedown');
    await expect(page.locator('#wysiwyg-editor')).toBeVisible();

    await toggleBtn.dispatchEvent('mousedown');
    await expect(textarea).toBeVisible();

    await toggleBtn.dispatchEvent('mousedown');
    await expect(page.locator('#wysiwyg-editor')).toBeVisible();

    // 内容が保持されていることを確認
    const wysiwygEditor = page.locator('#wysiwyg-editor');
    const content = await wysiwygEditor.innerHTML();
    expect(content).toContain('太字');
    expect(content).toContain('斜体');
  });
});
