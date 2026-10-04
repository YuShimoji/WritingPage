const { test, expect } = require('@playwright/test');
const { enableAllGadgets, openSidebarGroup } = require('./helpers');

test.use({ storageState: { cookies: [], origins: [] } });
const health = new WeakMap();

async function ready(page) {
  await page.waitForFunction(() => window.ZenWriterStorage?.initIDB && window.ZenWriterIDB);
  await page.evaluate(() => window.ZenWriterStorage.initIDB());
  await enableAllGadgets(page);
  await openSidebarGroup(page, 'structure');
}

async function seed(page) {
  return page.evaluate(async () => {
    const s = window.ZenWriterStorage;
    const a = s.createStoryWikiEntry({ title: 'Copy Survivor', content: 'original A', category: 'character' });
    const b = s.createStoryWikiEntry({ title: 'Copy Deleted', content: 'original B', category: 'term' });
    await window.ZenWriterIDB.putWikiPage(a);
    await window.ZenWriterIDB.putWikiPage(b);
    return { a: a.id, b: b.id };
  });
}

async function openEntry(page, id) {
  await page.evaluate(entryId => document.dispatchEvent(new CustomEvent('swiki-open-entry', { detail: { entryId } })), id);
  await expect(page.locator('.swiki-full:visible')).toBeVisible();
  return page.locator('.swiki-full:visible');
}

async function observe(page, testInfo, phase) {
  const state = await page.evaluate(async () => ({
    wiki: window.ZenWriterStorage.loadStoryWiki(),
    idb: await window.ZenWriterIDB.getWikiPages(),
    localWiki: localStorage.getItem('zenWriter_story_wiki'),
    pendingDeletes: localStorage.getItem('zenWriter_story_wiki_deleted_ids'),
    editor: document.querySelector('#editor')?.value,
  }));
  await testInfo.attach(phase + '.json', { body: JSON.stringify(state), contentType: 'application/json' });
  return state;
}

test.beforeEach(async ({ page }) => {
  const log = { pageErrors: [], consoleErrors: [], warnings: [], badResponses: [] };
  health.set(page, log);
  page.on('pageerror', error => log.pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') log.consoleErrors.push(message.text());
    if (message.type() === 'warning') log.warnings.push(message.text());
  });
  page.on('response', response => { if (response.status() >= 400) log.badResponses.push({ url: response.url(), status: response.status() }); });
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.goto('/index.html');
  await ready(page);
  expect(await page.title()).toContain('Zen Writer');
  await expect(page.locator('#wysiwyg-editor')).toBeVisible();
});

test.afterEach(async ({ page }, testInfo) => {
  await observe(page, testInfo, 'final-state');
  await testInfo.attach('browser-health.json', { body: JSON.stringify(health.get(page)), contentType: 'application/json' });
  await page.screenshot({ path: testInfo.outputPath('wiki-idb-result.png') });
  const log = health.get(page);
  expect(log.pageErrors).toEqual([]);
  expect(log.consoleErrors).toEqual([]);
  expect(log.badResponses).toEqual([]);
  const expectedWarning = testInfo.title.includes('[failure-retry]')
    ? 'Injected isolated Wiki write failure'
    : testInfo.title.includes('transaction abort') ? '[IDB] Database error: AbortError:' : null;
  expect(log.warnings.filter(text => !expectedWarning || !text.includes(expectedWarning))).toEqual([]);
});

test('[repro] deleted Wiki entry stays deleted after immediate reload', async ({ page }, testInfo) => {
  const ids = await seed(page);
  const pane = await openEntry(page, ids.b);
  page.once('dialog', dialog => dialog.accept());
  await pane.getByRole('button', { name: '削除', exact: true }).click();
  expect(await page.evaluate(id => window.ZenWriterStorage.getStoryWikiEntry(id), ids.b)).toBeNull();
  await observe(page, testInfo, 'after-delete-before-reload');
  await page.reload();
  await ready(page);
  const state = await observe(page, testInfo, 'after-reload');
  expect(state.wiki.map(entry => entry.id)).not.toContain(ids.b);
  await expect.poll(() => page.evaluate(id => window.ZenWriterIDB.getWikiPages().then(entries => entries.some(entry => entry.id === id)), ids.b)).toBe(false);
  expect(state.wiki.find(entry => entry.id === ids.a)?.content).toBe('original A');
  await openEntry(page, ids.a);
});

