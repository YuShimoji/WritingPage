// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs/promises');
const path = require('path');
const { ensureNormalMode, openSidebarGroup } = require('./helpers');

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

async function openSectionsPanel(page) {
  await ensureNormalMode(page);
  await openSidebarGroup(page, 'sections');
  await page.waitForSelector('#sections-add-chapter', { state: 'visible', timeout: 10000 });
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
    var chapters = docs
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
      });
    return {
      rawId: rawId,
      docId: docId,
      docName: doc ? doc.name : '',
      docContent: doc ? doc.content || '' : '',
      sync: document.documentElement.getAttribute('data-zw-chapter-editor-sync') || '',
      activeIndex: window.ZWChapterList && typeof window.ZWChapterList.getActiveIndex === 'function'
        ? window.ZWChapterList.getActiveIndex()
        : -1,
      editorValue: window.ZenWriterEditor && typeof window.ZenWriterEditor.getEditorValue === 'function'
        ? window.ZenWriterEditor.getEditorValue()
        : '',
      assembled: docId && Store && typeof Store.assembleFullText === 'function'
        ? Store.assembleFullText(docId)
        : '',
      chapters: chapters
    };
  });
}

async function addChapterFromSections(page, expectedCount, title) {
  await openSectionsPanel(page);
  await page.locator('#sections-add-chapter').click();
  await page.waitForFunction((count) => {
    var S = window.ZenWriterStorage;
    var Store = window.ZWChapterStore;
    if (!S || !Store) return false;
    var rawId = S.getCurrentDocId && S.getCurrentDocId();
    var docId = Store.resolveParentDocumentId ? Store.resolveParentDocumentId(rawId) : rawId;
    return (Store.getChaptersForDoc(docId) || []).length >= count;
  }, expectedCount);
  await page.waitForFunction(() => {
    return document.documentElement.getAttribute('data-zw-chapter-editor-sync') === 'slice';
  });
  await page.evaluate(({ count, title: nextTitle }) => {
    var S = window.ZenWriterStorage;
    var Store = window.ZWChapterStore;
    var rawId = S && S.getCurrentDocId && S.getCurrentDocId();
    var docId = Store && Store.resolveParentDocumentId ? Store.resolveParentDocumentId(rawId) : rawId;
    var chapters = Store && Store.getChaptersForDoc ? (Store.getChaptersForDoc(docId) || []) : [];
    var target = chapters[count - 1];
    if (target && typeof Store.renameChapter === 'function') {
      Store.renameChapter(target.id, nextTitle);
    }
    if (window.ZWChapterList && typeof window.ZWChapterList.navigateTo === 'function') {
      window.ZWChapterList.navigateTo(count - 1);
    }
    window.dispatchEvent(new CustomEvent('ZWChapterStoreChanged'));
  }, { count: expectedCount, title });
  await page.waitForFunction((needle) => {
    return Array.from(document.querySelectorAll('.sections-node-title'))
      .some(function (node) { return (node.textContent || '').trim() === needle; });
  }, title);
}

async function waitForChapterContent(page, title, needle) {
  await page.waitForFunction(({ title: chapterTitle, needle: bodyNeedle }) => {
    var S = window.ZenWriterStorage;
    var Store = window.ZWChapterStore;
    var rawId = S && S.getCurrentDocId && S.getCurrentDocId();
    var docId = Store && Store.resolveParentDocumentId ? Store.resolveParentDocumentId(rawId) : rawId;
    return (Store.getChaptersForDoc(docId) || []).some(function (ch) {
      return ch.name === chapterTitle && String(ch.content || '').indexOf(bodyNeedle) >= 0;
    });
  }, { title, needle }, { timeout: 6000 });
}

async function clickSectionTitle(page, title) {
  await openSectionsPanel(page);
  await page.evaluate((needle) => {
    var nodes = Array.from(document.querySelectorAll('.sections-tree-node'));
    for (var i = 0; i < nodes.length; i++) {
      var titleEl = nodes[i].querySelector('.sections-node-title');
      if (titleEl && (titleEl.textContent || '').trim() === needle) {
        nodes[i].click();
        return;
      }
    }
  }, title);
}

async function openDocumentsIoMenu(page) {
  await openStructurePanel(page);
  await page.locator('#documents-io-menu-btn').click();
  await expect(page.locator('#documents-io-menu')).toBeVisible();
}

