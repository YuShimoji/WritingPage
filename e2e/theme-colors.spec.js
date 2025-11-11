// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Theme Colors', () => {
  test('should reflect theme colors in color pickers when switching presets', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#show-toolbar', { state: 'visible' });
    await page.click('#show-toolbar');
    await page.waitForSelector('#toggle-sidebar', { state: 'visible' });
    await page.click('#toggle-sidebar');
    await page.locator('#sidebar-tab-typography').waitFor();
    await page.click('#sidebar-tab-typography');

    // Test Light theme
    await page.locator('button[data-theme-preset="light"]').click();
    await expect(page.locator('#bg-color')).toHaveValue('#ffffff');
    await expect(page.locator('#text-color')).toHaveValue('#333333');

    // Test Dark theme
    await page.locator('button[data-theme-preset="dark"]').click();
    await expect(page.locator('#bg-color')).toHaveValue('#1e1e1e');
    await expect(page.locator('#text-color')).toHaveValue('#e0e0e0');

    // Test Sepia theme
    await page.locator('button[data-theme-preset="sepia"]').click();
    await expect(page.locator('#bg-color')).toHaveValue('#f4ecd8');
    await expect(page.locator('#text-color')).toHaveValue('#5b4636');
  });

  test('should apply custom colors and persist after reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#show-toolbar', { state: 'visible' });
    await page.click('#show-toolbar');
    await page.waitForSelector('#toggle-sidebar', { state: 'visible' });
    await page.click('#toggle-sidebar');
    await page.locator('#sidebar-tab-typography').waitFor();
    await page.click('#sidebar-tab-typography');

    // Set custom colors
    await page.locator('#bg-color').fill('#ffcccc');
    await page.locator('#text-color').fill('#003300');

    // Verify editor background color changed
    const editor = page.locator('#editor');
    const bgColor = await editor.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    // RGB conversion: #ffcccc ≈ rgb(255, 204, 204)
    expect(bgColor).toContain('255');
    expect(bgColor).toContain('204');

    // Reload and verify persistence
    await page.reload();
    await page.waitForSelector('#toggle-sidebar', { state: 'visible' });
    await page.click('#toggle-sidebar');
    await page.locator('#sidebar-tab-typography').waitFor();
    await page.click('#sidebar-tab-typography');

    await expect(page.locator('#bg-color')).toHaveValue('#ffcccc');
    await expect(page.locator('#text-color')).toHaveValue('#003300');
  });

  test('should reset custom colors to theme defaults', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#show-toolbar', { state: 'visible' });
    await page.click('#show-toolbar');
    await page.waitForSelector('#toggle-sidebar', { state: 'visible' });
    await page.click('#toggle-sidebar');
    await page.locator('#sidebar-tab-typography').waitFor();
    await page.click('#sidebar-tab-typography');

    // Set custom colors
    await page.locator('#bg-color').fill('#112233');
    await page.locator('#text-color').fill('#aabbcc');

    // Click reset button
    await page.locator('#reset-colors').click();

    // Verify colors reset to light theme defaults (assuming light is active)
    await page.locator('button[data-theme-preset="light"]').click();
    await expect(page.locator('#bg-color')).toHaveValue('#ffffff');
    await expect(page.locator('#text-color')).toHaveValue('#333333');
  });
});
