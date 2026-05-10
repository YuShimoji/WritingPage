const { test, expect } = require('@playwright/test');
const { ensureNormalMode, openSidebarGroup } = require('./helpers');

const DAILY_PROOF_TEXT = [
  '# A2 Daily Proof',
  '',
  '保存安心感を確認する短い本文。',
  '',
  '## セクション確認',
  '',
  'Reader と浮遊メモを往復しても執筆面へ戻る。'
].join('\n');

async function setDailyProofContent(page) {
  await page.evaluate((text) => {
    if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function') {
      window.ZenWriterEditor.setContent(text);
    } else {
      var editor = document.getElementById('editor');
      if (editor) editor.value = text;
    }

    var textarea = document.getElementById('editor');
    var wysiwyg = document.getElementById('wysiwyg-editor');
    if (textarea) textarea.dispatchEvent(new Event('input', { bubbles: true }));
    if (wysiwyg) wysiwyg.dispatchEvent(new Event('input', { bubbles: true }));
  }, DAILY_PROOF_TEXT);
}

async function expectEditorFocus(page) {
  await page.waitForFunction(() => {
    var active = document.activeElement;
    return !!active && (active.id === 'wysiwyg-editor' || active.id === 'editor');
  });
}

test.describe('A2 daily writing proof', () => {
  test('keeps writing status, sections, Reader, and floating memo as a safe daily flow', async ({ page }) => {
    await page.goto('/index.html?reset=1');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#editor', { state: 'attached', timeout: 10000 });
    await ensureNormalMode(page);

    const richEditor = page.locator('#wysiwyg-editor');
    await expect(richEditor).toBeVisible();
    await richEditor.focus();

    await setDailyProofContent(page);

    const chip = page.locator('#writing-status-chip');
    await expect(chip).toBeVisible();
    await expect(chip).toContainText('編集中');
    await expect(chip).toHaveAttribute('data-save-state', 'editing');
    await expect(chip).toContainText(/保存済み \d{2}:\d{2}/, { timeout: 2500 });
    await expect(chip).toHaveAttribute('data-save-state', 'saved');
    await expect(chip).toHaveAttribute('data-last-saved-at', /\d{4}-\d{2}-\d{2}T/);
    await expect(chip).toContainText('文字数:');

    await openSidebarGroup(page, 'sections');
    await expect(page.locator('#sections-gadgets-panel')).toBeVisible();
    await expect(page.locator('.sections-node-title').filter({ hasText: 'A2 Daily Proof' })).toBeVisible();
    await expect(page.locator('.sections-node-title').filter({ hasText: 'セクション確認' })).toBeVisible();

    await page.evaluate(() => {
      if (window.ZWReaderPreview && typeof window.ZWReaderPreview.enter === 'function') {
        window.ZWReaderPreview.enter();
      }
    });
    await expect(page.locator('html')).toHaveAttribute('data-reader-overlay-open', 'true');
    await expect(page.locator('#reader-preview .reader-preview__content')).toContainText('保存安心感');
    await expect(chip).toBeHidden();

    await page.locator('#reader-back-fab').click();
    await expect(page.locator('html')).not.toHaveAttribute('data-reader-overlay-open', 'true');
    await expectEditorFocus(page);

    await page.evaluate(() => {
      if (window.ZWFloatingMemoField && typeof window.ZWFloatingMemoField.open === 'function') {
        window.ZWFloatingMemoField.open();
      }
    });
    const memoLab = page.locator('#memo-field-lab');
    await expect(memoLab).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-reader-overlay-open', 'true');
    await expect(chip).toBeHidden();

    await page.getByRole('button', { name: '浮遊メモ実験を閉じる' }).click();
    await expect(memoLab).toBeHidden();
    await expect(chip).toBeVisible();
    await expectEditorFocus(page);

    const finalState = await page.evaluate(() => {
      return {
        value: window.ZenWriterEditor && typeof window.ZenWriterEditor.getEditorValue === 'function'
          ? window.ZenWriterEditor.getEditorValue()
          : '',
        memoOpen: document.documentElement.getAttribute('data-memo-lab-open') === 'true',
        readerOpen: document.documentElement.getAttribute('data-reader-overlay-open') === 'true'
      };
    });
    expect(finalState.value).toContain('A2 Daily Proof');
    expect(finalState.value).toContain('セクション確認');
    expect(finalState.memoOpen).toBe(false);
    expect(finalState.readerOpen).toBe(false);
  });
});
