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

  test('Reader 章末ナビの「次へ」クリックで次章付近へ遷移する', async ({ page }) => {
    await setupChapters(page, [
      { title: 'ReaderNavJumpCh1', content: new Array(30).fill('alpha body line').join('\n') },
      { title: 'ReaderNavJumpCh2', content: new Array(30).fill('beta body line').join('\n') },
      { title: 'ReaderNavJumpCh3', content: new Array(30).fill('gamma body line').join('\n') }
    ]);

    await page.evaluate(() => {
      if (window.ZWReaderPreview && typeof window.ZWReaderPreview.enter === 'function') {
        window.ZWReaderPreview.enter();
      }
    });
    await page.waitForTimeout(400);

    const initialScrollTop = await page.evaluate(() => {
      var preview = document.getElementById('reader-preview');
      return preview ? preview.scrollTop : 0;
    });

    const firstNext = page.locator(
      '#reader-preview .reader-preview__content .chapter-nav-bar .chapter-nav-bar__next'
    ).first();
    await expect(firstNext).toBeVisible();
    await firstNext.click();
    await page.waitForTimeout(500);

    const moved = await page.evaluate(() => {
      var preview = document.getElementById('reader-preview');
      if (!preview) return null;
      return {
        scrollTop: preview.scrollTop
      };
    });

    expect(moved).toBeTruthy();
    expect(moved.scrollTop).toBeGreaterThan(initialScrollTop + 10);
  });
});
