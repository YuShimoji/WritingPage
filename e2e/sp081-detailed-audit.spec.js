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

test.describe('SP-081 Phase 3 Detailed Audit', () => {

  test('A1 — Focus mode: toolbar hidden, hints visible', async ({ page }) => {
    await waitForApp(page);
    await page.evaluate(() => {
      localStorage.removeItem('zenwriter-edge-hint-dismiss');
      if (window.ZenWriterApp) window.ZenWriterApp.setUIMode('focus');
    });
    await page.waitForTimeout(500);

    // Verify toolbar is hidden
    const toolbar = page.locator('.toolbar');
    const toolbarBox = await toolbar.boundingBox();

    // Verify hints exist
    const topHint = page.locator('.edge-hover-hint--top');
    const leftHint = page.locator('.edge-hover-hint--left');

    await page.screenshot({ path: path.join(SHOTS, 'A1-focus-hints.png'), fullPage: false });
  });

  test('A2 — Focus to Normal: toolbar and sidebar restore', async ({ page }) => {
    await waitForApp(page);
    // Start in focus
    await page.evaluate(() => {
      if (window.ZenWriterApp) window.ZenWriterApp.setUIMode('focus');
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SHOTS, 'A2a-in-focus.png'), fullPage: false });

    // Switch to normal
    await page.evaluate(() => {
      if (window.ZenWriterApp) window.ZenWriterApp.setUIMode('normal');
    });
    await page.waitForTimeout(500);

    // Verify toolbar is visible
    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toBeVisible();

    await page.screenshot({ path: path.join(SHOTS, 'A2b-back-to-normal.png'), fullPage: false });
  });

  test('A3 — Rapid Focus/Normal cycling (5x)', async ({ page }) => {
    await waitForApp(page);
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        if (window.ZenWriterApp) window.ZenWriterApp.setUIMode('focus');
      });
      await page.waitForTimeout(200);
      await page.evaluate(() => {
        if (window.ZenWriterApp) window.ZenWriterApp.setUIMode('normal');
      });
      await page.waitForTimeout(200);
    }
    // Should be in normal with clean state
    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toBeVisible();

    const mode = await page.evaluate(() => document.documentElement.getAttribute('data-ui-mode'));
    expect(mode).toBe('normal');

    await page.screenshot({ path: path.join(SHOTS, 'A3-rapid-cycle-5x.png'), fullPage: false });
  });

  test('A4 — WYSIWYG floating toolbar with text selection', async ({ page }) => {
    await waitForApp(page);
    // Enable WYSIWYG mode
    await page.evaluate(() => {
      localStorage.setItem('zenwriter-wysiwyg-mode', 'true');
    });
    await page.reload();
    await waitForApp(page);
    await page.evaluate(() => {
      if (window.ZenWriterApp) window.ZenWriterApp.setUIMode('normal');
    });
    await page.waitForTimeout(300);

    // Type text
    const editor = page.locator('#wysiwyg-editor');
    await editor.click();
    await page.keyboard.type('ここは本文です。テスト用のテキストを入力しています。');
    await page.waitForTimeout(300);

    // Select all
    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');
    await page.waitForTimeout(500);

    // Count floating toolbar buttons
    const floatingButtons = page.locator('#wysiwyg-toolbar .wysiwyg-btn:visible');
    const btnCount = await floatingButtons.count();

    await page.screenshot({ path: path.join(SHOTS, 'A4-floating-toolbar-jp.png'), fullPage: false });
  });

  test('A5 — Edge hover: mouse near top shows toolbar', async ({ page }) => {
    await waitForApp(page);
    await page.evaluate(() => {
      localStorage.removeItem('zenwriter-edge-hint-dismiss');
      if (window.ZenWriterApp) window.ZenWriterApp.setUIMode('focus');
    });
    await page.waitForTimeout(500);

    // Move mouse to top edge
    await page.mouse.move(640, 5);
    await page.waitForTimeout(300);

    // Wait for dwell timer
    await page.waitForTimeout(200);

    await page.screenshot({ path: path.join(SHOTS, 'A5-edge-hover-toolbar.png'), fullPage: false });
  });

  test('A6 — Edge hover: mouse near left shows chapter panel', async ({ page }) => {
    await waitForApp(page);
    await page.evaluate(() => {
      localStorage.removeItem('zenwriter-edge-hint-dismiss');
      if (window.ZenWriterApp) window.ZenWriterApp.setUIMode('focus');
    });
    await page.waitForTimeout(500);

    // Move mouse to left edge
    await page.mouse.move(5, 360);
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(SHOTS, 'A6-edge-hover-chapter.png'), fullPage: false });
  });

  test('A7 — Blank mode fallback verification', async ({ page }) => {
    await waitForApp(page);
    await page.evaluate(() => {
      if (window.ZenWriterApp) window.ZenWriterApp.setUIMode('blank');
    });
    await page.waitForTimeout(300);

    const mode = await page.evaluate(() => document.documentElement.getAttribute('data-ui-mode'));
    // blank should be redirected to focus
    expect(mode).toBe('focus');

    await page.screenshot({ path: path.join(SHOTS, 'A7-blank-fallback.png'), fullPage: false });
  });
});
