/**
 * WP-004: Reader 本文への章末ナビ（chapter-nav-bar）注入の結合 smoke
 * パイプライン HTML 同一性ではなく、reader-preview + ZWChapterNav.injectNavBars の層を検証する。
 */
const { test, expect } = require('@playwright/test');
const { ensureNormalMode } = require('./helpers');

/**
 * @param {import('@playwright/test').Page} page
 * @param {{ title: string, content?: string, level?: number }[]} chapters
 */
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

test.describe('Reader chapter nav injection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);
    await ensureNormalMode(page);
    await page.evaluate(() => {
      if (window.ZenWriterStorage && typeof window.ZenWriterStorage.saveSettings === 'function') {
        window.ZenWriterStorage.saveSettings({
          chapterNav: { enabled: true, style: 'minimal' }
        });
      }
    });
  });

  test('複数章 chapterMode で Reader 本文に .chapter-nav-bar が注入される', async ({ page }) => {
    await setupChapters(page, [
      { title: 'ReaderNavProbeCh1', content: 'body-one' },
      { title: 'ReaderNavProbeCh2', content: 'body-two' }
    ]);

    await page.evaluate(() => {
      if (window.ZWReaderPreview && typeof window.ZWReaderPreview.enter === 'function') {
        window.ZWReaderPreview.enter();
      }
    });

    var bars = page.locator('#reader-preview .reader-preview__content .chapter-nav-bar');
    await expect(bars.first()).toBeVisible({ timeout: 15000 });
    await expect(bars).toHaveCount(2);

    await expect(
      page.locator('#reader-preview .reader-preview__content .chapter-nav-bar__link.chapter-nav-bar__toc').first()
    ).toBeVisible();
  });
});
