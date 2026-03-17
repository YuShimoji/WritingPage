// @ts-check
const { test, expect } = require('@playwright/test');
const { showFullToolbar } = require('./helpers');

/** UIモード (Normal/Focus/Blank) の表示整合性テスト */
test.describe('UI Mode Consistency', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await showFullToolbar(page);
  });

  // ===== Normal モード (デフォルト) =====
  test('Normal mode: toolbar is visible', async ({ page }) => {
    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toBeVisible();
  });

  // ===== Focus モード =====
  test('Focus mode: sidebar is hidden by CSS', async ({ page }) => {
    await page.evaluate(() => document.documentElement.setAttribute('data-ui-mode', 'focus'));
    await page.waitForTimeout(100);
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeHidden();
  });

  test('Focus mode: focus chapter panel appears if present', async ({ page }) => {
    await page.evaluate(() => document.documentElement.setAttribute('data-ui-mode', 'focus'));
    await page.waitForTimeout(100);
    const panel = page.locator('.focus-chapter-panel');
    if (await panel.count() > 0) {
      await expect(panel).toBeVisible();
    }
  });

  // ===== Blank モード =====
  test('Blank mode: sidebar is hidden by CSS', async ({ page }) => {
    await page.evaluate(() => document.documentElement.setAttribute('data-ui-mode', 'blank'));
    await page.waitForTimeout(100);
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeHidden();
  });

  test('Blank mode: status bar is hidden if present', async ({ page }) => {
    await page.evaluate(() => document.documentElement.setAttribute('data-ui-mode', 'blank'));
    await page.waitForTimeout(100);
    const statusBar = page.locator('#editor-bottom-nav');
    if (await statusBar.count() > 0) {
      await expect(statusBar).toBeHidden();
    }
  });

  // ===== モード遷移 =====
  test('Focus->Normal round-trip: toolbar reappears', async ({ page }) => {
    await page.evaluate(() => document.documentElement.setAttribute('data-ui-mode', 'focus'));
    await page.waitForTimeout(100);
    await page.evaluate(() => document.documentElement.setAttribute('data-ui-mode', 'normal'));
    await page.waitForTimeout(100);
    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toBeVisible();
  });

  test('Blank->Normal round-trip: toolbar reappears', async ({ page }) => {
    await page.evaluate(() => document.documentElement.setAttribute('data-ui-mode', 'blank'));
    await page.waitForTimeout(100);
    await page.evaluate(() => document.documentElement.setAttribute('data-ui-mode', 'normal'));
    await page.waitForTimeout(100);
    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toBeVisible();
  });

  // ===== MainHubPanel のモード連携 =====
  test('MainHubPanel can open in Focus mode', async ({ page }) => {
    await page.evaluate(() => document.documentElement.setAttribute('data-ui-mode', 'focus'));
    await page.waitForTimeout(100);
    await page.evaluate(() => {
      if (window.MainHubPanel) window.MainHubPanel.show('search');
    });
    await page.waitForTimeout(200);
    const panel = page.locator('#main-hub-panel');
    if (await panel.count() > 0) {
      await expect(panel).toBeVisible();
    }
  });

  test('MainHubPanel can open in Blank mode', async ({ page }) => {
    await page.evaluate(() => document.documentElement.setAttribute('data-ui-mode', 'blank'));
    await page.waitForTimeout(100);
    await page.evaluate(() => {
      if (window.MainHubPanel) window.MainHubPanel.show('search');
    });
    await page.waitForTimeout(200);
    const panel = page.locator('#main-hub-panel');
    if (await panel.count() > 0) {
      await expect(panel).toBeVisible();
    }
  });
});
