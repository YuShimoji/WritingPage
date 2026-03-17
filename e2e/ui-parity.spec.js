// @ts-check
const { test, expect } = require('@playwright/test');
const { showFullToolbar } = require('./helpers');

/** サイドバー⇔ツールバー⇔MainHubPanel 機能等価性テスト */
test.describe('UI Parity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await showFullToolbar(page);
  });

  // ===== プレビュー切替 =====
  test('toolbar preview toggle works', async ({ page }) => {
    const btn = page.locator('#toggle-preview');
    if (await btn.count() === 0) return;

    await btn.click();
    await page.waitForTimeout(200);
    const preview = page.locator('#editor-preview');
    if (await preview.count() > 0) {
      await expect(preview).toBeVisible();
    }
  });

  // ===== 分割ビュー =====
  test('toolbar split-view opens MainHubPanel', async ({ page }) => {
    const btn = page.locator('#toggle-split-view');
    if (await btn.count() === 0) return;

    await btn.click();
    await page.waitForTimeout(300);
    const panel = page.locator('#main-hub-panel');
    await expect(panel).toBeVisible();
  });

  // ===== 装飾パネル =====
  test('font-decoration button opens MainHubPanel', async ({ page }) => {
    const btn = page.locator('#toggle-font-decoration');
    if (await btn.count() === 0) return;

    await btn.click();
    await page.waitForTimeout(300);
    const panel = page.locator('#main-hub-panel');
    await expect(panel).toBeVisible();
  });

  // ===== アニメーションパネル =====
  test('text-animation button opens MainHubPanel', async ({ page }) => {
    const btn = page.locator('#toggle-text-animation');
    if (await btn.count() === 0) return;

    await btn.click();
    await page.waitForTimeout(300);
    const panel = page.locator('#main-hub-panel');
    await expect(panel).toBeVisible();
  });

  // ===== 検索パネル (JS API 経由) =====
  test('EditorSearch.toggleSearchPanel opens MainHubPanel', async ({ page }) => {
    await page.evaluate(() => {
      if (window.ZenWriterEditor && typeof window.ZenWriterEditor.toggleSearchPanel === 'function') {
        window.ZenWriterEditor.toggleSearchPanel();
      }
    });
    await page.waitForTimeout(500);
    const panel = page.locator('#main-hub-panel');
    await expect(panel).toBeVisible();
  });

  // ===== コマンドパレット経由 (JS API 直呼び) =====
  test('MainHubPanel.toggle decoration works directly', async ({ page }) => {
    await page.evaluate(() => {
      if (window.MainHubPanel) window.MainHubPanel.toggle('decoration');
    });
    await page.waitForTimeout(300);
    const panel = page.locator('#main-hub-panel');
    await expect(panel).toBeVisible();
  });

  test('MainHubPanel.toggle split-view works directly', async ({ page }) => {
    await page.evaluate(() => {
      if (window.MainHubPanel) window.MainHubPanel.toggle('split-view');
    });
    await page.waitForTimeout(300);
    const panel = page.locator('#main-hub-panel');
    await expect(panel).toBeVisible();
  });

  // ===== テーマ切替 =====
  test('toolbar theme toggle changes data-theme', async ({ page }) => {
    const btn = page.locator('#toggle-theme');
    if (await btn.count() === 0) return;

    const initial = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    await btn.click();
    await page.waitForTimeout(200);
    const after = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(after).not.toBe(initial);
  });

  // ===== ヘルプモーダル =====
  test('toolbar help button opens help modal', async ({ page }) => {
    const btn = page.locator('#toggle-help-modal');
    if (await btn.count() === 0) return;

    await btn.click();
    await page.waitForTimeout(300);
    const modal = page.locator('#help-modal');
    await expect(modal).toBeVisible();
  });
});