test('[repro] late Wiki hydration cannot overwrite an edit already flushed to IDB', async ({ page }, testInfo) => {
  const ids = await seed(page);
  await page.evaluate(() => {
    const idb = window.ZenWriterIDB;
    const read = idb.getWikiPages.bind(idb);
    idb.getWikiPages = async () => {
      const oldRows = await read();
      idb.getWikiPages = read;
      window.__wikiReadCaptured = true;
      return new Promise(resolve => { window.__releaseWikiRead = () => resolve(oldRows); });
    };
    window.__lateWikiInit = window.ZenWriterStorage.initIDB();
  });
  await page.waitForFunction(() => window.__wikiReadCaptured);
  const pane = await openEntry(page, ids.a);
  await pane.getByRole('button', { name: '編集', exact: true }).click();
  await pane.locator('.swiki-edit-form textarea').fill('new Wiki content');
  await pane.getByRole('button', { name: '保存', exact: true }).click();
  await expect.poll(() => page.evaluate(id => window.ZenWriterIDB.getWikiPages().then(entries => entries.find(entry => entry.id === id)?.content), ids.a), { timeout: 10000 }).toBe('new Wiki content');
  await page.evaluate(async () => { window.__releaseWikiRead(); await window.__lateWikiInit; });
  const state = await observe(page, testInfo, 'after-late-hydration');
  expect(state.wiki.find(entry => entry.id === ids.a)?.content).toBe('new Wiki content');
  await page.reload();
  await ready(page);
  expect(await page.evaluate(id => window.ZenWriterStorage.getStoryWikiEntry(id).content, ids.a)).toBe('new Wiki content');
});

test('deleting the last entries preserves an empty Wiki after reload', async ({ page }, testInfo) => {
  const ids = await seed(page);
  await page.evaluate(({ a, b }) => { window.ZenWriterStorage.deleteStoryWikiEntry(a); window.ZenWriterStorage.deleteStoryWikiEntry(b); }, ids);
  await page.reload();
  await ready(page);
  expect((await observe(page, testInfo, 'empty-after-reload')).wiki).toEqual([]);
  await expect.poll(() => page.evaluate(() => window.ZenWriterIDB.getWikiPages().then(entries => entries.length))).toBe(0);
});

test('queued Wiki save/delete wins over an older in-flight write without removing unseen rows', async ({ page }, testInfo) => {
  const ids = await seed(page);
  await page.evaluate(async ({ a }) => {
    const idb = window.ZenWriterIDB;
    await idb.putWikiPage({ id: 'copy_unseen', title: 'Copy Unseen', content: 'untouched row' });
    const write = idb.applyWikiChanges.bind(idb);
    let first = true;
    idb.applyWikiChanges = (entries, deletedIds) => {
      if (!first) return write(entries, deletedIds);
      first = false;
      window.__heldWikiSnapshot = entries.map(entry => ({ ...entry }));
      window.__wikiWriteHeld = true;
      return new Promise(resolve => { window.__releaseWikiWrite = () => resolve(write(entries, deletedIds)); });
    };
    window.ZenWriterStorage.updateStoryWikiEntry(a, { content: 'older write' });
  }, ids);
  await page.waitForFunction(() => window.__wikiWriteHeld);
  await page.evaluate(({ a, b }) => {
    const s = window.ZenWriterStorage;
    s.updateStoryWikiEntry(a, { content: 'latest write' });
    s.deleteStoryWikiEntry(b);
    s.createStoryWikiEntry({ title: 'Copy New', content: 'new row' });
    window.__releaseWikiWrite();
  }, ids);
  await expect.poll(() => page.evaluate(async () => (await window.ZenWriterIDB.getWikiPages()).map(entry => [entry.title, entry.content]).sort()), { timeout: 10000 }).toEqual([
    ['Copy New', 'new row'], ['Copy Survivor', 'latest write'], ['Copy Unseen', 'untouched row'],
  ]);
  expect(await page.evaluate(() => window.__heldWikiSnapshot.find(entry => entry.title === 'Copy Survivor').content)).toBe('older write');
  await observe(page, testInfo, 'queued-final');
  await page.reload();
  await ready(page);
  expect(await page.evaluate(id => window.ZenWriterStorage.getStoryWikiEntry(id)?.content, ids.a)).toBe('latest write');
  expect(await page.evaluate(id => window.ZenWriterStorage.getStoryWikiEntry(id), ids.b)).toBeNull();
});

