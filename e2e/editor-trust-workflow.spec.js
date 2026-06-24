// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs/promises');
const path = require('path');
const { ensureNormalMode } = require('./helpers');

function normalizeNewlines(text) {
  return String(text || '').replace(/\r\n/g, '\n');
}

async function openStructurePanel(page) {
  await page.evaluate(() => {
    if (window.ZenWriterApp && typeof window.ZenWriterApp.setUIMode === 'function') {
      window.ZenWriterApp.setUIMode('normal');
    }
    var sidebar = document.getElementById('sidebar');
    if (sidebar && !sidebar.classList.contains('open') &&
        window.sidebarManager && typeof window.sidebarManager.forceSidebarState === 'function') {
      window.sidebarManager.forceSidebarState(true);
    }
    if (window.sidebarManager && typeof window.sidebarManager.activateSidebarGroup === 'function') {
      window.sidebarManager.activateSidebarGroup('structure');
    }
  });
  await page.waitForSelector('#documents-save-current-btn', { state: 'visible', timeout: 10000 });
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

async function getCurrentDocState(page) {
  return page.evaluate(() => {
    var S = window.ZenWriterStorage;
    var Store = window.ZWChapterStore;
    var rawId = S && typeof S.getCurrentDocId === 'function' ? S.getCurrentDocId() : null;
    var docs = S && typeof S.loadDocuments === 'function' ? (S.loadDocuments() || []) : [];
    var docId = rawId && Store && typeof Store.resolveParentDocumentId === 'function'
      ? Store.resolveParentDocumentId(rawId, docs)
      : rawId;
    var doc = docs.find(function (d) { return d && d.id === docId; }) || null;
    return {
      rawId: rawId,
      docId: docId,
      name: doc ? doc.name : '',
      content: doc ? doc.content || '' : '',
      editorValue: window.ZenWriterEditor && typeof window.ZenWriterEditor.getEditorValue === 'function'
        ? window.ZenWriterEditor.getEditorValue()
        : '',
      docs: docs.map(function (d) {
        return {
          id: d.id,
          type: d.type,
          parentId: d.parentId || null,
          name: d.name,
          content: d.content || '',
          order: d.order,
          level: d.level,
          visibility: d.visibility
        };
      }),
      chapters: docs
        .filter(function (d) { return d && d.type === 'chapter' && d.parentId === docId; })
        .sort(function (a, b) { return (a.order || 0) - (b.order || 0); })
        .map(function (ch) {
          return {
            id: ch.id,
            name: ch.name,
            content: ch.content || '',
            order: ch.order,
            level: ch.level || 2,
            visibility: ch.visibility || 'visible'
          };
        })
    };
  });
}

async function openDocumentsIoMenu(page) {
  await openStructurePanel(page);
  await page.locator('#documents-io-menu-btn').click();
  await expect(page.locator('#documents-io-menu')).toBeVisible();
}

async function downloadFromDocumentsIo(page, label, testInfo, filename) {
  await openDocumentsIoMenu(page);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('menuitem', { name: label }).click()
  ]);
  const target = path.join(testInfo.outputDir, filename);
  await download.saveAs(target);
  return {
    suggestedFilename: download.suggestedFilename(),
    path: target,
    text: await fs.readFile(target, 'utf8')
  };
}

async function downloadMarkdownViaEditor(page, testInfo, filename) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.evaluate(() => {
      window.ZenWriterEditor.exportAsMarkdown();
    })
  ]);
  const target = path.join(testInfo.outputDir, filename);
  await download.saveAs(target);
  return {
    suggestedFilename: download.suggestedFilename(),
    path: target,
    text: await fs.readFile(target, 'utf8')
  };
}

async function importProjectJsonFromUi(page, filePath) {
  await openDocumentsIoMenu(page);
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('menuitem', { name: 'JSON読み込み' }).click()
  ]);
  await chooser.setFiles(filePath);
}

