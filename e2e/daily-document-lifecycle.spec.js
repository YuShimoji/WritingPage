// @ts-check
const { test, expect } = require('@playwright/test');
const { ensureNormalMode, openSidebarGroup } = require('./helpers');

function normalizeNewlines(text) {
  return String(text || '').replace(/\r\n/g, '\n');
}

async function openStructurePanel(page) {
  await ensureNormalMode(page);
  await openSidebarGroup(page, 'structure');
  await page.waitForSelector('#documents-save-help', { state: 'visible', timeout: 10000 });
  await page.waitForSelector('.documents-tree-container', { state: 'visible', timeout: 10000 });
}

async function getCurrentDocumentState(page) {
  return page.evaluate(() => {
    var S = window.ZenWriterStorage;
    var Store = window.ZWChapterStore;
    var rawId = S && typeof S.getCurrentDocId === 'function' ? S.getCurrentDocId() : null;
    var docs = S && typeof S.loadDocuments === 'function' ? (S.loadDocuments() || []) : [];
    var docId = rawId && Store && typeof Store.resolveParentDocumentId === 'function'
      ? Store.resolveParentDocumentId(rawId, docs)
      : rawId;
    var doc = docs.find(function (item) { return item && item.id === docId; }) || null;
    return {
      rawId: rawId,
      docId: docId,
      name: doc && doc.name ? doc.name : '',
      content: doc ? doc.content || '' : '',
      docs: docs
        .filter(function (item) { return item && item.type === 'document'; })
        .map(function (item) {
          return {
            id: item.id,
            name: item.name || '',
            content: item.content || ''
          };
        }),
      editorValue: window.ZenWriterEditor && typeof window.ZenWriterEditor.getEditorValue === 'function'
        ? window.ZenWriterEditor.getEditorValue()
        : ''
    };
  });
}

function activeDocumentRow(page, title) {
  return page.locator('.documents-tree-container .tree-item-row.active').filter({ hasText: title });
}

function documentRow(page, title) {
  return page.locator('.documents-tree-container .tree-item').filter({ hasText: title }).locator('.tree-item-row').first();
}

async function expectCurrentDocumentVisible(page, title) {
  const row = activeDocumentRow(page, title);
  await expect(row).toBeVisible();
  await expect(row).toHaveAttribute('aria-current', 'page');
  await expect(row.locator('.tree-current-marker')).toHaveText('現在');
}

async function waitUntilSaved(page) {
  const chip = page.locator('#writing-status-chip');
  await expect(chip).toBeVisible();
  await expect(chip).toHaveAttribute('data-save-state', 'saved', { timeout: 5000 });
  await expect(chip).toContainText('保存済み');
}

async function writeInEditor(page, sentence) {
  const editor = page.locator('#wysiwyg-editor');
  await expect(editor).toBeVisible({ timeout: 10000 });
  await editor.click();
  await expect(editor).toBeFocused();
  await page.keyboard.insertText(sentence);
  await waitUntilSaved(page);
}

async function saveFromDocumentsPanel(page) {
  await openStructurePanel(page);
  await page.locator('#documents-save-current-btn').click();
  await waitUntilSaved(page);
}

async function createDocumentFromUi(page, title) {
  await openStructurePanel(page);
  var acceptedPrompt = false;
  const handler = async (dialog) => {
    if (dialog.type() === 'prompt') {
      acceptedPrompt = true;
      await dialog.accept(title);
      return;
    }
    await dialog.accept();
  };
  page.on('dialog', handler);
  await page.locator('#new-document-btn').click();
  await expect(page.locator('.documents-tree-container')).toContainText(title);
  page.off('dialog', handler);
  expect(acceptedPrompt).toBe(true);
  await expectCurrentDocumentVisible(page, title);
}

async function waitForEditorText(page, sentence) {
  await page.waitForFunction((needle) => {
    return window.ZenWriterEditor &&
      typeof window.ZenWriterEditor.getEditorValue === 'function' &&
      window.ZenWriterEditor.getEditorValue().indexOf(needle) >= 0;
  }, sentence);
  await expect(page.locator('#wysiwyg-editor')).toContainText(sentence);
}

test.describe('Daily document lifecycle comfort', () => {
  test.use({
    storageState: {
      cookies: [],
      origins: [{
        origin: 'http://127.0.0.1:9080',
        localStorage: []
      }]
    }
  });

  test('keeps daily document identity, switching, resume, and export retreat route visible', async ({ page }) => {
    const firstSentence = '朝の文書に一文を残す。';
    const secondTitle = 'Daily Lifecycle 2 2026-07-07';
    const secondSentence = '夜の文書には別の一文を書く。';

    await page.goto('/index.html?reset=1');
    await page.waitForLoadState('networkidle');
    await ensureNormalMode(page);
    await expect(page.locator('#wysiwyg-editor')).toBeVisible({ timeout: 10000 });

    await openStructurePanel(page);
    await expect(page.locator('#documents-save-help')).toContainText('本文と章構造はこの端末に自動保存');
    await expect(page.locator('#documents-save-help')).toContainText('TXT/JSON書き出しは外部退避');

    const firstDoc = await getCurrentDocumentState(page);
    expect(firstDoc.docId).toBeTruthy();
    expect(firstDoc.name).toBeTruthy();
    await expectCurrentDocumentVisible(page, firstDoc.name);

    await writeInEditor(page, firstSentence);
    await saveFromDocumentsPanel(page);

    await createDocumentFromUi(page, secondTitle);
    await writeInEditor(page, secondSentence);
    await saveFromDocumentsPanel(page);

    await documentRow(page, firstDoc.name).click();
    await expectCurrentDocumentVisible(page, firstDoc.name);
    await waitForEditorText(page, firstSentence);
    let state = await getCurrentDocumentState(page);
    expect(state.name).toBe(firstDoc.name);
    expect(normalizeNewlines(state.editorValue)).toContain(firstSentence);
    expect(normalizeNewlines(state.editorValue)).not.toContain(secondSentence);
    expect(state.docs.find((doc) => doc.name === secondTitle && normalizeNewlines(doc.content).includes(secondSentence))).toBeTruthy();

    await page.reload({ waitUntil: 'networkidle' });
    await ensureNormalMode(page);
    await waitForEditorText(page, firstSentence);
    await openStructurePanel(page);
    await expectCurrentDocumentVisible(page, firstDoc.name);
    await expect(page.locator('.documents-tree-container')).toContainText(secondTitle);
    state = await getCurrentDocumentState(page);
    expect(state.name).toBe(firstDoc.name);
    expect(normalizeNewlines(state.editorValue)).toContain(firstSentence);

    await page.locator('#documents-io-menu-btn').click();
    const menu = page.locator('#documents-io-menu');
    await expect(menu).toBeVisible();
    await expect(menu.locator('.zw-shell-menu__hint')).toContainText('書き出しは外部退避');
    await expect(page.getByRole('menuitem', { name: 'TXT書き出し' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'JSON書き出し' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'JSON読み込み' })).toBeVisible();
    await expect(menu).not.toContainText(/クラウド|アカウント|共有/);
  });
});
