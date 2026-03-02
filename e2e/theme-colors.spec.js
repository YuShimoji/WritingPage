// @ts-check
const { test, expect } = require('@playwright/test');
const { enableAllGadgets } = require('./helpers');

/**
 * v0.3.25: Typography タブは削除され、テーマ設定は settings グループの Themes ガジェットに移動。
 * サイドバーを開き、settings タブをアクティブにして Themes ガジェット内の
 * テーマプリセットボタンとカラーピッカーにアクセスする。
 */
async function openSidebarAndThemePanel(page) {
  await page.waitForSelector('#sidebar', { timeout: 10000 });
  await enableAllGadgets(page);

  const isOpen = await page.evaluate(() => {
    const sb = document.getElementById('sidebar');
    return !!(sb && sb.classList.contains('open'));
  });

  if (!isOpen) {
    await page.waitForSelector('#toggle-sidebar', { state: 'visible' });
    await page.click('#toggle-sidebar');
  }

  // SidebarManager 経由で settings タブをアクティブにする
  await page.evaluate(() => {
    try {
      if (window.sidebarManager && typeof window.sidebarManager.activateSidebarGroup === 'function') {
        window.sidebarManager.activateSidebarGroup('settings');
      }
    } catch (_) { /* noop */ }
  });

  // ガジェットパネルが表示されるまで待機
  await page.waitForTimeout(1000);

  // Themes ガジェット内のテーマ用コントロールが可視になっていることを確認
  await page.waitForSelector('.gadget-themes #bg-color', { state: 'visible', timeout: 10000 });
  await page.waitForSelector('.gadget-themes #text-color', { state: 'visible', timeout: 10000 });
  await page.waitForSelector('.gadget-themes button[data-theme-preset="light"]', { state: 'visible', timeout: 10000 });
}

test.describe('Theme Colors', () => {
  test('should reflect theme colors in color pickers when switching presets', async ({ page }) => {
    await page.goto('/');
    await openSidebarAndThemePanel(page);

    // Test Light theme (Themes ガジェット内の要素を指定)
    await page.locator('.gadget-themes button[data-theme-preset="light"]').click();
    await page.waitForTimeout(200);
    await expect(page.locator('.gadget-themes #bg-color')).toHaveValue('#ffffff');
    await expect(page.locator('.gadget-themes #text-color')).toHaveValue('#333333');

    // Test Dark theme
    await page.locator('.gadget-themes button[data-theme-preset="dark"]').click();
    await page.waitForTimeout(200);
    await expect(page.locator('.gadget-themes #bg-color')).toHaveValue('#1e1e1e');
    await expect(page.locator('.gadget-themes #text-color')).toHaveValue('#e0e0e0');

    // Test Sepia theme
    await page.locator('.gadget-themes button[data-theme-preset="sepia"]').click();
    await page.waitForTimeout(200);
    await expect(page.locator('.gadget-themes #bg-color')).toHaveValue('#f4ecd8');
    await expect(page.locator('.gadget-themes #text-color')).toHaveValue('#5b4636');
  });

  test('should apply custom colors and persist after reload', async ({ page }) => {
    await page.goto('/');
    await openSidebarAndThemePanel(page);

    // Set custom colors (Themes ガジェット内の要素を指定)
    await page.evaluate(() => {
      const themesGadget = document.querySelector('.gadget-themes');
      if (!themesGadget) return;
      const bgInput = themesGadget.querySelector('#bg-color');
      const textInput = themesGadget.querySelector('#text-color');
      if (bgInput) {
        bgInput.value = '#ffcccc';
        bgInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (textInput) {
        textInput.value = '#003300';
        textInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.waitForTimeout(500);

    // Verify color pickers have the custom values
    await expect(page.locator('.gadget-themes #bg-color')).toHaveValue('#ffcccc');
    await expect(page.locator('.gadget-themes #text-color')).toHaveValue('#003300');

    // Reload and verify persistence
    await page.reload();
    await openSidebarAndThemePanel(page);

    await expect(page.locator('.gadget-themes #bg-color')).toHaveValue('#ffcccc');
    await expect(page.locator('.gadget-themes #text-color')).toHaveValue('#003300');
  });

  test('should reset custom colors to theme defaults', async ({ page }) => {
    await page.goto('/');
    await openSidebarAndThemePanel(page);

    // Set custom colors (Themes ガジェット内の要素を指定)
    await page.evaluate(() => {
      const themesGadget = document.querySelector('.gadget-themes');
      if (!themesGadget) return;
      const bgInput = themesGadget.querySelector('#bg-color');
      const textInput = themesGadget.querySelector('#text-color');
      if (bgInput) {
        bgInput.value = '#112233';
        bgInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (textInput) {
        textInput.value = '#aabbcc';
        textInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.waitForTimeout(500);

    // Click reset button
    await page.locator('.gadget-themes #reset-colors').click();
    await page.waitForTimeout(200);

    // Verify colors reset to light theme defaults (assuming light is active)
    await page.locator('.gadget-themes button[data-theme-preset="light"]').click();
    await page.waitForTimeout(200);
    await expect(page.locator('.gadget-themes #bg-color')).toHaveValue('#ffffff');
    await expect(page.locator('.gadget-themes #text-color')).toHaveValue('#333333');
  });
});
