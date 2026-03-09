// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Sidebar Writing Focus', () => {
  test('sidebar defaults to writing IA: title + sections + footer settings', async ({ page }) => {
    await page.goto('/');
    await page.click('#toggle-sidebar');
    await page.waitForTimeout(300);

    await expect(page.locator('#writing-focus-title')).toBeVisible();
    await expect(page.locator('#writing-focus-add-section')).toBeVisible();
    await expect(page.locator('#writing-focus-settings-btn')).toBeVisible();

    const nonStructureHidden = await page.evaluate(() => {
      const ids = ['structure', 'edit', 'theme', 'assist', 'advanced'];
      return ids.every((id) => {
        const el = document.querySelector(`.accordion-category[data-category="${id}"]`);
        if (!el) return false;
        return window.getComputedStyle(el).display === 'none';
      });
    });
    expect(nonStructureHidden).toBe(true);

    await page.click('#writing-focus-settings-btn');
    await page.waitForTimeout(120);

    const categoriesVisibleInSettings = await page.evaluate(() => {
      const ids = ['structure', 'edit', 'theme', 'assist', 'advanced'];
      return ids.every((id) => {
        const el = document.querySelector(`.accordion-category[data-category="${id}"]`);
        if (!el) return false;
        return window.getComputedStyle(el).display !== 'none';
      });
    });
    expect(categoriesVisibleInSettings).toBe(true);

    const expandedState = await page.evaluate(() => {
      const structure = document.querySelector('.accordion-header[aria-controls="accordion-structure"]');
      const others = ['edit', 'theme', 'assist', 'advanced']
        .map((id) => document.querySelector(`.accordion-header[aria-controls="accordion-${id}"]`))
        .filter(Boolean);
      return {
        structure: structure ? structure.getAttribute('aria-expanded') : null,
        others: others.map((el) => el.getAttribute('aria-expanded'))
      };
    });
    expect(expandedState.structure).toBe('true');
    expect(expandedState.others.every((state) => state === 'false')).toBe(true);
  });

  test('+追加 inserts natural level and no longer uses 新しいセクション label', async ({ page }) => {
    await page.goto('/');
    await page.click('#toggle-sidebar');
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      const editor = document.getElementById('editor');
      if (!editor) return;
      editor.value = '## 第一章\n本文A\n### シーンA1\n本文A1\n## 第二章\n本文B\n';
      editor.selectionStart = editor.value.indexOf('本文A');
      editor.selectionEnd = editor.selectionStart;
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.click('#writing-focus-add-section');

    const afterSceneInsert = await page.evaluate(() => {
      const editor = document.getElementById('editor');
      return editor ? editor.value : '';
    });
    expect(afterSceneInsert).toContain('### 新しいシーン');
    expect(afterSceneInsert).not.toContain('新しいセクション');

    await page.evaluate(() => {
      const editor = document.getElementById('editor');
      if (!editor) return;
      editor.selectionStart = 0;
      editor.selectionEnd = 0;
      editor.dispatchEvent(new Event('keyup', { bubbles: true }));
    });
    await page.click('#writing-focus-add-section');

    const afterChapterInsert = await page.evaluate(() => {
      const editor = document.getElementById('editor');
      return editor ? editor.value : '';
    });
    expect(afterChapterInsert).toContain('## 新しい章');
  });
});