test('[failure-retry] failed Wiki write retains deletion intent for reload retry', async ({ page }, testInfo) => {
  const ids = await seed(page);
  await page.evaluate(({ b }) => {
    const idb = window.ZenWriterIDB;
    idb.applyWikiChanges = () => {
      window.__wikiWriteFailed = true;
      return Promise.reject(new Error('Injected isolated Wiki write failure'));
    };
    window.ZenWriterStorage.deleteStoryWikiEntry(b);
  }, ids);
  await page.waitForFunction(() => window.__wikiWriteFailed);
  const state = await observe(page, testInfo, 'failed-write');
  expect(JSON.parse(state.pendingDeletes)).toContain(ids.b);
  expect(state.wiki.map(entry => entry.id)).not.toContain(ids.b);
  await page.reload();
  await ready(page);
  await expect.poll(() => page.evaluate(id => window.ZenWriterIDB.getWikiPages().then(entries => entries.some(entry => entry.id === id)), ids.b)).toBe(false);
  expect(await page.evaluate(id => window.ZenWriterStorage.getStoryWikiEntry(id), ids.b)).toBeNull();
});

test('Wiki transaction abort rolls back both deletion and partial upserts', async ({ page }, testInfo) => {
  const ids = await seed(page);
  const result = await page.evaluate(async ({ a, b }) => {
    try {
      await window.ZenWriterIDB.applyWikiChanges([{ id: a, title: 'Copy Survivor', content: 'invalid partial update' }, { title: 'missing id' }], [b]);
      return 'unexpected-success';
    } catch (error) { return error.name; }
  }, ids);
  expect(result).not.toBe('unexpected-success');
  const state = await observe(page, testInfo, 'atomic-rollback');
  expect(state.idb.find(entry => entry.id === ids.a)?.content).toBe('original A');
  expect(state.idb.find(entry => entry.id === ids.b)?.content).toBe('original B');
});

test('Wiki hydration and deletion leave editor Undo/Redo and saved reload intact', async ({ page }, testInfo) => {
  const ids = await seed(page);
  const editor = page.locator('#wysiwyg-editor');
  await editor.click();
  await page.keyboard.press('Control+a');
  await page.keyboard.insertText('Copy manuscript');
  await page.keyboard.press('F2');
  await page.locator('#command-palette-input').fill('保存');
  await page.locator('.command-palette-item[data-command-id="save"]').click();
  await expect(page.locator('#writing-status-chip')).toHaveAttribute('data-save-state', 'saved');
  await page.reload();
  await ready(page);
  await editor.click();
  await page.keyboard.press('Control+End');
  await page.keyboard.insertText(' continuation');
  await page.evaluate(id => window.ZenWriterStorage.deleteStoryWikiEntry(id), ids.b);
  await page.keyboard.press('Control+z');
  await expect(editor).toHaveText('Copy manuscript');
  await page.keyboard.press('Control+y');
  await expect(editor).toHaveText('Copy manuscript continuation');
  await page.evaluate(() => window.ZenWriterStorage.initIDB());
  await page.keyboard.press('F2');
  await page.locator('#command-palette-input').fill('保存');
  await page.locator('.command-palette-item[data-command-id="save"]').click();
  await expect(page.locator('#writing-status-chip')).toHaveAttribute('data-save-state', 'saved');
  await observe(page, testInfo, 'editor-saved');
  await page.reload();
  await ready(page);
  await expect(editor).toHaveText('Copy manuscript continuation');
  expect(await page.evaluate(id => window.ZenWriterStorage.getStoryWikiEntry(id), ids.b)).toBeNull();
});
