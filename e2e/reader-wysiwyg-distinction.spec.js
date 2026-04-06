/**
 * Reader モード（閲覧専用 UI）とリッチ編集（WYSIWYG）の混同防止の回帰テスト
 */
const { test, expect } = require('@playwright/test');
const { ensureNormalMode } = require('./helpers');

test.describe('Reader vs WYSIWYG distinction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await ensureNormalMode(page);
  });

  test('Reader モードではメイン編集領域が隠れ、モードヒントが見える', async ({ page }) => {
    await page.evaluate(() => {
      if (window.ZWReaderPreview && typeof window.ZWReaderPreview.enter === 'function') {
        window.ZWReaderPreview.enter();
      }
    });
    await page.waitForTimeout(400);

    await expect(page.locator('html')).toHaveAttribute('data-ui-mode', 'reader');
    await expect(page.locator('#reader-mode-hint')).toBeVisible();

    const mainHidden = await page.evaluate(() => {
      const main = document.querySelector('.main-content');
      return !!(main && window.getComputedStyle(main).display === 'none');
    });
    expect(mainHidden).toBe(true);

    await page.locator('#reader-back-fab').click();
    await page.waitForTimeout(300);
    await expect(page.locator('html')).not.toHaveAttribute('data-ui-mode', 'reader');

    const focusOnEditSurface = await page.evaluate(() => {
      const a = document.activeElement;
      const ed = document.getElementById('editor');
      const wys = document.getElementById('wysiwyg-editor');
      if (!a) return false;
      if (ed && a === ed) return true;
      if (wys && a === wys) return true;
      if (ed && ed.contains(a)) return true;
      if (wys && wys.contains(a)) return true;
      return false;
    });
    expect(focusOnEditSurface).toBe(true);
  });

  test('ZWPostMarkdownHtmlPipeline（reader）で chapter:// が # リンクへ正規化される', async ({ page }) => {
    const ok = await page.evaluate(() => {
      if (!window.ZWPostMarkdownHtmlPipeline || typeof window.ZWPostMarkdownHtmlPipeline.apply !== 'function') {
        return false;
      }
      var html = '<p><a href="chapter://TestTarget">go</a></p>';
      var out = window.ZWPostMarkdownHtmlPipeline.apply(html, { surface: 'reader', settings: {} });
      return out.indexOf('chapter://') === -1 && /href="#/.test(out);
    });
    expect(ok).toBe(true);
  });

  test('リッチ編集の切替で UI モードは通常のまま', async ({ page }) => {
    await page.evaluate(() => {
      const btn = document.getElementById('toggle-wysiwyg');
      if (btn) btn.click();
    });
    await page.waitForTimeout(300);
    await expect(page.locator('html')).toHaveAttribute('data-ui-mode', 'normal');
  });
});
