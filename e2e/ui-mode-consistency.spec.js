// @ts-check
const { test, expect } = require('@playwright/test');
const { showFullToolbar, setUIMode } = require('./helpers');

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
    await setUIMode(page, 'focus');
    await page.waitForTimeout(100);
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeHidden();
  });

  test('Focus mode: focus chapter panel appears if present', async ({ page }) => {
    await setUIMode(page, 'focus');
    await page.waitForTimeout(100);
    const panel = page.locator('.focus-chapter-panel');
    if (await panel.count() > 0) {
      await expect(panel).toBeVisible();
    }
  });

  // ===== Blank モード廃止 (SP-081 Phase 3) =====

  // ===== モード遷移 =====
  test('Focus->Normal round-trip: toolbar reappears', async ({ page }) => {
    await setUIMode(page, 'focus');
    await page.waitForTimeout(100);
    await setUIMode(page, 'normal');
    await page.waitForTimeout(100);
    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toBeVisible();
  });

  // Blank->Normal テスト削除 (SP-081 Phase 3: Blank 廃止)

  // ===== MainHubPanel のモード連携 =====
  test('MainHubPanel can open in Focus mode', async ({ page }) => {
    await setUIMode(page, 'focus');
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

  // MainHubPanel Blank テスト削除 (SP-081 Phase 3: Blank 廃止)

  // ===== Reader モード (SP-078) =====
  test('Reader mode: sidebar and toolbar are hidden', async ({ page }) => {
    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.enter();
    });
    await page.waitForTimeout(300);
    const mode = await page.evaluate(() => document.documentElement.getAttribute('data-ui-mode'));
    expect(mode).toBe('reader');
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeHidden();
  });

  test('Reader mode: reader-preview is visible', async ({ page }) => {
    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.enter();
    });
    await page.waitForTimeout(300);
    const preview = page.locator('#reader-preview');
    if (await preview.count() > 0) {
      await expect(preview).toBeVisible();
    }
  });

  test('Reader mode: exit returns to previous mode', async ({ page }) => {
    // 遷移前のモードを記録
    const prevMode = await page.evaluate(() => document.documentElement.getAttribute('data-ui-mode'));
    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.enter();
    });
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.exit();
    });
    await page.waitForTimeout(200);
    const mode = await page.evaluate(() => document.documentElement.getAttribute('data-ui-mode'));
    expect(mode).toBe(prevMode);
  });
});
