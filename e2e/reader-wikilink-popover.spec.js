/**
 * Reader 内 wikilink クリック → ポップオーバー（存在しない語は壊れリンク用メッセージ）
 */
const { test, expect } = require('@playwright/test');
const { ensureNormalMode } = require('./helpers');

test.describe('Reader wikilink popover', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await ensureNormalMode(page);
  });

  test('壊れ wikilink クリックでポップオーバーが開き、外クリックで閉じる', async ({ page }) => {
    const probeTitle = 'ZWBrokenWikiPopoverProbeSession58';

    await page.locator('#editor').waitFor({ state: 'visible', timeout: 10000 });
    await page.locator('#editor').fill('[[' + probeTitle + ']]\n');
    await page.locator('#editor').dispatchEvent('input');

    await page.evaluate(() => {
      if (window.ZWReaderPreview && typeof window.ZWReaderPreview.enter === 'function') {
        window.ZWReaderPreview.enter();
      }
    });
    await page.waitForTimeout(500);

    const link = page.locator('#reader-preview .reader-preview__content a.wikilink.is-broken').filter({ hasText: probeTitle });
    await expect(link).toBeVisible();

    await link.click();
    var pop = page.locator('.reader-wiki-popover.reader-wiki-popover--broken');
    await expect(pop).toBeVisible();
    await expect(pop).toContainText(probeTitle);
    await expect(pop).toContainText('Story Wiki にこの語の項目はまだありません');

    await page.locator('#reader-mode-hint').click({ force: true });
    await expect(pop).toHaveCount(0);
  });
});
