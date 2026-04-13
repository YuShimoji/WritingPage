// @ts-check
/**
 * chapterMode: 結合本文 ↔ 章スライスの同期（モード往復でストアが汚染されないこと）
 */
const { test, expect } = require('@playwright/test');
const { ensureNormalMode, setUIMode } = require('./helpers');

async function setupChapters(page, chapters) {
  await page.evaluate((chs) => {
    var S = window.ZenWriterStorage;
    var Store = window.ZWChapterStore;
    if (!S || !Store) return;
    var docId = S.getCurrentDocId();
    if (!docId) return;
    if (Store.ensureChapterMode) Store.ensureChapterMode(docId);
    var existing = Store.getChaptersForDoc(docId) || [];
    for (var i = 0; i < existing.length; i++) {
      Store.deleteChapter(existing[i].id);
    }
    var prevId = null;
    for (var j = 0; j < chs.length; j++) {
      var ch = chs[j];
      Store.createChapter(docId, ch.title, ch.content || '', prevId, ch.level || 2);
      var created = Store.getChaptersForDoc(docId) || [];
      if (created.length > 0) prevId = created[created.length - 1].id;
    }
  }, chapters);
  await page.waitForTimeout(200);
}

test.describe('Chapter mode editor sync (assembled vs slice)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForLoadState('networkidle');
    await ensureNormalMode(page);
    await page.waitForTimeout(400);
  });

  test('フォーカス→ノーマル→フォーカスで各章の本文が結合全文に置き換わらない', async ({ page }) => {
    await setupChapters(page, [
      { title: 'Alpha', content: 'alpha-body' },
      { title: 'Beta', content: 'beta-body' }
    ]);

    await setUIMode(page, 'focus');
    await page.waitForTimeout(350);
    await page.evaluate(() => {
      if (window.ZWChapterList && typeof window.ZWChapterList.navigateTo === 'function') {
        window.ZWChapterList.navigateTo(1);
      }
    });
    await page.waitForTimeout(200);

    await setUIMode(page, 'normal');
    await page.waitForTimeout(300);
    await setUIMode(page, 'focus');
    await page.waitForTimeout(400);

    const sync = await page.evaluate(() => document.documentElement.getAttribute('data-zw-chapter-editor-sync'));
    expect(sync).toBe('slice');

    const chapters = await page.evaluate(() => {
      var S = window.ZenWriterStorage;
      var Store = window.ZWChapterStore;
      var docId = S.getCurrentDocId();
      return Store.getChaptersForDoc(docId) || [];
    });
    expect(chapters.length).toBe(2);
    expect(String(chapters[0].content || '')).toBe('alpha-body');
    expect(String(chapters[1].content || '')).toBe('beta-body');
    expect(String(chapters[0].content || '').includes('## Beta')).toBe(false);
  });

  test('新規章追加後に往復しても空章の本文だけが残り他章に全文が混入しない', async ({ page }) => {
    await setupChapters(page, [{ title: 'Only', content: 'only-body' }]);

    await setUIMode(page, 'focus');
    await page.waitForTimeout(350);
    await page.evaluate(() => {
      var btn = document.getElementById('focus-add-chapter');
      if (btn) btn.click();
    });
    await page.waitForTimeout(500);

    await setUIMode(page, 'normal');
    await page.waitForTimeout(300);
    await setUIMode(page, 'focus');
    await page.waitForTimeout(400);

    const chapters = await page.evaluate(() => {
      var S = window.ZenWriterStorage;
      var Store = window.ZWChapterStore;
      var docId = S.getCurrentDocId();
      return Store.getChaptersForDoc(docId) || [];
    });
    expect(chapters.length).toBe(2);
    expect(String(chapters[0].content || '')).toBe('only-body');
    expect(String(chapters[1].content || '').trim()).toBe('');
    expect(String(chapters[0].content || '').includes('## ')).toBe(false);
  });

  test('結合本文で削除した内容がフォーカス往復後も章ストアに残らない', async ({ page }) => {
    await setupChapters(page, [
      { title: 'A', content: 'keep delete-marker keep' },
      { title: 'B', content: 'tail' }
    ]);

    await setUIMode(page, 'focus');
    await page.waitForTimeout(350);
    await setUIMode(page, 'normal');
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      var G = window.ZWContentGuard;
      var raw = G && G.getEditorContent ? G.getEditorContent() : '';
      var next = String(raw).replace('delete-marker ', '');
      if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function') {
        window.ZenWriterEditor.setContent(next);
      }
    });
    await page.waitForTimeout(150);

    await setUIMode(page, 'focus');
    await page.waitForTimeout(400);
    await setUIMode(page, 'normal');
    await page.waitForTimeout(300);

    const assembled = await page.evaluate(() => {
      var S = window.ZenWriterStorage;
      var Store = window.ZWChapterStore;
      var docId = S.getCurrentDocId();
      return Store.assembleFullText(docId);
    });
    expect(assembled).not.toContain('delete-marker');
    expect(assembled).toContain('keep');
    expect(assembled).toContain('tail');
  });

  test('未 assembled でも結合本文が章ストアとずれていればフォーカス移行で章へ反映される', async ({ page }) => {
    await setupChapters(page, [
      { title: 'X', content: 'x-body' },
      { title: 'Y', content: 'y-body' }
    ]);

    await page.evaluate(() => {
      var S = window.ZenWriterStorage;
      var Store = window.ZWChapterStore;
      var docId = S.getCurrentDocId();
      var full = Store.assembleFullText(docId);
      var edited = String(full).replace('x-body', 'x-body-EDITED');
      document.documentElement.removeAttribute('data-zw-chapter-editor-sync');
      if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function') {
        window.ZenWriterEditor.setContent(edited);
      }
    });
    await page.waitForTimeout(150);

    await setUIMode(page, 'focus');
    await page.waitForTimeout(450);

    const ch0 = await page.evaluate(() => {
      var S = window.ZenWriterStorage;
      var Store = window.ZWChapterStore;
      var docId = S.getCurrentDocId();
      var ch = Store.getChaptersForDoc(docId) || [];
      return ch[0] ? String(ch[0].content || '') : '';
    });
    expect(ch0).toContain('EDITED');
  });
});
