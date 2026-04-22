// @ts-check
const { test, expect } = require('@playwright/test');
const { getChaptersForCurrentDoc } = require('./helpers');

test.describe('Sidebar Writing Focus', () => {
  async function ensureSidebarOpen(page) {
    await page.evaluate(() => {
      const sidebar = document.getElementById('sidebar');
      if (!sidebar || sidebar.classList.contains('open')) return;
      if (window.sidebarManager && typeof window.sidebarManager.forceSidebarState === 'function') {
        window.sidebarManager.forceSidebarState(true);
      } else {
        const toggle = document.getElementById('toggle-sidebar');
        if (toggle) toggle.click();
      }
    });
  }

  async function setUIMode(page, mode) {
    await page.evaluate((nextMode) => {
      if (window.ZenWriterApp && typeof window.ZenWriterApp.setUIMode === 'function') {
        window.ZenWriterApp.setUIMode(nextMode);
      }
    }, mode);
  }

  test('normal mode keeps accordion, focus mode enables writing IA', async ({ page }) => {
    await page.goto('/');
    await setUIMode(page, 'normal');
    await ensureSidebarOpen(page);
    await page.waitForTimeout(300);

    await expect(page.locator('#writing-focus-rail')).toBeHidden();
    await expect(page.locator('.accordion-category[data-category="structure"]')).toBeVisible();
    await expect(page.locator('.accordion-category[data-category="edit"]')).toBeVisible();

    await setUIMode(page, 'focus');
    await ensureSidebarOpen(page);
    await page.waitForTimeout(300);

    await expect(page.locator('#writing-focus-title')).toBeVisible();
    await expect(page.locator('#writing-focus-add-section')).toBeVisible();
    // session 107: writing-focus-footer (詳細/フルChrome) は view-menu/F2 に集約し視覚的には隠蔽。DOM 存在のみ検証
    await expect(page.locator('#writing-focus-settings-btn')).toBeAttached();
    await expect(page.locator('#writing-focus-exit-to-normal-btn')).toBeAttached();

    const nonStructureHidden = await page.evaluate(() => {
      const ids = ['structure', 'edit', 'theme', 'assist', 'advanced'];
      return ids.every((id) => {
        const el = document.querySelector(`.accordion-category[data-category="${id}"]`);
        if (!el) return false;
        return window.getComputedStyle(el).display === 'none';
      });
    });
    expect(nonStructureHidden).toBe(true);

    // session 107: 隠蔽された "詳細" ボタンを programmatic click
    await page.evaluate(() => document.getElementById('writing-focus-settings-btn').click());
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

    // session 107: 隠蔽された "フルChrome" ボタンを programmatic click
    await page.evaluate(() => document.getElementById('writing-focus-exit-to-normal-btn').click());
    await page.waitForTimeout(200);
    await expect(page.locator('html')).toHaveAttribute('data-ui-mode', 'normal');
  });

  test('+追加 uses chapter path and does not revive 新しいセクション label', async ({ page }) => {
    await page.goto('/');
    await setUIMode(page, 'focus');
    await ensureSidebarOpen(page);
    await page.waitForTimeout(300);

    const beforeChapters = await getChaptersForCurrentDoc(page);
    const before = {
      count: beforeChapters.length,
      names: beforeChapters.map((ch) => ch.name || '')
    };

    await page.click('#writing-focus-add-section');
    await page.waitForTimeout(300);

    const afterChapters = await getChaptersForCurrentDoc(page);
    const after = {
      count: afterChapters.length,
      names: afterChapters.map((ch) => ch.name || '')
    };

    expect(after.count).toBe(before.count + 1);
    expect(after.names.some((name) => name.includes('新しい章'))).toBeTruthy();
    expect(after.names.some((name) => name.includes('新しいセクション'))).toBeFalsy();
  });

  test('章チップクリックでジャンプ (基準#4)', async ({ page }) => {
    await page.goto('/');
    await setUIMode(page, 'focus');
    await ensureSidebarOpen(page);
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      const editor = document.getElementById('editor');
      if (!editor) return;
      editor.value = '## 第一章\n本文A\n## 第二章\n本文B';
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(200);

    const chipsCount = await page.evaluate(() => {
      return document.querySelectorAll('.writing-focus-chip').length;
    });
    expect(chipsCount).toBe(2);

    await page.evaluate(() => {
      const chips = document.querySelectorAll('.writing-focus-chip');
      if (chips[1]) chips[1].click();
    });
    await page.waitForTimeout(100);

    const cursorPosition = await page.evaluate(() => {
      const editor = document.getElementById('editor');
      return editor ? editor.selectionStart : -1;
    });

    const expectedPosition = await page.evaluate(() => {
      const editor = document.getElementById('editor');
      if (!editor) return -1;
      return editor.value.indexOf('## 第二章');
    });

    expect(cursorPosition).toBeGreaterThanOrEqual(expectedPosition);
    expect(cursorPosition).toBeLessThan(expectedPosition + 10);
  });

  test('前/次シーンボタン (基準#5)', async ({ page }) => {
    await page.goto('/');
    await setUIMode(page, 'focus');
    await ensureSidebarOpen(page);
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      const editor = document.getElementById('editor');
      if (!editor) return;
      editor.value = '## 第一章\n### シーン1\n本文1\n### シーン2\n本文2';
      const scene1Pos = editor.value.indexOf('本文1');
      editor.selectionStart = scene1Pos;
      editor.selectionEnd = scene1Pos;
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      editor.dispatchEvent(new Event('keyup', { bubbles: true }));
    });
    await page.waitForTimeout(200);

    const seekButtonsCount = await page.evaluate(() => {
      return document.querySelectorAll('.writing-focus-seek-btn').length;
    });
    expect(seekButtonsCount).toBe(2);

    await page.evaluate(() => {
      const seekButtons = document.querySelectorAll('.writing-focus-seek-btn');
      if (seekButtons[1]) seekButtons[1].click();
    });
    await page.waitForTimeout(100);

    const cursorAfterSeek = await page.evaluate(() => {
      const editor = document.getElementById('editor');
      return editor ? editor.selectionStart : -1;
    });

    const scene2Position = await page.evaluate(() => {
      const editor = document.getElementById('editor');
      if (!editor) return -1;
      return editor.value.indexOf('### シーン2');
    });

    expect(cursorAfterSeek).toBeGreaterThanOrEqual(scene2Position);
    expect(cursorAfterSeek).toBeLessThan(scene2Position + 20);
  });

  test('空ドキュメント (エッジケース)', async ({ page }) => {
    await page.goto('/');
    await setUIMode(page, 'focus');
    await ensureSidebarOpen(page);
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      const editor = document.getElementById('editor');
      if (!editor) return;
      editor.value = '';
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(200);

    await expect(page.locator('.writing-focus-empty')).toBeVisible();

    const beforeChapters = await getChaptersForCurrentDoc(page);
    const before = {
      count: beforeChapters.length,
      names: beforeChapters.map((ch) => ch.name || '')
    };

    await page.click('#writing-focus-add-section');
    await page.waitForTimeout(300);

    const afterChapters = await getChaptersForCurrentDoc(page);
    const after = {
      count: afterChapters.length,
      names: afterChapters.map((ch) => ch.name || '')
    };

    expect(after.count).toBe(before.count + 1);
    expect(after.names.some((name) => name.includes('新しい章'))).toBeTruthy();
  });
});
