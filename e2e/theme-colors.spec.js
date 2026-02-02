// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * 現行UIではツールバーはデフォルトで表示されており、
 * Typography タブはサイドバータブ構成から外れているため、
 * テスト側でサイドバーを開きつつ typography セクションを強制的に表示する。
 * こうすることで、index.html 内のテーマカラーUI（#bg-color / #text-color と
 * data-theme-preset ボタン）を引き続き単一のテスト対象とする。
 */
async function openSidebarAndThemePanel(page) {
  // サイドバーを開く
  await page.waitForSelector('#sidebar', { timeout: 10000 });

  const isOpen = await page.evaluate(() => {
    const sb = document.getElementById('sidebar');
    return !!(sb && sb.classList.contains('open'));
  });

  if (!isOpen) {
    await page.waitForSelector('#toggle-sidebar', { state: 'visible' });
    await page.click('#toggle-sidebar');
  }

  // SidebarManager 経由で typography タブをアクティブにする
  await page.evaluate(() => {
    try {
      if (window.sidebarManager && typeof window.sidebarManager.activateSidebarGroup === 'function') {
        window.sidebarManager.activateSidebarGroup('typography');
      }
    } catch (_) { /* noop */ }
  });

  // ガジェットパネルが表示されるまで待機
  await page.waitForTimeout(1000);

  // テーマ用コントロールが可視になっていることを確認
  await page.waitForSelector('#typography-gadgets-panel #bg-color', { state: 'visible', timeout: 10000 });
  await page.waitForSelector('#typography-gadgets-panel #text-color', { state: 'visible', timeout: 10000 });
  await page.waitForSelector('#typography-gadgets-panel button[data-theme-preset="light"]', { state: 'visible', timeout: 10000 });
}

test.describe('Theme Colors', () => {
  test('should reflect theme colors in color pickers when switching presets', async ({ page }) => {
    await page.goto('/');
    await openSidebarAndThemePanel(page);

    // Test Light theme (typographyパネル内の要素を指定)
    await page.locator('#typography-gadgets-panel button[data-theme-preset="light"]').click();
    await page.waitForTimeout(200);
    await expect(page.locator('#typography-gadgets-panel #bg-color')).toHaveValue('#ffffff');
    await expect(page.locator('#typography-gadgets-panel #text-color')).toHaveValue('#333333');

    // Test Dark theme
    await page.locator('#typography-gadgets-panel button[data-theme-preset="dark"]').click();
    await page.waitForTimeout(200);
    await expect(page.locator('#typography-gadgets-panel #bg-color')).toHaveValue('#1e1e1e');
    await expect(page.locator('#typography-gadgets-panel #text-color')).toHaveValue('#e0e0e0');

    // Test Sepia theme
    await page.locator('#typography-gadgets-panel button[data-theme-preset="sepia"]').click();
    await page.waitForTimeout(200);
    await expect(page.locator('#typography-gadgets-panel #bg-color')).toHaveValue('#f4ecd8');
    await expect(page.locator('#typography-gadgets-panel #text-color')).toHaveValue('#5b4636');
  });

  test('should apply custom colors and persist after reload', async ({ page }) => {
    await page.goto('/');
    await openSidebarAndThemePanel(page);

    // Set custom colors (typographyパネル内の要素を指定)
    await page.evaluate(() => {
      const bgInput = document.getElementById('bg-color');
      const textInput = document.getElementById('text-color');
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
    await expect(page.locator('#typography-gadgets-panel #bg-color')).toHaveValue('#ffcccc');
    await expect(page.locator('#typography-gadgets-panel #text-color')).toHaveValue('#003300');

    // Reload and verify persistence
    await page.reload();
    await openSidebarAndThemePanel(page);

    await expect(page.locator('#typography-gadgets-panel #bg-color')).toHaveValue('#ffcccc');
    await expect(page.locator('#typography-gadgets-panel #text-color')).toHaveValue('#003300');
  });

  test('should reset custom colors to theme defaults', async ({ page }) => {
    await page.goto('/');
    await openSidebarAndThemePanel(page);

    // Set custom colors (typographyパネル内の要素を指定)
    await page.evaluate(() => {
      const bgInput = document.getElementById('bg-color');
      const textInput = document.getElementById('text-color');
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
    await page.locator('#typography-gadgets-panel #reset-colors').click();
    await page.waitForTimeout(200);

    // Verify colors reset to light theme defaults (assuming light is active)
    await page.locator('#typography-gadgets-panel button[data-theme-preset="light"]').click();
    await page.waitForTimeout(200);
    await expect(page.locator('#typography-gadgets-panel #bg-color')).toHaveValue('#ffffff');
    await expect(page.locator('#typography-gadgets-panel #text-color')).toHaveValue('#333333');
  });
});
