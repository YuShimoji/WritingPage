// @ts-check
const { test, expect } = require('@playwright/test');
const { ensureNormalMode, openSidebarGroup, enterDocumentName } = require('./helpers');

function normalizeNewlines(text) {
  return String(text || '').replace(/\r\n/g, '\n');
}

async function openStructurePanel(page) {
  await ensureNormalMode(page);
  await openSidebarGroup(page, 'structure');
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

async function constrainSidebarWidth(page, widthPx) {
  await page.evaluate((width) => {
    var sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.style.width = width + 'px';
    document.documentElement.style.setProperty('--sidebar-width', width + 'px');
  }, widthPx);
}

async function getCurrentMarkerMetrics(page, title) {
  const row = activeDocumentRow(page, title);
  await expect(row).toBeVisible();
  return row.evaluate((el) => {
    var label = el.querySelector('.tree-label');
    var marker = el.querySelector('.tree-current-marker');
    var rowRect = el.getBoundingClientRect();
    var labelRect = label ? label.getBoundingClientRect() : { width: 0, right: 0 };
    var markerRect = marker ? marker.getBoundingClientRect() : { width: 0, left: 0 };
    return {
      rowWidth: Math.round(rowRect.width),
      rowClientWidth: el.clientWidth,
      rowScrollWidth: el.scrollWidth,
      labelWidth: Math.round(labelRect.width),
      markerWidth: Math.round(markerRect.width),
      labelBeforeMarker: !!(label && marker && labelRect.right <= markerRect.left + 1),
      markerText: marker ? (marker.textContent || '').trim() : ''
    };
  });
}

function expectReadableMarkerMetrics(metrics) {
  expect(metrics.markerText).toBe('現在');
  expect(metrics.markerWidth).toBeGreaterThan(20);
  expect(metrics.markerWidth).toBeLessThanOrEqual(48);
  expect(metrics.labelWidth).toBeGreaterThanOrEqual(56);
  expect(metrics.labelBeforeMarker).toBe(true);
  expect(metrics.rowScrollWidth).toBeLessThanOrEqual(metrics.rowClientWidth + 2);
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
  const acceptSaveConfirmation = dialog => dialog.accept();
  page.on('dialog', acceptSaveConfirmation);
  await page.locator('#new-document-btn').click();
  await enterDocumentName(page, title);
  await expect(page.locator('.documents-tree-container')).toContainText(title);
  page.off('dialog', acceptSaveConfirmation);
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

  test('opens a saved manuscript from the document tree after the document list migrated to IndexedDB', async ({ page, context }) => {
    await page.goto('/index.html');
    await openStructurePanel(page);
    const first = await getCurrentDocumentState(page);
    const title = '確認用原稿';
    const body = '本文の続きをここに書けます。';
    await page.evaluate(async ({ title, body }) => {
      const storage = window.ZenWriterStorage;
      await storage.initIDB();
      storage.createDocument(title, body);
      await window.ZenWriterIDB.migrateFromLocalStorage();
    }, { title, body });
    expect(await page.evaluate(() => localStorage.getItem('zenWriter_docs'))).toBeNull();

    const reopened = await context.newPage();
    await reopened.goto('/index.html');
    await openStructurePanel(reopened);
    await expectCurrentDocumentVisible(reopened, first.name);
    expect((await getCurrentDocumentState(reopened)).docId).toBe(first.docId);
    const sample = documentRow(reopened, title);
    await expect(sample).toBeVisible();
    expect((await getCurrentDocumentState(reopened)).docs).toHaveLength(2);
    await sample.click();
    await expectCurrentDocumentVisible(reopened, title);
    await expect(reopened.locator('#wysiwyg-editor')).toBeFocused();
    await expect(reopened.locator('#wysiwyg-editor')).toHaveText(body);
  });

  test('keeps daily document identity, switching, resume, and export retreat route visible', async ({ page }) => {
    const firstSentence = '朝の文書に一文を残す。';
    const secondTitle = 'Daily Lifecycle Focus Return 2026-07-07 長い文書名';
    const secondSentence = '夜の文書には別の一文を書く。';

    await page.goto('/index.html?reset=1');
    await page.waitForLoadState('networkidle');
    await ensureNormalMode(page);
    await expect(page.locator('#wysiwyg-editor')).toBeVisible({ timeout: 10000 });

    await openStructurePanel(page);
    await expect(page.locator('#documents-io-menu-btn')).toBeVisible();

    const firstDoc = await getCurrentDocumentState(page);
    expect(firstDoc.docId).toBeTruthy();
    expect(firstDoc.name).toBeTruthy();
    await expectCurrentDocumentVisible(page, firstDoc.name);

    await writeInEditor(page, firstSentence);
    await saveFromDocumentsPanel(page);

    await createDocumentFromUi(page, secondTitle);
    await expect(page.locator('#wysiwyg-editor')).toBeFocused();
    expect((await getCurrentDocumentState(page)).editorValue).toBe('');
    await writeInEditor(page, secondSentence);
    await saveFromDocumentsPanel(page);
    expectReadableMarkerMetrics(await getCurrentMarkerMetrics(page, secondTitle));
    await constrainSidebarWidth(page, 240);
    await expectCurrentDocumentVisible(page, secondTitle);
    expectReadableMarkerMetrics(await getCurrentMarkerMetrics(page, secondTitle));

    await documentRow(page, firstDoc.name).click();
    await expectCurrentDocumentVisible(page, firstDoc.name);
    await expect(page.locator('#wysiwyg-editor')).toBeFocused();
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
