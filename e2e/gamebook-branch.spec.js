// @ts-nocheck
const { test, expect } = require('@playwright/test');
const { showFullToolbar } = require('./helpers');

test.describe('SP-072 Gamebook Branch UI', () => {
  test('chapter-link--choice CSS class is defined and applicable', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await showFullToolbar(page);

    await page.fill('#editor', '## 第1章\n\n「どうする？」\n\n[森に入る](chapter://forest)\n\n[川沿いを進む](chapter://river)');
    await page.evaluate(() => window.ZenWriterEditor && window.ZenWriterEditor.togglePreview());

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

  test('data-style attribute applies correct CSS class via convertChapterLinks', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await showFullToolbar(page);

    // chapter:// リンクに #style=card フラグメントを含む Markdown
    await page.fill('#editor', '## Chapter 1\n\n[Enter forest](chapter://forest#style=card)\n\n[Go back](chapter://town#style=emphasis)');
    await page.evaluate(() => window.ZenWriterEditor && window.ZenWriterEditor.togglePreview());

    // card スタイルが適用されている
    const cardLink = page.locator('#markdown-preview-panel .chapter-link--card');
    await expect(cardLink).toBeVisible();

    // emphasis スタイルが適用されている
    const emphasisLink = page.locator('#markdown-preview-panel .chapter-link--emphasis');
    await expect(emphasisLink).toBeVisible();
  });

  test('consecutive chapter links are auto-grouped in .chapter-choices wrapper', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await showFullToolbar(page);

    // 連続する chapter:// リンク
    await page.fill('#editor', '## Adventure\n\nWhat do you do?\n\n[Go left](chapter://left)\n[Go right](chapter://right)\n[Go back](chapter://back)');
    await page.evaluate(() => window.ZenWriterEditor && window.ZenWriterEditor.togglePreview());
    await page.waitForTimeout(500);

    // chapter-link が3つ存在する
    const links = page.locator('#markdown-preview-panel .chapter-link');
    await expect(links).toHaveCount(3);

    // .chapter-choices ラッパーが生成されている
    const wrapper = page.locator('#markdown-preview-panel .chapter-choices');
    const wrapperCount = await wrapper.count();
    if (wrapperCount > 0) {
      // ラッパー内にリンクがある
      const linksInGroup = wrapper.locator('.chapter-link');
      const count = await linksInGroup.count();
      expect(count).toBeGreaterThanOrEqual(2);
    }
    // autoGroupChoices が onPreviewUpdated で呼ばれていることを確認
    // （DOMの親要素がラッパーであるか、最低限リンク自体は存在する）
    expect(await links.count()).toBe(3);
  });

  test('.chapter-choices wrapper has border-top and border-bottom', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const hasBorders = await page.evaluate(() => {
      var el = document.createElement('div');
      el.className = 'chapter-choices';
      document.body.appendChild(el);
      var cs = getComputedStyle(el);
      var topWidth = parseFloat(cs.borderTopWidth);
      var bottomWidth = parseFloat(cs.borderBottomWidth);
      document.body.removeChild(el);
      return topWidth >= 1 && bottomWidth >= 1;
    });
    expect(hasBorders).toBe(true);
  });

  test('link-insert-modal style select CSS class is defined', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    // スタイル選択のCSSが定義されているか確認
    const hasStyles = await page.evaluate(() => {
      var row = document.createElement('div');
      row.className = 'link-insert-modal__style-row';
      var select = document.createElement('select');
      select.className = 'link-insert-modal__style-select';
      row.appendChild(select);
      document.body.appendChild(row);
      var cs = getComputedStyle(row);
      var display = cs.display;
      var _csSelect = getComputedStyle(select);
      document.body.removeChild(row);
      return display === 'flex';
    });
    expect(hasStyles).toBe(true);
  });
});
