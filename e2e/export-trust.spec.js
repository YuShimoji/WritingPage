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
  await page.waitForSelector('#documents-io-menu-btn', { state: 'visible', timeout: 10000 });
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

async function importProjectJsonFromUi(page, filePath) {
  await openDocumentsIoMenu(page);
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('menuitem', { name: 'JSON読み込み' }).click()
  ]);
  await chooser.setFiles(filePath);
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
      chapters: docs
        .filter(function (d) { return d && d.type === 'chapter' && d.parentId === docId; })
        .sort(function (a, b) { return (a.order || 0) - (b.order || 0); })
        .map(function (ch) {
          return {
            name: ch.name,
            content: ch.content || '',
            level: ch.level || 2,
            visibility: ch.visibility || 'visible'
          };
        })
    };
  });
}

async function getCanonicalEditorValue(page) {
  return normalizeNewlines(await page.evaluate(() => {
    return window.ZenWriterEditor && typeof window.ZenWriterEditor.getEditorValue === 'function'
      ? window.ZenWriterEditor.getEditorValue()
      : '';
  }));
}

test.describe('Export Trust Proof', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html?reset=1');
    await page.waitForLoadState('networkidle');
    await ensureNormalMode(page);
  });

  test('TXT and JSON downloads preserve daily rich editing content and import roundtrip', async ({ page }, testInfo) => {
    const unique = 'export-trust-daily-2026-05-13-7f4b2c';
    const title = 'Export Trust Daily 2026-05-13';
    const importedTitle = title + ' (読み込み 2)';
    const body = [
      'Export Trust Proof document',
      '通常本文: daily export proof line.',
      '日本語本文: 保存と書き出しの信頼を確認する。',
      '記号: !? # % & < > " \' | / \\ [ ] { } ' + unique,
      '',
      '空行後の本文: 改行が潰れないこと。'
    ].join('\n');

    await createDocumentFromUi(page, title);
    await setRichEditingContent(page, body);
    await waitUntilSaved(page);
    const canonicalBeforeExport = await getCanonicalEditorValue(page);
    expect(canonicalBeforeExport).toContain(unique);
    expect(canonicalBeforeExport).toContain('日本語本文: 保存と書き出しの信頼を確認する。');
    expect(canonicalBeforeExport).toContain('記号: !? # % & < > " \' | /');

    const txt = await downloadFromDocumentsIo(page, 'TXT書き出し', testInfo, 'daily-export.txt');
    const txtBody = normalizeNewlines(txt.text);
    expect(txtBody).toBe(canonicalBeforeExport);
    expect(txtBody).toContain(unique);
    expect(txtBody).toMatch(/書き出しの信頼を確認する。[ \t]*\n記号:/);
    expect(txtBody).toMatch(new RegExp(unique + '\\s+空行後の本文'));

    const json = await downloadFromDocumentsIo(page, 'JSON書き出し', testInfo, 'daily-export.zwp.json');
    const project = JSON.parse(json.text);
    expect(project.format).toBe('zenwriter-v1');
    expect(project.document.id).toMatch(/^doc_/);
    expect(project.document.name).toBe(title);
    expect(normalizeNewlines(project.document.content)).toBe(canonicalBeforeExport);
    expect(normalizeNewlines(project.document.content)).toContain(unique);
    expect(normalizeNewlines(project.document.content)).toMatch(new RegExp(unique + '\\s+空行後の本文'));
    expect(Array.isArray(project.pages)).toBe(true);

    await importProjectJsonFromUi(page, json.path);
    await page.waitForFunction((needle) => {
      return window.ZenWriterEditor &&
        typeof window.ZenWriterEditor.getEditorValue === 'function' &&
        window.ZenWriterEditor.getEditorValue().indexOf(needle) >= 0;
    }, unique);
    const imported = await getCurrentDocState(page);
    expect(imported.name).toBe(importedTitle);
    expect(normalizeNewlines(imported.editorValue)).toContain(unique);
    expect(normalizeNewlines(imported.content)).toContain('空行後の本文');
    const canonicalAfterImport = await getCanonicalEditorValue(page);

    await page.evaluate(() => {
      if (window.ZWReaderPreview && typeof window.ZWReaderPreview.enter === 'function') {
        window.ZWReaderPreview.enter();
      }
    });
    await expect(page.locator('html')).toHaveAttribute('data-reader-overlay-open', 'true');
    await page.locator('#reader-back-fab').click();
    await expect(page.locator('html')).not.toHaveAttribute('data-reader-overlay-open', 'true');
    await expect(page.locator('#wysiwyg-editor')).toBeFocused();

    const txtAfterReader = await downloadFromDocumentsIo(page, 'TXT書き出し', testInfo, 'daily-after-reader.txt');
    expect(normalizeNewlines(txtAfterReader.text)).toBe(canonicalAfterImport);

    const jsonAfterReader = await downloadFromDocumentsIo(page, 'JSON書き出し', testInfo, 'daily-after-reader.zwp.json');
    const projectAfterReader = JSON.parse(jsonAfterReader.text);
    expect(projectAfterReader.document.name).toBe(importedTitle);
    expect(normalizeNewlines(projectAfterReader.document.content)).toBe(canonicalAfterImport);
    expect(normalizeNewlines(projectAfterReader.document.content)).toContain(unique);

    const duplicateIds = await page.evaluate(() => {
      var counts = {};
      document.querySelectorAll('[id]').forEach(function (el) {
        counts[el.id] = (counts[el.id] || 0) + 1;
      });
      return Object.keys(counts).filter(function (id) { return counts[id] > 1; });
    });
    expect(duplicateIds).toEqual([]);
  });

  test('JSON download preserves explicit chapter structure', async ({ page }, testInfo) => {
    const title = 'Export Trust Structured 2026-05-13';
    const importedTitle = title + ' (読み込み 2)';
    const chapterA = '構造章A';
    const chapterB = '構造章B';
    const bodyA = '章A本文: JSON pages に残る。token=chapter-a-8d1';
    const bodyB = '章B本文: 記号 <> & と改行\n\n二段落目 token=chapter-b-4e2';

    await createDocumentFromUi(page, title);
    await page.evaluate(({ a, b, body1, body2 }) => {
      var S = window.ZenWriterStorage;
      var Store = window.ZWChapterStore;
      var docId = S && typeof S.getCurrentDocId === 'function' ? S.getCurrentDocId() : null;
      if (!S || !Store || !docId) return;
      if (typeof Store.ensureChapterMode === 'function') Store.ensureChapterMode(docId);
      (Store.getChaptersForDoc(docId) || []).forEach(function (ch) {
        if (typeof Store.deleteChapter === 'function') Store.deleteChapter(ch.id);
      });
      Store.createChapter(docId, a, body1, null, 2);
      Store.createChapter(docId, b, body2, null, 3);
      var docs = S.loadDocuments() || [];
      var doc = docs.find(function (d) { return d && d.id === docId; });
      if (doc) doc.content = '';
      S.saveDocuments(docs);
    }, { a: chapterA, b: chapterB, body1: bodyA, body2: bodyB });

    const json = await downloadFromDocumentsIo(page, 'JSON書き出し', testInfo, 'structured-export.zwp.json');
    const project = JSON.parse(json.text);
    expect(project.document.name).toBe(title);
    expect(normalizeNewlines(project.document.content)).toContain('## ' + chapterA);
    expect(normalizeNewlines(project.document.content)).toContain('### ' + chapterB);
    expect(project.pages).toHaveLength(2);
    expect(project.pages[0]).toMatchObject({
      title: chapterA,
      content: bodyA,
      order: 0,
      level: 2,
      visibility: 'visible'
    });
    expect(project.pages[1]).toMatchObject({
      title: chapterB,
      content: bodyB,
      order: 1,
      level: 3,
      visibility: 'visible'
    });

    const roundTrip = await page.evaluate((text) => {
      var S = window.ZenWriterStorage;
      var importedId = S.importProjectJSON(text);
      var docs = S.loadDocuments() || [];
      return {
        importedName: (docs.find(function (d) { return d && d.id === importedId; }) || {}).name || '',
        chapters: docs
          .filter(function (d) { return d && d.type === 'chapter' && d.parentId === importedId; })
          .sort(function (a, b) { return (a.order || 0) - (b.order || 0); })
          .map(function (ch) {
            return {
              name: ch.name,
              content: ch.content || '',
              level: ch.level || 2,
              visibility: ch.visibility || 'visible'
            };
          })
      };
    }, json.text);

    expect(roundTrip.importedName).toBe(importedTitle);
    expect(roundTrip.chapters).toHaveLength(2);
    expect(roundTrip.chapters[0]).toMatchObject({ name: chapterA, content: bodyA, level: 2 });
    expect(roundTrip.chapters[1]).toMatchObject({ name: chapterB, content: bodyB, level: 3 });
  });
});
