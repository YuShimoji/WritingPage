// @ts-check
const { test, expect } = require('@playwright/test');
const { ensureNormalMode, openSidebarGroup, setupChapterModeChapters } = require('./helpers');

async function resetDocumentsForFirstUse(page) {
  await page.evaluate(() => {
    var S = window.ZenWriterStorage;
    if (S && typeof S.saveDocuments === 'function') S.saveDocuments([]);
    if (S && typeof S.setCurrentDocId === 'function') S.setCurrentDocId(null);
    window.dispatchEvent(new CustomEvent('ZWDocumentsChanged'));
  });
}

async function openStructurePanel(page) {
  await ensureNormalMode(page);
  await openSidebarGroup(page, 'structure');
  await page.waitForSelector('#documents-save-help', { state: 'visible', timeout: 10000 });
}

async function createDocumentFromUi(page, title) {
  await openStructurePanel(page);
  page.once('dialog', async (dialog) => {
    expect(dialog.type()).toBe('prompt');
    await dialog.accept(title);
  });
  await page.locator('#new-document-btn').click();
  await expect(page.locator('.documents-tree-container')).toContainText(title);
}

async function setRichEditingContent(page, text) {
  await expect(page.locator('#wysiwyg-editor')).toBeVisible();
  await page.evaluate((value) => {
    if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function') {
      window.ZenWriterEditor.setContent(value);
    }
    var editor = document.getElementById('editor');
    var wysiwyg = document.getElementById('wysiwyg-editor');
    if (editor) editor.dispatchEvent(new Event('input', { bubbles: true }));
    if (wysiwyg) wysiwyg.dispatchEvent(new Event('input', { bubbles: true }));
  }, text);
}

async function waitUntilSaved(page) {
  const chip = page.locator('#writing-status-chip');
  await expect(chip).toBeVisible();
  await expect(chip).toHaveAttribute('data-save-state', 'saved', { timeout: 5000 });
  await expect(chip).toContainText('保存済み');
}

async function openDocumentsIoMenu(page) {
  await openStructurePanel(page);
  const menu = page.locator('#documents-io-menu');
  if (await menu.isVisible().catch(() => false)) return;
  await page.locator('#documents-io-menu-btn').click();
  await expect(menu).toBeVisible();
}

test.describe('First-use Save Help', () => {
  test.use({
    storageState: {
      cookies: [],
      origins: [{
        origin: 'http://127.0.0.1:9080',
        localStorage: []
      }]
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html?reset=1');
    await page.waitForLoadState('networkidle');
    await ensureNormalMode(page);
    await expect(page.locator('#wysiwyg-editor')).toBeVisible({ timeout: 10000 });
    await resetDocumentsForFirstUse(page);
  });

  test('keeps the local autosave, Documents, and export/import meaning visible', async ({ page }) => {
    const title = 'First-use Save Help 2026-05-14';
    const body = [
      'First-use save help body',
      '日本語本文: この端末の自動保存を確認する。',
      '記号: !? # % & < > " \' | / \\ [ ] { }',
      'first-use-save-help-token-8c31'
    ].join('\n');

    await openStructurePanel(page);
    const help = page.locator('#documents-save-help');
    await expect(help).toContainText('本文と章構造はこの端末に自動保存');
    await expect(help).toContainText('保存状態は画面下で確認できます');
    await expect(help).toContainText('TXT/JSON書き出しは外部退避');
    await expect(help).toContainText('JSON読み込みで戻せます');
    await expect(page.locator('.documents-empty-state')).toContainText('ドキュメントがありません');
    await expect(page.locator('.documents-empty-state')).toContainText('+ 文書で始めると、この端末へ自動保存されます。');

    const chip = page.locator('#writing-status-chip');
    await expect(chip).toHaveAttribute('aria-label', /本文はこの端末に自動保存されます/);
    await expect(chip).toHaveAttribute('aria-label', /保存状態はこの表示で確認できます/);

    await createDocumentFromUi(page, title);
    await setRichEditingContent(page, body);
    await waitUntilSaved(page);
    await expect(chip).toHaveAttribute('aria-label', /文字数: \d+ · 保存済み/);
    await expect(chip).toHaveAttribute('aria-label', /この端末に自動保存/);

    await openStructurePanel(page);
    await expect(page.locator('.documents-tree-container')).toContainText(title);

    await openDocumentsIoMenu(page);
    const menu = page.locator('#documents-io-menu');
    await expect(menu.locator('.zw-shell-menu__hint')).toContainText('書き出しは外部退避。JSON読み込みで戻せます。');
    await expect(page.getByRole('menuitem', { name: 'TXT書き出し' })).toHaveAttribute('title', /外部退避用に現在の本文/);
    await expect(page.getByRole('menuitem', { name: 'JSON書き出し' })).toHaveAttribute('title', /本文と章構造をJSONで書き出し/);
    await expect(page.getByRole('menuitem', { name: 'JSON読み込み' })).toHaveAttribute('title', /書き出したJSONプロジェクトを戻す/);
    await expect(menu).not.toContainText('JSON保存');

    await setupChapterModeChapters(page, [
      { title: '第1章 保存ヘルプの朝', content: '章本文A first-use-chapter-a' },
      { title: '第2章 書き出しヘルプの夜', content: '章本文B first-use-chapter-b' }
    ]);
    await openStructurePanel(page);
    await expect(help).toContainText('本文と章構造はこの端末に自動保存');
    await openDocumentsIoMenu(page);
    await expect(page.getByRole('menuitem', { name: 'JSON書き出し' })).toHaveAttribute('title', /章構造/);

    const chapterCount = await page.evaluate(() => {
      var S = window.ZenWriterStorage;
      var Store = window.ZWChapterStore;
      var rawId = S && typeof S.getCurrentDocId === 'function' ? S.getCurrentDocId() : null;
      var docs = S && typeof S.loadDocuments === 'function' ? (S.loadDocuments() || []) : [];
      var docId = rawId && Store && typeof Store.resolveParentDocumentId === 'function'
        ? Store.resolveParentDocumentId(rawId, docs)
        : rawId;
      return Store && docId && typeof Store.getChaptersForDoc === 'function'
        ? (Store.getChaptersForDoc(docId) || []).length
        : 0;
    });
    expect(chapterCount).toBe(2);
  });
});
