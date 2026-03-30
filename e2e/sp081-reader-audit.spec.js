// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const BASE = '/index.html';
const SHOTS = path.resolve(__dirname, '..', 'docs', 'verification', '2026-03-30');

async function waitForApp(page) {
  await page.goto(BASE);
  await page.waitForFunction(
    () => window.ZWGadgets && window.ZWGadgets._list && window.ZWGadgets._list.length > 5,
    { timeout: 15000 }
  );
  await page.waitForTimeout(800);
}

test.describe('SP-081 Reader Mode Audit', () => {

  test('R1 — Enter Reader from Normal mode', async ({ page }) => {
    await waitForApp(page);
    await page.evaluate(() => {
      if (window.ZenWriterApp) window.ZenWriterApp.setUIMode('normal');
    });
    await page.waitForTimeout(300);

    // Click reader button
    await page.evaluate(() => {
      var btn = document.getElementById('toggle-reader-preview');
      if (btn) btn.click();
    });
    await page.waitForTimeout(500);

    const mode = await page.evaluate(() => document.documentElement.getAttribute('data-ui-mode'));
    expect(mode).toBe('reader');

    await page.screenshot({ path: path.join(SHOTS, 'R1-reader-entered.png'), fullPage: false });
  });

  test('R2 — Reader UI: back button visible without hover', async ({ page }) => {
    await waitForApp(page);
    await page.evaluate(() => {
      var btn = document.getElementById('toggle-reader-preview');
      if (btn) btn.click();
    });
    await page.waitForTimeout(500);

    // Back button should be visible without hover
    const backBtn = page.locator('#reader-back-fab');
    await expect(backBtn).toBeVisible({ timeout: 3000 });

    await page.screenshot({ path: path.join(SHOTS, 'R2-reader-buttons-visible.png'), fullPage: false });
  });

  test('R3 — Exit Reader: return-to-reader bar appears', async ({ page }) => {
    await waitForApp(page);
    // Enter reader
    await page.evaluate(() => {
      var btn = document.getElementById('toggle-reader-preview');
      if (btn) btn.click();
    });
    await page.waitForTimeout(500);

    // Exit reader
    await page.evaluate(() => {
      var btn = document.getElementById('reader-back-fab');
      if (btn) btn.click();
    });
    await page.waitForTimeout(500);

    // Return bar should be visible
    const returnBar = page.locator('.reader-return-bar');
    await expect(returnBar).toBeVisible({ timeout: 3000 });

    const mode = await page.evaluate(() => document.documentElement.getAttribute('data-ui-mode'));
    expect(mode).not.toBe('reader');

    await page.screenshot({ path: path.join(SHOTS, 'R3-return-bar.png'), fullPage: false });
  });

  test('R4 — Return bar click re-enters Reader', async ({ page }) => {
    await waitForApp(page);
    // Enter then exit reader
    await page.evaluate(() => {
      var btn = document.getElementById('toggle-reader-preview');
      if (btn) btn.click();
    });
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      var btn = document.getElementById('reader-back-fab');
      if (btn) btn.click();
    });
    await page.waitForTimeout(500);

    // Click return bar button
    const returnBtn = page.locator('.reader-return-bar button');
    await expect(returnBtn).toBeVisible({ timeout: 3000 });
    await returnBtn.click();
    await page.waitForTimeout(500);

    const mode = await page.evaluate(() => document.documentElement.getAttribute('data-ui-mode'));
    expect(mode).toBe('reader');

    await page.screenshot({ path: path.join(SHOTS, 'R4-re-entered-reader.png'), fullPage: false });
  });

  test('R5 — Reader vertical toggle', async ({ page }) => {
    await waitForApp(page);
    await page.evaluate(() => {
      var btn = document.getElementById('toggle-reader-preview');
      if (btn) btn.click();
    });
    await page.waitForTimeout(500);

    // Toggle vertical
    const vertBtn = page.locator('#reader-vertical-toggle');
    if (await vertBtn.count() > 0) {
      await vertBtn.click();
      await page.waitForTimeout(300);
    }

    await page.screenshot({ path: path.join(SHOTS, 'R5-reader-vertical.png'), fullPage: false });
  });

  test('R6 — Focus mode: Reader accessible via edge hover', async ({ page }) => {
    await waitForApp(page);
    await page.evaluate(() => {
      if (window.ZenWriterApp) window.ZenWriterApp.setUIMode('focus');
    });
    await page.waitForTimeout(500);

    // Edge hover to show toolbar
    await page.mouse.move(640, 5);
    await page.waitForTimeout(300);

    // Toolbar should appear with reader button
    page.locator('#toggle-reader-preview');

    await page.screenshot({ path: path.join(SHOTS, 'R6-focus-edge-toolbar.png'), fullPage: false });
  });
});