test.describe('Editor Trust Vertical Slice', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html?reset=1');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      window.history.replaceState(null, '', '/index.html');
    });
    await ensureNormalMode(page);
    await expect(page.locator('#wysiwyg-editor')).toBeVisible({ timeout: 10000 });
  });

  test('saves, resumes, exports, imports, and fails safely without losing the current project', async ({ page }, testInfo) => {
    const title = 'Editor Trust 2026-06-15';
    const explicitToken = 'editor-trust-explicit-1f52';
    const autoToken = 'editor-trust-auto-8c41';
    const chapterAToken = 'editor-trust-chapter-a-30ab';
    const chapterBToken = 'editor-trust-chapter-b-77df';
    const explicitBody = [
      'Editor Trust explicit save body.',
      '日本語本文: 明示保存後の復帰確認。',
      'token=' + explicitToken
    ].join('\n');
    const autoBody = [
      'Editor Trust autosave body.',
      '日本語本文: 自動保存後の reload 復帰確認。',
      'token=' + autoToken
    ].join('\n');

    await openStructurePanel(page);
    await expect(page.locator('#documents-save-help')).toContainText('この端末に自動保存');
    await expect(page.locator('#documents-save-help')).toContainText('外部退避');
    await page.locator('#documents-io-menu-btn').click();
    await expect(page.locator('#documents-io-menu')).toContainText('書き出しは外部退避');
    await page.keyboard.press('Escape');

    await createDocumentFromUi(page, title);
    await setRichEditingContent(page, explicitBody);
    await expect(page.locator('#writing-status-chip')).toHaveAttribute('data-save-state', 'editing');
    await openStructurePanel(page);
    await page.locator('#documents-save-current-btn').click();
    await waitUntilSaved(page);

    await page.reload({ waitUntil: 'networkidle' });
    await ensureNormalMode(page);
    await expect(page.locator('#wysiwyg-editor')).toBeVisible({ timeout: 10000 });
    await page.waitForFunction((needle) => {
      return window.ZenWriterEditor &&
        typeof window.ZenWriterEditor.getEditorValue === 'function' &&
        window.ZenWriterEditor.getEditorValue().indexOf(needle) >= 0;
    }, explicitToken);
    let current = await getCurrentDocState(page);
    expect(current.name).toBe(title);
    expect(normalizeNewlines(current.editorValue)).toContain(explicitToken);

    await page.evaluate(() => {
      window.__editorTrustOriginalSaveContent = window.ZenWriterStorage.saveContent;
      window.ZenWriterStorage.saveContent = function () { return false; };
    });
    await setRichEditingContent(page, 'This save is expected to fail.');
    await expect(page.locator('#writing-status-chip')).toHaveAttribute('data-save-state', 'failed', { timeout: 3000 });
    await expect(page.locator('#writing-status-chip')).toContainText('保存失敗');
    await expect(page.locator('.mini-hud')).toContainText('保存失敗', { timeout: 3000 });
    await page.evaluate(() => {
      window.ZenWriterStorage.saveContent = window.__editorTrustOriginalSaveContent;
      delete window.__editorTrustOriginalSaveContent;
    });

    await setRichEditingContent(page, autoBody);
    await waitUntilSaved(page);
    await page.reload({ waitUntil: 'networkidle' });
    await ensureNormalMode(page);
    await page.waitForFunction((needle) => {
      return window.ZenWriterEditor &&
        typeof window.ZenWriterEditor.getEditorValue === 'function' &&
        window.ZenWriterEditor.getEditorValue().indexOf(needle) >= 0;
    }, autoToken);
    current = await getCurrentDocState(page);
    expect(current.name).toBe(title);
    expect(normalizeNewlines(current.editorValue)).toContain(autoToken);

    const chapterSetup = await page.evaluate(({ aToken, bToken }) => {
      var S = window.ZenWriterStorage;
      var Store = window.ZWChapterStore;
      var docs = S.loadDocuments() || [];
      var rawId = S.getCurrentDocId();
      var docId = Store.resolveParentDocumentId(rawId, docs);
      Store.ensureChapterMode(docId);
      (Store.getChaptersForDoc(docId) || []).forEach(function (chapter) {
        Store.deleteChapter(chapter.id);
      });
      var a = Store.createChapter(docId, '信頼章 A', 'A body ' + aToken, null, 2);
      var b = Store.createChapter(docId, '信頼章 B', 'B body ' + bToken, a.id, 2);
      S.setCurrentDocId(a.id);
      return {
        docId: docId,
        rawId: S.getCurrentDocId(),
        resolvedId: Store.resolveParentDocumentId(S.getCurrentDocId(), S.loadDocuments() || []),
        chapterIds: [a.id, b.id]
      };
    }, { aToken: chapterAToken, bToken: chapterBToken });
    expect(chapterSetup.rawId).toBe(chapterSetup.chapterIds[0]);
    expect(chapterSetup.resolvedId).toBe(chapterSetup.docId);

    const txt = await downloadFromDocumentsIo(page, 'TXT書き出し', testInfo, 'editor-trust.txt');
    const txtBody = normalizeNewlines(txt.text);
    expect(txtBody).toContain(chapterAToken);
    expect(txtBody).toContain(chapterBToken);

    const markdown = await downloadMarkdownViaEditor(page, testInfo, 'editor-trust.md');
    const markdownBody = normalizeNewlines(markdown.text);
    expect(markdownBody).toContain(chapterAToken);
    expect(markdownBody).toContain(chapterBToken);

    const json = await downloadFromDocumentsIo(page, 'JSON書き出し', testInfo, 'editor-trust.zwp.json');
    const project = JSON.parse(json.text);
    expect(project.format).toBe('zenwriter-v1');
    expect(project.document.id).toBe(chapterSetup.docId);
    expect(project.document.name).toBe(title);
    expect(project.pages).toHaveLength(2);
    expect(project.pages[0]).toMatchObject({ title: '信頼章 A', content: 'A body ' + chapterAToken });
    expect(project.pages[1]).toMatchObject({ title: '信頼章 B', content: 'B body ' + chapterBToken });

    const beforeBadImport = await getCurrentDocState(page);
    const invalidPath = path.join(testInfo.outputDir, 'broken-editor-trust.zwp.json');
    await fs.writeFile(invalidPath, '{ broken json', 'utf8');
    await importProjectJsonFromUi(page, invalidPath);
    await expect(page.locator('.mini-hud')).toContainText('現在の文書は保持されています', { timeout: 3000 });
    const afterBadImport = await getCurrentDocState(page);
    expect(afterBadImport.docId).toBe(beforeBadImport.docId);
    expect(afterBadImport.rawId).toBe(beforeBadImport.rawId);
    expect(JSON.stringify(afterBadImport.docs)).toBe(JSON.stringify(beforeBadImport.docs));

    await importProjectJsonFromUi(page, json.path);
    await page.waitForFunction(({ importedTitle, aToken, bToken }) => {
      var S = window.ZenWriterStorage;
      var Store = window.ZWChapterStore;
      var docs = S.loadDocuments() || [];
      var rawId = S.getCurrentDocId();
      var docId = Store.resolveParentDocumentId(rawId, docs);
      var doc = docs.find(function (d) { return d && d.id === docId; });
      var chapters = Store.getChaptersForDoc(docId) || [];
      return doc && doc.name === importedTitle &&
        chapters.length === 2 &&
        String(chapters[0].content || '').indexOf(aToken) >= 0 &&
        String(chapters[1].content || '').indexOf(bToken) >= 0;
    }, {
      importedTitle: title + ' (読み込み 2)',
      aToken: chapterAToken,
      bToken: chapterBToken
    });
    const imported = await getCurrentDocState(page);
    expect(imported.name).toBe(title + ' (読み込み 2)');
    expect(imported.docId).not.toBe(chapterSetup.docId);
    expect(imported.chapters).toHaveLength(2);
    expect(imported.docs.some((doc) => doc.id === chapterSetup.docId && doc.name === title)).toBe(true);
  });
});
