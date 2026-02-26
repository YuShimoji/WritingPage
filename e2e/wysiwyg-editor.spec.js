// @ts-nocheck
const { test, expect } = require('@playwright/test');

// NOTE: WYSIWYGエディタ機能は未実装のため全テストをスキップ
test.describe.skip('WYSIWYG Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await page.waitForSelector('#toggle-wysiwyg', { state: 'visible' });
  });

  test('should switch between textarea and WYSIWYG modes', async ({ page }) => {
    // 初期状態はtextareaモード
    const textarea = page.locator('#editor');
    const wysiwygEditor = page.locator('#wysiwyg-editor');
    const wysiwygToolbar = page.locator('#wysiwyg-toolbar');
    const toggleBtn = page.locator('#toggle-wysiwyg');

    await expect(textarea).toBeVisible();
    await expect(wysiwygEditor).not.toBeVisible();
    await expect(wysiwygToolbar).not.toBeVisible();

    // WYSIWYGモードに切り替え
    await toggleBtn.dispatchEvent('mousedown');
    await expect(wysiwygEditor).toBeVisible();

    await expect(textarea).not.toBeVisible();
    await expect(wysiwygToolbar).toBeVisible();

    // textareaモードに戻す
    const switchToTextareaBtn = page.locator('#wysiwyg-switch-to-textarea');
    await switchToTextareaBtn.dispatchEvent('mousedown');
    await expect(textarea).toBeVisible();

    await expect(wysiwygEditor).not.toBeVisible();
    await expect(wysiwygToolbar).not.toBeVisible();
  });

  test('should convert Markdown to HTML when switching to WYSIWYG', async ({ page }) => {
    const textarea = page.locator('#editor');
    const toggleBtn = page.locator('#toggle-wysiwyg');

    // Markdownテキストを入力
    await textarea.fill('**太字**と*斜体*のテキスト');
    await toggleBtn.dispatchEvent('mousedown');
    await expect(page.locator('#wysiwyg-editor')).toBeVisible();

    // WYSIWYGエディタにHTMLが変換されていることを確認
    const wysiwygEditor = page.locator('#wysiwyg-editor');
    const content = await wysiwygEditor.innerHTML();

    // 太字と斜体がHTMLに変換されている
    expect(content).toContain('<strong>');
    expect(content).toContain('<em>');
  });

  test('should convert HTML to Markdown when switching to textarea', async ({ page }) => {
    const textarea = page.locator('#editor');
    const toggleBtn = page.locator('#toggle-wysiwyg');
    const switchToTextareaBtn = page.locator('#wysiwyg-switch-to-textarea');

    // WYSIWYGモードに切り替え
    await toggleBtn.dispatchEvent('mousedown');
    await expect(page.locator('#wysiwyg-editor')).toBeVisible();

    const wysiwygEditor = page.locator('#wysiwyg-editor');
    await wysiwygEditor.click();

    // WYSIWYGエディタに直接HTMLを入力（太字と斜体）
    await page.evaluate(() => {
      const editor = document.getElementById('wysiwyg-editor');
      editor.innerHTML = '<p><strong>太字</strong>と<em>斜体</em>のテキスト</p>';
    });

    // textareaモードに戻す
    await switchToTextareaBtn.dispatchEvent('mousedown');
    await expect(textarea).toBeVisible();

    // Markdownに変換されていることを確認
    const markdown = await textarea.inputValue();
    expect(markdown).toContain('**');
    expect(markdown).toContain('*');
  });

  test('should apply bold formatting in WYSIWYG mode', async ({ page }) => {
    const toggleBtn = page.locator('#toggle-wysiwyg');
    const boldBtn = page.locator('#wysiwyg-bold');

    // WYSIWYGモードに切り替え
    await toggleBtn.dispatchEvent('mousedown');
    await expect(page.locator('#wysiwyg-editor')).toBeVisible();

    const wysiwygEditor = page.locator('#wysiwyg-editor');
    await wysiwygEditor.click();
    await wysiwygEditor.fill('太字にするテキスト');

    // テキストを選択 (evaluateを使用)
    await page.evaluate(() => {
      const editor = document.getElementById('wysiwyg-editor');
      const range = document.createRange();
      range.selectNodeContents(editor);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    // 太字ボタンをクリック
    await boldBtn.dispatchEvent('mousedown');
    // await page.waitForTimeout(100);

    // 太字が適用されていることを確認
    const content = await wysiwygEditor.innerHTML();
    expect(content).toMatch(/<(strong|b)>/);
  });

  test('should apply italic formatting in WYSIWYG mode', async ({ page }) => {
    const toggleBtn = page.locator('#toggle-wysiwyg');
    const italicBtn = page.locator('#wysiwyg-italic');

    // WYSIWYGモードに切り替え
    await toggleBtn.dispatchEvent('mousedown');
    await expect(page.locator('#wysiwyg-editor')).toBeVisible();

    const wysiwygEditor = page.locator('#wysiwyg-editor');
    await wysiwygEditor.click();
    await wysiwygEditor.fill('斜体にするテキスト');

    // テキストを選択
    await page.evaluate(() => {
      const editor = document.getElementById('wysiwyg-editor');
      const range = document.createRange();
      range.selectNodeContents(editor);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    // 斜体ボタンをクリック
    await italicBtn.dispatchEvent('mousedown');
    // await page.waitForTimeout(100);

    // 斜体が適用されていることを確認
    const content = await wysiwygEditor.innerHTML();
    expect(content).toMatch(/<(em|i)>/);
  });

  test('should apply underline formatting in WYSIWYG mode', async ({ page }) => {
    const toggleBtn = page.locator('#toggle-wysiwyg');
    const underlineBtn = page.locator('#wysiwyg-underline');

    // WYSIWYGモードに切り替え
    await toggleBtn.dispatchEvent('mousedown');
    await expect(page.locator('#wysiwyg-editor')).toBeVisible();

    const wysiwygEditor = page.locator('#wysiwyg-editor');
    await wysiwygEditor.click();
    await wysiwygEditor.fill('下線を引くテキスト');

    // テキストを選択
    await page.evaluate(() => {
      const editor = document.getElementById('wysiwyg-editor');
      const range = document.createRange();
      range.selectNodeContents(editor);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    // 下線ボタンをクリック
    await underlineBtn.dispatchEvent('mousedown');
    // await page.waitForTimeout(100);

    // 下線が適用されていることを確認
    const content = await wysiwygEditor.innerHTML();
    expect(content).toContain('<u>'); // u is usually standard, but keeping toContain is fine if no ambiguity
  });

  test('should insert link in WYSIWYG mode', async ({ page }) => {
    const toggleBtn = page.locator('#toggle-wysiwyg');
    const linkBtn = page.locator('#wysiwyg-link');

    // WYSIWYGモードに切り替え
    await toggleBtn.dispatchEvent('mousedown');
    await expect(page.locator('#wysiwyg-editor')).toBeVisible();

    const wysiwygEditor = page.locator('#wysiwyg-editor');
    await wysiwygEditor.click();
    await wysiwygEditor.fill('リンクテキスト');

    // テキストを選択
    await page.evaluate(() => {
      const editor = document.getElementById('wysiwyg-editor');
      const range = document.createRange();
      range.selectNodeContents(editor);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    // ダイアログハンドリングを先に設定
    page.once('dialog', async dialog => {
      expect(dialog.type()).toBe('prompt');
      await dialog.accept('https://example.com');
    });

    // リンクボタンをクリック (mousedownでイベントを設定しているため、直接イベントを発火)
    await linkBtn.dispatchEvent('mousedown');

    // await page.waitForTimeout(100);

    // リンクが挿入されていることを確認
    const content = await wysiwygEditor.innerHTML();
    expect(content).toContain('<a');
    expect(content).toContain('href');
  });

  test('should sync content between modes', async ({ page }) => {
    const textarea = page.locator('#editor');
    const toggleBtn = page.locator('#toggle-wysiwyg');

    // textareaにテキストを入力
    await textarea.fill('テストコンテンツ');

    // WYSIWYGモードに切り替え
    await toggleBtn.dispatchEvent('mousedown');
    await expect(page.locator('#wysiwyg-editor')).toBeVisible();

    const wysiwygEditor = page.locator('#wysiwyg-editor');
    const wysiwygContent = await wysiwygEditor.textContent();
    expect(wysiwygContent).toContain('テストコンテンツ');

    // WYSIWYGで編集
    await wysiwygEditor.click();
    await wysiwygEditor.fill('編集されたコンテンツ');
    // await page.waitForTimeout(300);

    // textareaモードに戻す
    const switchToTextareaBtn = page.locator('#wysiwyg-switch-to-textarea');
    await switchToTextareaBtn.dispatchEvent('mousedown');
    await expect(textarea).toBeVisible();

    // 編集内容が同期されていることを確認
    const textareaContent = await textarea.inputValue();
    expect(textareaContent).toContain('編集されたコンテンツ');
  });

  test('should preserve content when switching modes multiple times', async ({ page }) => {
    const textarea = page.locator('#editor');
    const toggleBtn = page.locator('#toggle-wysiwyg');
    const switchToTextareaBtn = page.locator('#wysiwyg-switch-to-textarea');

    // 初期テキスト
    await textarea.fill('**太字**と*斜体*');

    // WYSIWYG → textarea → WYSIWYG と切り替え
    await toggleBtn.dispatchEvent('mousedown');
    await expect(page.locator('#wysiwyg-editor')).toBeVisible();

    await switchToTextareaBtn.dispatchEvent('mousedown');
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
