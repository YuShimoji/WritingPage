// @ts-check
/**
 * chapterMode: 結合本文 ↔ 章スライスの同期（モード往復でストアが汚染されないこと）
 */
const { test, expect } = require('@playwright/test');
const {
  ensureNormalMode,
  setUIMode,
  setupChapterModeChapters,
  getCurrentChapterStoreDocId,
  getChaptersForCurrentDoc,
  assembleCurrentChapterDoc,
} = require('./helpers');

test.describe('Chapter mode editor sync (assembled vs slice)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForLoadState('networkidle');
    await ensureNormalMode(page);
    await page.waitForTimeout(400);
  });

  test('フォーカス→ノーマル→フォーカスで各章の本文が結合全文に置き換わらない', async ({ page }) => {
    await setupChapterModeChapters(page, [
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

    const chapters = await getChaptersForCurrentDoc(page);
    expect(chapters.length).toBe(2);
    expect(String(chapters[0].content || '')).toBe('alpha-body');
    expect(String(chapters[1].content || '')).toBe('beta-body');
    expect(String(chapters[0].content || '').includes('## Beta')).toBe(false);
  });

  test('新規章追加後に往復しても空章の本文だけが残り他章に全文が混入しない', async ({ page }) => {
    await setupChapterModeChapters(page, [{ title: 'Only', content: 'only-body' }]);

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

    const chapters = await getChaptersForCurrentDoc(page);
    expect(chapters.length).toBe(2);
    expect(String(chapters[0].content || '')).toBe('only-body');
    expect(String(chapters[1].content || '').trim()).toBe('');
    expect(String(chapters[0].content || '').includes('## ')).toBe(false);
  });

  test('結合本文で削除した内容がフォーカス往復後も章ストアに残らない', async ({ page }) => {
    await setupChapterModeChapters(page, [
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

    const assembled = await assembleCurrentChapterDoc(page);
    expect(assembled).not.toContain('delete-marker');
    expect(assembled).toContain('keep');
    expect(assembled).toContain('tail');
  });

  test('未 assembled でも結合本文が章ストアとずれていればフォーカス移行で章へ反映される', async ({ page }) => {
    await setupChapterModeChapters(page, [
      { title: 'X', content: 'x-body' },
      { title: 'Y', content: 'y-body' }
    ]);

    var docId = await getCurrentChapterStoreDocId(page);
    await page.evaluate((resolvedDocId) => {
      var Store = window.ZWChapterStore;
      var full = resolvedDocId ? Store.assembleFullText(resolvedDocId) : '';
      var edited = String(full).replace('x-body', 'x-body-EDITED');
      document.documentElement.removeAttribute('data-zw-chapter-editor-sync');
      if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function') {
        window.ZenWriterEditor.setContent(edited);
      }
    }, docId);
    await page.waitForTimeout(150);

    await setUIMode(page, 'focus');
    await page.waitForTimeout(450);

    const ch0 = await page.evaluate((resolvedDocId) => {
      var Store = window.ZWChapterStore;
      var ch = resolvedDocId ? (Store.getChaptersForDoc(resolvedDocId) || []) : [];
      return ch[0] ? String(ch[0].content || '') : '';
    }, docId);
    expect(ch0).toContain('EDITED');
  });
});
