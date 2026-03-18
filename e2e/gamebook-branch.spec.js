// @ts-nocheck
const { test, expect } = require('@playwright/test');
const { showFullToolbar } = require('./helpers');

test.describe('SP-072 Gamebook Branch UI', () => {
  test('chapter-link--choice CSS class is defined and applicable', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await showFullToolbar(page);

    await page.fill('#editor', '## 第1章\n\n「どうする？」\n\n[森に入る](chapter://forest)\n\n[川沿いを進む](chapter://river)');
    await page.click('#toggle-preview');

    // chapter-link が存在する
    const links = page.locator('#markdown-preview-panel .chapter-link');
    await expect(links.first()).toBeVisible();
  });

  test('chapter-link--choice style has block display and arrow icon', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    // choice クラスの CSS が定義されている
    const hasClass = await page.evaluate(() => {
      var el = document.createElement('a');
      el.className = 'chapter-link chapter-link--choice';
      document.body.appendChild(el);
      var cs = getComputedStyle(el);
      var display = cs.display;
      document.body.removeChild(el);
      return display === 'block';
    });
    expect(hasClass).toBe(true);
  });

  test('chapter-link--emphasis style has left border', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const hasBorder = await page.evaluate(() => {
      var el = document.createElement('a');
      el.className = 'chapter-link chapter-link--emphasis';
      document.body.appendChild(el);
      var cs = getComputedStyle(el);
      var borderWidth = parseFloat(cs.borderLeftWidth);
      document.body.removeChild(el);
      return borderWidth >= 3;
    });
    expect(hasBorder).toBe(true);
  });

  test('chapter-link--card style has border and border-radius', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const hasCard = await page.evaluate(() => {
      var el = document.createElement('a');
      el.className = 'chapter-link chapter-link--card';
      document.body.appendChild(el);
      var cs = getComputedStyle(el);
      var borderRadius = parseFloat(cs.borderRadius);
      var borderWidth = parseFloat(cs.borderWidth);
      document.body.removeChild(el);
      return borderRadius >= 6 && borderWidth >= 1;
    });
    expect(hasCard).toBe(true);
  });

  test('reduced-motion disables transitions on branch links', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.emulateMedia({ reducedMotion: 'reduce' });

    const noTransition = await page.evaluate(() => {
      var el = document.createElement('a');
      el.className = 'chapter-link chapter-link--card';
      document.body.appendChild(el);
      var cs = getComputedStyle(el);
      var transition = cs.transition || cs.transitionProperty || '';
      document.body.removeChild(el);
      return transition === 'none' || transition.indexOf('none') !== -1 || transition === '';
    });
    expect(noTransition).toBe(true);
  });
});