async function downloadFromDocumentsIo(page, itemIndex, testInfo, filename) {
  await openDocumentsIoMenu(page);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#documents-io-menu [role="menuitem"]').nth(itemIndex).click()
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
    page.locator('#documents-io-menu [role="menuitem"]').nth(2).click()
  ]);
  await chooser.setFiles(filePath);
}

test.describe('Chapter Creation Daily Flow', () => {
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
  });

  test('creates chapters, resumes them, reads them, exports them, and imports them back', async ({ page }, testInfo) => {
    const title = 'Chapter Daily Flow 2026-05-13';
    const importedTitle = title + ' (読み込み 2)';
    const chapterA = '第1章 保存される朝';
    const chapterB = '第2章 書き出される夜';
    const tokenA = 'chapter-daily-a-7f31';
    const tokenB = 'chapter-daily-b-9c42';
    const bodyA = [
      '日本語本文: 朝の章は保存と再開を確認する。',
      '記号: !? # % & < > " \' | / \\ [ ] { }',
      '改行をまたぐ一意文字列 ' + tokenA,
      '',
      '第1章だけにある最終行。'
    ].join('\n');
    const bodyB = [
      '日本語本文: 夜の章は Reader と書き出しを確認する。',
      '記号: <> & " \' / \\ と JSON roundtrip。',
      '改行をまたぐ一意文字列 ' + tokenB,
      '',
      '第2章だけにある最終行。'
    ].join('\n');

    await createDocumentFromUi(page, title);

    await addChapterFromSections(page, 1, chapterA);
    await setRichEditingContent(page, bodyA);
    await waitForChapterContent(page, chapterA, tokenA);
    const storedBodyA = (await getCurrentDocState(page)).chapters[0].content;

    await addChapterFromSections(page, 2, chapterB);
    await setRichEditingContent(page, bodyB);
    await waitForChapterContent(page, chapterB, tokenB);
    const storedBodyB = (await getCurrentDocState(page)).chapters[1].content;

    await clickSectionTitle(page, chapterA);
    await page.waitForFunction((needle) => {
      return window.ZenWriterEditor &&
        typeof window.ZenWriterEditor.getEditorValue === 'function' &&
        window.ZenWriterEditor.getEditorValue().indexOf(needle) >= 0;
    }, tokenA);
    await expect(page.locator('#wysiwyg-editor')).toBeFocused();

    await clickSectionTitle(page, chapterB);
    await page.waitForFunction((needle) => {
      return window.ZenWriterEditor &&
        typeof window.ZenWriterEditor.getEditorValue === 'function' &&
        window.ZenWriterEditor.getEditorValue().indexOf(needle) >= 0;
    }, tokenB);

    await page.evaluate(() => {
      if (window.ZWContentGuard && typeof window.ZWContentGuard.ensureSaved === 'function') {
        window.ZWContentGuard.ensureSaved({ snapshot: false });
      }
    });
    const beforeReload = await getCurrentDocState(page);
    expect(beforeReload.docName).toBe(title);
    expect(beforeReload.chapters).toHaveLength(2);
    expect(beforeReload.chapters[0]).toMatchObject({ name: chapterA, content: storedBodyA, level: 2 });
    expect(beforeReload.chapters[1]).toMatchObject({ name: chapterB, content: storedBodyB, level: 2 });
    expect(normalizeNewlines(beforeReload.assembled).indexOf(tokenA)).toBeLessThan(
      normalizeNewlines(beforeReload.assembled).indexOf(tokenB)
    );

    await page.reload({ waitUntil: 'networkidle' });
    await ensureNormalMode(page);
    await expect(page.locator('#wysiwyg-editor')).toBeVisible({ timeout: 10000 });
    await page.waitForFunction(({ a, b }) => {
      var S = window.ZenWriterStorage;
      var Store = window.ZWChapterStore;
      var rawId = S && S.getCurrentDocId && S.getCurrentDocId();
      var docId = Store && Store.resolveParentDocumentId ? Store.resolveParentDocumentId(rawId) : rawId;
      var chapters = Store && Store.getChaptersForDoc ? (Store.getChaptersForDoc(docId) || []) : [];
      return chapters.length === 2 &&
        chapters[0].name === a.title &&
        String(chapters[0].content || '').indexOf(a.token) >= 0 &&
        chapters[1].name === b.title &&
        String(chapters[1].content || '').indexOf(b.token) >= 0;
    }, {
      a: { title: chapterA, token: tokenA },
      b: { title: chapterB, token: tokenB }
    });

    const afterReload = await getCurrentDocState(page);
    expect(afterReload.docName).toBe(title);
    expect(afterReload.chapters[0]).toMatchObject({ name: chapterA, content: storedBodyA });
    expect(afterReload.chapters[1]).toMatchObject({ name: chapterB, content: storedBodyB });

    await page.evaluate(() => {
      if (window.ZWReaderPreview && typeof window.ZWReaderPreview.enter === 'function') {
        window.ZWReaderPreview.enter();
      }
    });
    await expect(page.locator('html')).toHaveAttribute('data-reader-overlay-open', 'true');
    const readerText = normalizeNewlines(await page.locator('.reader-preview__content').innerText());
    expect(readerText).toContain(chapterA);
    expect(readerText).toContain(tokenA);
    expect(readerText).toContain(chapterB);
    expect(readerText).toContain(tokenB);
    expect(readerText.indexOf(tokenA)).toBeLessThan(readerText.indexOf(tokenB));

    await page.locator('#reader-back-fab').click();
    await expect(page.locator('html')).not.toHaveAttribute('data-reader-overlay-open', 'true');
    await expect(page.locator('#wysiwyg-editor')).toBeFocused();
    const afterReader = await getCurrentDocState(page);
    expect(afterReader.chapters[0]).toMatchObject({ name: chapterA, content: storedBodyA });
    expect(afterReader.chapters[1]).toMatchObject({ name: chapterB, content: storedBodyB });

    const txt = await downloadFromDocumentsIo(page, 0, testInfo, 'chapter-daily-flow.txt');
    const txtBody = normalizeNewlines(txt.text);
    expect(txtBody).toContain(chapterA);
    expect(txtBody).toContain(tokenA);
    expect(txtBody).toContain(chapterB);
    expect(txtBody).toContain(tokenB);
    expect(txtBody.indexOf(tokenA)).toBeLessThan(txtBody.indexOf(tokenB));

    const json = await downloadFromDocumentsIo(page, 1, testInfo, 'chapter-daily-flow.zwp.json');
    const project = JSON.parse(json.text);
    expect(project.format).toBe('zenwriter-v1');
    expect(project.document.name).toBe(title);
    expect(normalizeNewlines(project.document.content)).toContain(chapterA);
    expect(normalizeNewlines(project.document.content)).toContain(tokenA);
    expect(normalizeNewlines(project.document.content)).toContain(chapterB);
    expect(normalizeNewlines(project.document.content)).toContain(tokenB);
    expect(project.pages).toHaveLength(2);
    expect(project.pages[0]).toMatchObject({
      title: chapterA,
      content: storedBodyA,
      order: 0,
      level: 2,
      visibility: 'visible'
    });
    expect(project.pages[1]).toMatchObject({
      title: chapterB,
      content: storedBodyB,
      order: 1,
      level: 2,
      visibility: 'visible'
    });

    await importProjectJsonFromUi(page, json.path);
    await page.waitForFunction(({ title: docTitle, a, b }) => {
      var S = window.ZenWriterStorage;
      var Store = window.ZWChapterStore;
      var rawId = S && S.getCurrentDocId && S.getCurrentDocId();
      var docs = S && S.loadDocuments ? (S.loadDocuments() || []) : [];
      var docId = Store && Store.resolveParentDocumentId ? Store.resolveParentDocumentId(rawId, docs) : rawId;
      var doc = docs.find(function (d) { return d && d.id === docId; });
      var chapters = Store && Store.getChaptersForDoc ? (Store.getChaptersForDoc(docId) || []) : [];
      return doc && doc.name === docTitle &&
        chapters.length === 2 &&
        chapters[0].name === a.title &&
        String(chapters[0].content || '').indexOf(a.token) >= 0 &&
        chapters[1].name === b.title &&
        String(chapters[1].content || '').indexOf(b.token) >= 0;
    }, {
      title: importedTitle,
      a: { title: chapterA, token: tokenA },
      b: { title: chapterB, token: tokenB }
    });
    const imported = await getCurrentDocState(page);
    expect(imported.docName).toBe(importedTitle);
    expect(imported.chapters[0]).toMatchObject({ name: chapterA, content: storedBodyA });
    expect(imported.chapters[1]).toMatchObject({ name: chapterB, content: storedBodyB });
  });
});
