// @ts-check
const { test, expect } = require('@playwright/test');
const { ensureNormalMode, openCommandPalette } = require('./helpers');

test.describe('First writing comfort', () => {
  test.use({
    storageState: {
      cookies: [],
      origins: [{
        origin: 'http://127.0.0.1:9080',
        localStorage: []
      }]
    }
  });

  test('starts from an empty Rich editing surface, saves, reloads, and returns focus from cockpit', async ({ page }) => {
    const draft = '朝の一文を書き始める。';

    await page.goto('/index.html?reset=1');
    await page.waitForLoadState('networkidle');
    await ensureNormalMode(page);

    const editor = page.locator('#wysiwyg-editor');
    await expect(editor).toBeVisible({ timeout: 10000 });
    await expect(editor).toBeFocused();
    await expect(editor).toHaveAttribute('data-empty', 'true');
    await expect(editor).toHaveAttribute('data-empty-hint', /ここから書き始められます/);

    const emptyHint = await page.evaluate(() => {
      const el = document.getElementById('wysiwyg-editor');
      return el ? getComputedStyle(el, '::before').content : '';
    });
    expect(emptyHint).toContain('この端末に自動保存');

    await page.keyboard.insertText(draft);
    await expect(editor).toHaveAttribute('data-empty', 'false');

    const chip = page.locator('#writing-status-chip');
    await expect(chip).toBeInViewport({ ratio: 1 });
    await expect(chip).toHaveAttribute('data-save-state', 'editing');
    await expect(chip).toContainText('文字数:');
    await expect(chip).toHaveAttribute('aria-label', /本文はこの端末に自動保存されます/);
    await expect(chip).toHaveAttribute('data-save-state', 'saved', { timeout: 5000 });
    await expect(chip).toContainText('保存済み');

    await openCommandPalette(page);
    await page.locator('#command-palette-input').fill('保存');
    await page.locator('.command-palette-item[data-command-id="save"]').click();
    await expect(page.locator('.mini-hud')).toContainText('保存しました');

    await page.reload();
    await page.waitForLoadState('networkidle');
    await ensureNormalMode(page);
    await expect(page.locator('#wysiwyg-editor')).toContainText(draft);
    await expect(page.locator('#wysiwyg-editor')).toHaveAttribute('data-empty', 'false');

    await openCommandPalette(page);
    await page.locator('#command-palette-input').fill('Design Cockpit');
    await page.locator('.command-palette-item[data-command-id="design-cockpit"]').click();
    await expect(page.locator('#design-cockpit')).toBeVisible();
    await expect(page.locator('#design-cockpit-summary')).toContainText('manuscript_content=copied_never');
    await expect(page.locator('#design-cockpit-summary')).not.toContainText(draft);
    await page.locator('#design-cockpit-focus').click();
    await expect(page.locator('#design-cockpit')).not.toBeVisible();
    await expect(page.locator('#wysiwyg-editor')).toBeFocused();
  });

  // 実機で、3文字に下線を付けると右下の文字数が 26 になった。装飾の記号は数えない。
  test('status chip counts only visible characters after underline, kenten and ruby', async ({ page }) => {
    await page.goto('/index.html?reset=1');
    await page.waitForLoadState('networkidle');
    await ensureNormalMode(page);

    const editor = page.locator('#wysiwyg-editor');
    await expect(editor).toBeFocused();
    await page.keyboard.insertText('駅を出ると、雨はもう上がっていた。');
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Control+U');

    const chip = page.locator('#writing-status-chip');
    await expect(chip).toHaveAttribute('data-char-count', '17');
    expect(await page.evaluate(() => window.ZenWriterEditor.getEditorValue())).toContain('[underline]');

    const counts = await page.evaluate(() => ({
      kenten: window.EditorUI._countPlainChars('{kenten|傍点}です'),
      ruby: window.EditorUI._countPlainChars('{漢字|かんじ}です'),
      bracketNote: window.EditorUI._countPlainChars('[メモ]と書く')
    }));
    expect(counts).toEqual({ kenten: 4, ruby: 4, bracketNote: 7 });
  });

  test('count mode switches from the command palette, and the chip shows sheets and the selection', async ({ page }) => {
    await page.goto('/index.html?reset=1');
    await page.waitForLoadState('networkidle');
    await ensureNormalMode(page);

    // 1 段落 = 全角スペースの字下げ + 17 文字、段落の間は空行
    const paragraph = '　駅を出ると、雨はもう上がっていた。\n\n';
    await page.evaluate((text) => window.ZenWriterEditor.setContent(text), paragraph.repeat(40));

    const chip = page.locator('#writing-status-chip');
    await expect(chip).toHaveAttribute('data-char-count', '680');
    await expect(chip).toContainText('約1.7枚');

    await openCommandPalette(page);
    await page.locator('#command-palette-input').fill('文字数の数え方');
    await page.locator('.command-palette-item[data-command-id="cycle-count-mode"]').click();
    await expect(chip).toHaveAttribute('data-char-count', '720');
    await expect(chip).toHaveAttribute('aria-label', /数え方: 改行を除く/);

    await page.evaluate(() => {
      const editor = document.getElementById('wysiwyg-editor');
      editor.focus();
      const paragraphs = editor.querySelectorAll('p');
      const range = document.createRange();
      range.setStartBefore(paragraphs[0].firstChild);
      range.setEndAfter(paragraphs[1].lastChild);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    });
    await expect(chip).toHaveAttribute('data-selection-count', '36');
    await expect(chip).toContainText('選択 36');
  });
});
